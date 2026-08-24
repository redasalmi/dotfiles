# Pi Skill Evaluations

This harness evaluates the global skills in `../skills/` against deterministic, representative fixtures.

It has two layers:

1. **Automated smoke assertions** catch structural regressions, invented findings, wrong templates, excessive output, and forbidden edits.
2. **Manual rubrics** in each case assess usefulness, factuality, prioritization, and audience fit. Automated regex checks alone are not proof of quality.

## List cases

```bash
python ~/.pi/agent/skill-evals/run.py --list
```

## Validate fixtures without model calls

```bash
python ~/.pi/agent/skill-evals/run.py --static
```

## Run one skill or case

```bash
python ~/.pi/agent/skill-evals/run.py code-review
python ~/.pi/agent/skill-evals/run.py code-review --case auth-bypass
python ~/.pi/agent/skill-evals/run.py --case prompt-enhancer:pi-coding-task
```

The runner defaults to `PI_PROVIDER` and `PI_MODEL`. Override them explicitly when comparing models:

```bash
python ~/.pi/agent/skill-evals/run.py prompt-enhancer \
  --model openai-codex/gpt-5.6-sol \
  --thinking high
```

Outputs are written to `results/<timestamp>/`. Each JSON result contains the exact prompt, model output, automated assertions, and manual rubric.

## Current baseline

`results/20260816-gpt-5.6-sol-baseline/summary.json` records **14/14 passing behavioral smoke cases** on Pi 0.84.2 with `openai-codex/gpt-5.6-sol` at `high` reasoning. All outputs passed an agent rubric review; independent human review is still explicitly marked as not run.

## Fair comparisons

When evaluating a skill revision or comparing models, keep constant:

- fixture revision;
- Pi version;
- model/provider and reasoning level;
- enabled tools and network policy;
- task prompt;
- timeout and execution environment.

Run every case more than once before drawing reliability conclusions. Record false positives, missing findings, fabricated claims, audience failures, and unnecessary context. Add a regression case for each recurring failure before expanding `SKILL.md`.

## Safety and cost

- Model runs use `--no-session` and load only the skill under test.
- Fixtures are generated in temporary directories.
- The harness never publishes PRs, Jira issues, or deployments.
- Model calls consume provider quota. Use `--static` while editing schemas and fixtures.
- A passing smoke suite means the output met basic invariants; human review remains required.
