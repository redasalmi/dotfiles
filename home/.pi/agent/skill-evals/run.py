#!/usr/bin/env python3
"""Run lightweight behavioral evaluations against Pi skills.

The runner performs deterministic assertions and stores model output for human
review. It intentionally does not use an LLM-as-judge by default: passing regex
checks is a smoke test, not proof of quality.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
AGENT_DIR = HERE.parent
SKILLS_DIR = AGENT_DIR / "skills"
FIXTURE_SCRIPT = HERE / "fixtures" / "create_repo.py"
DEFAULT_SKILLS = ["code-review", "jira-steps-to-test", "pr-description", "prompt-enhancer", "design-director"]


def load_cases(skill: str) -> list[dict[str, Any]]:
    path = SKILLS_DIR / skill / "evals" / "cases.json"
    if not path.is_file():
        raise FileNotFoundError(f"No evaluation cases at {path}")
    data = json.loads(path.read_text())
    if data.get("skill") != skill or not isinstance(data.get("cases"), list):
        raise ValueError(f"Invalid case file: {path}")
    return data["cases"]


def make_fixture(scenario: str, destination: Path) -> dict[str, str]:
    completed = subprocess.run(
        [sys.executable, str(FIXTURE_SCRIPT), scenario, str(destination)],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout.strip())


def run_assertions(output: str, assertions: list[dict[str, Any]], cwd: Path) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for assertion in assertions:
        kind = assertion["kind"]
        passed = False
        detail = ""
        if kind == "regex":
            pattern = assertion["pattern"]
            passed = re.search(pattern, output, re.IGNORECASE | re.MULTILINE | re.DOTALL) is not None
            detail = pattern
        elif kind == "not_regex":
            pattern = assertion["pattern"]
            passed = re.search(pattern, output, re.IGNORECASE | re.MULTILINE | re.DOTALL) is None
            detail = pattern
        elif kind == "min_regex":
            pattern = assertion["pattern"]
            actual = len(re.findall(pattern, output, re.IGNORECASE | re.MULTILINE))
            minimum = int(assertion["value"])
            passed = actual >= minimum
            detail = f"{actual} >= {minimum}: {pattern}"
        elif kind == "max_words":
            actual = len(output.split())
            limit = int(assertion["value"])
            passed = actual <= limit
            detail = f"{actual} <= {limit}"
        elif kind == "git_clean":
            completed = subprocess.run(
                ["git", "status", "--porcelain"], cwd=cwd, check=True, capture_output=True, text=True
            )
            passed = not completed.stdout.strip()
            detail = completed.stdout.strip() or "clean"
        elif kind == "file_exists":
            target = cwd / assertion["path"]
            passed = target.exists()
            detail = str(target)
        else:
            raise ValueError(f"Unknown assertion kind: {kind}")
        results.append({"kind": kind, "passed": passed, "detail": detail})
    return results


def model_spec(args: argparse.Namespace) -> str:
    model = args.model or os.environ.get("PI_MODEL")
    provider = args.provider or os.environ.get("PI_PROVIDER")
    if not model:
        raise ValueError("Specify --model or set PI_MODEL")
    if "/" not in model and provider:
        return f"{provider}/{model}"
    return model


def select_cases(skills: list[str], case_ids: set[str]) -> list[tuple[str, dict[str, Any]]]:
    selected: list[tuple[str, dict[str, Any]]] = []
    for skill in skills:
        for case in load_cases(skill):
            if not case_ids or case["id"] in case_ids or f"{skill}:{case['id']}" in case_ids:
                selected.append((skill, case))
    return selected


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("skills", nargs="*", choices=DEFAULT_SKILLS, help="Skills to evaluate; defaults to all")
    parser.add_argument("--case", action="append", default=[], help="Case id or skill:case id; repeatable")
    parser.add_argument("--list", action="store_true", help="List selected cases without running models")
    parser.add_argument("--static", action="store_true", help="Validate fixtures and case schemas without model calls")
    parser.add_argument("--model", help="Pi model id; defaults to PI_MODEL")
    parser.add_argument("--provider", help="Provider when --model has no provider prefix; defaults to PI_PROVIDER")
    parser.add_argument("--thinking", default="high", help="Pi thinking level for evaluations")
    parser.add_argument("--timeout", type=int, default=600, help="Seconds per model call")
    parser.add_argument("--results", type=Path, help="Result directory")
    parser.add_argument("--keep-repos", action="store_true", help="Copy generated fixture repositories into results")
    args = parser.parse_args()

    skills = args.skills or DEFAULT_SKILLS
    selected = select_cases(skills, set(args.case))
    if not selected:
        print("No cases selected", file=sys.stderr)
        return 2

    if args.list:
        for skill, case in selected:
            print(f"{skill}:{case['id']} — {case['description']}")
        return 0

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    results_dir = (args.results or HERE / "results" / stamp).resolve()
    results_dir.mkdir(parents=True, exist_ok=True)
    (HERE / "results").mkdir(exist_ok=True)

    summary: list[dict[str, Any]] = []
    model = None if args.static else model_spec(args)

    for skill, case in selected:
        case_name = f"{skill}__{case['id']}"
        with tempfile.TemporaryDirectory(prefix=f"pi-{case_name}-") as temp:
            temp_path = Path(temp)
            cwd = temp_path
            fixture_meta = {"base": "main", "head": "HEAD", "repo": str(cwd)}
            if scenario := case.get("fixture"):
                cwd = temp_path / "repo"
                fixture_meta = make_fixture(scenario, cwd)

            prompt = case["prompt"].format(**fixture_meta)
            record: dict[str, Any] = {
                "skill": skill,
                "case": case["id"],
                "description": case["description"],
                "fixture": case.get("fixture"),
                "prompt": prompt,
                "manual_rubric": case.get("manual_rubric", []),
            }

            if args.static:
                record["status"] = "static-ok"
                record["assertions"] = []
            else:
                command = [
                    "pi",
                    "--print",
                    "--no-session",
                    "--no-skills",
                    "--skill",
                    str(SKILLS_DIR / skill),
                    "--model",
                    model,
                    "--thinking",
                    args.thinking,
                    prompt,
                ]
                try:
                    completed = subprocess.run(
                        command,
                        cwd=cwd,
                        capture_output=True,
                        text=True,
                        timeout=args.timeout,
                    )
                    output = completed.stdout.strip()
                    assertion_results = run_assertions(output, case.get("assertions", []), cwd)
                    passed = completed.returncode == 0 and all(item["passed"] for item in assertion_results)
                    record.update(
                        {
                            "status": "passed" if passed else "failed",
                            "model": model,
                            "returncode": completed.returncode,
                            "output": output,
                            "stderr": completed.stderr.strip(),
                            "assertions": assertion_results,
                        }
                    )
                except subprocess.TimeoutExpired as error:
                    record.update(
                        {
                            "status": "timeout",
                            "model": model,
                            "output": (error.stdout or "").strip() if isinstance(error.stdout, str) else "",
                            "stderr": (error.stderr or "").strip() if isinstance(error.stderr, str) else "",
                            "assertions": [],
                        }
                    )

            if args.keep_repos and case.get("fixture"):
                destination = results_dir / f"{case_name}__repo"
                shutil.copytree(cwd, destination, ignore=shutil.ignore_patterns(".git"))

            (results_dir / f"{case_name}.json").write_text(json.dumps(record, indent=2) + "\n")
            summary.append(record)
            print(f"{record['status']:>9}  {skill}:{case['id']}")

    passed = sum(item["status"] in {"passed", "static-ok"} for item in summary)
    summary_record = {
        "created": dt.datetime.now(dt.timezone.utc).isoformat(),
        "mode": "static" if args.static else "model",
        "model": model,
        "passed": passed,
        "total": len(summary),
        "cases": [{"skill": x["skill"], "case": x["case"], "status": x["status"]} for x in summary],
    }
    (results_dir / "summary.json").write_text(json.dumps(summary_record, indent=2) + "\n")
    print(f"\n{passed}/{len(summary)} automated checks passed; inspect manual rubrics in {results_dir}")
    return 0 if passed == len(summary) else 1


if __name__ == "__main__":
    raise SystemExit(main())
