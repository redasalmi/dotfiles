---
name: pr-description
description: Generates accurate, reviewer-focused pull request descriptions by comparing a head branch against a base branch. Use when asked to draft, write, update, or improve a PR body or title; summarize branch changes for a PR; fill a repository pull request template; or document testing, risks, rollout, screenshots, and reviewer guidance.
metadata:
  author: local
  version: "1.1.0"
---

# Pull Request Description

Generate a concise PR description that helps a reviewer understand **why the change exists, what it changes, how it was verified, and where risk remains**. Base every factual statement on the branch diff, repository context, supplied issue, or checks actually run. Do not narrate every file and do not invent motivation, tickets, test results, screenshots, metrics, or rollout status.

Draft only. Do not create, update, or publish a PR unless the user explicitly asks.

## Inputs and defaults

Preferred invocation:

```text
/skill:pr-description base=main head=my-feature
```

Interpret **base** as the target branch and **head** as the proposed branch. Resolve missing values:

- **Head:** explicit branch, otherwise current `HEAD`.
- **Base:** explicit branch; current PR metadata if an authenticated provider tool is available; remote default from `refs/remotes/origin/HEAD`; then a clearly established repository default. Ask if ambiguous.

Use supplied Jira/provider issue context when available. Detect the hosting provider from authenticated metadata or Git remote URLs when it affects terminology, templates, or links; do not require a provider CLI for an ordinary local draft. A key found in a branch name or commit is safe to repeat as a key, but not enough to invent a URL, acceptance criterion, or business rationale.

## Compare PR scope correctly

Validate refs and use the same merge-base comparison GitHub uses for PR files:

```bash
git rev-parse --verify '<base>^{commit}'
git rev-parse --verify '<head>^{commit}'
git merge-base <base> <head>
git log --oneline --decorate <base>..<head>
git diff --stat <base>...<head>
git diff --name-status --find-renames <base>...<head>
git diff --find-renames --find-copies <base>...<head>
```

Do not switch branches, include dirty working-tree changes, or summarize only commit messages. Commit history is a map; the diff and surrounding code are evidence. Inspect enough changed files, tests, configuration, migrations, docs, and callers to understand behavior and intent. Use `git show <head>:<path>` when head is not checked out.

Stop and resolve branch direction when there is no merge base or when the diff is unexpectedly empty. For a large diff, build a full change manifest, group changes by behavior/subsystem, and identify lightly inspected areas rather than producing a confident summary from a sample of files.

## Honor the repository and provider template

Read contribution guidance first. Templates normally come from the repository's default branch, not necessarily the PR base or checked-out head. Inspect the default-branch tree with `git ls-tree`/`git show` when needed.

Provider-aware locations:

- **GitHub:** `pull_request_template.md` in repository root, `docs/`, or `.github/`; multiple templates in `PULL_REQUEST_TEMPLATE/` under those locations.
- **GitLab:** `.gitlab/merge_request_templates/*.md` and any provider-selected default template.
- **Azure Repos:** `pull_request_template.md|txt` under root, `docs/`, `.azuredevops/`, or `.vsts/`; also check target-branch-specific templates under `pull_request_template/branches/`.

If exactly one applicable default or target-branch template exists, use it. If multiple optional templates exist and no provider metadata identifies the selected one, ask which template to use rather than merging them arbitrarily. If no answer is available, use the repository's default template and state the choice outside the body.

Preserve required headings, checklists, and comments. Fill applicable sections; mark genuinely inapplicable required sections briefly rather than deleting structure. Never check a box unless supported by evidence from this session or supplied CI results. Test files in the diff do not prove tests passed.

## Build an evidence ledger

Before writing, establish:

- **Purpose:** explicit issue/problem context; if absent, the narrowest defensible purpose inferred from behavior.
- **User-visible effect:** workflows, UI, API, behavior, or operational outcome that changes.
- **Implementation shape:** only architectural choices a reviewer needs to understand.
- **Tests:** commands actually run and supplied trustworthy CI status, separated from tests merely added/changed.
- **Risk:** migrations, contracts, permissions, data, dependencies, flags, config, rollout, rollback, and known limitations.
- **Review path:** files/components or ordering that will help a reviewer understand a large/nonlinear change.

If “why” cannot be established, state a neutral outcome-based purpose and add one concise question outside the paste-ready body. Do not fabricate product history.

## Write for reviewers and future readers

- Lead with the outcome, not “This PR...” filler.
- Summarize behavior and intent, not a file inventory or commit-by-commit diary.
- Explain why only when evidence exists; code often shows what but not why.
- Call out non-obvious design choices, tradeoffs, shortcomings, and compatibility implications.
- Make reviewer attention explicit for risky or subtle areas.
- Keep details proportional: a tiny fix may need three bullets; a migration needs rollout and rollback detail.
- Use exact ticket links only when provided or discoverable from legitimate repository/PR metadata.
- Mention generated files or dependency changes only when they affect review, deployment, security, or behavior.
- Avoid generic claims such as “improves performance,” “enhances UX,” or “ensures robustness” without evidence.

## Testing truthfulness

Use one of these evidence levels:

- `Passed — <command/check>` only when run successfully against the reviewed head or supplied as trusted CI evidence.
- `Manual — <specific scenario>` only when the user reports it or it was actually performed.
- `Added/updated — <test coverage>` for test code present in the diff; this does not claim execution.
- `Not run — <reason>` when no verification was performed.

If head is not checked out, do not run tests against another branch and attribute them to head. A temporary worktree is optional when validation is requested and safe.

## Default output when no template exists

Omit sections that add no value. Normally use:

```markdown
## Summary
- Two to four behavior-focused bullets.

## Why
Concise problem/context when evidence exists.

## What changed
- Group related changes by behavior or subsystem.

## Testing
- Passed — `command`
- Added/updated — coverage description
- Not run — reason

## Risks and rollout
- Migration, compatibility, flags, config, rollout/rollback, or `Low risk: <specific reason>`.

## Reviewer notes
- Suggested review order or area needing special attention.
```

Additional sections only when relevant:

- **Screenshots** for visual changes. Include actual images/links when available; otherwise write `Not captured` rather than inventing evidence.
- **API or data migration** for schema/contracts/backfills/compatibility.
- **Related issue** for a verified key or URL.
- **Follow-ups / known limitations** for deliberately deferred work.

Do not add a large boilerplate checklist. Do not list every changed file. Do not include empty headings merely because they are common.

If the user asks for a title, make it short, specific, outcome-led, and consistent with repository conventions. Avoid “Fix bug,” “Update code,” and “Misc changes.”

## Final accuracy pass

Compare every sentence against the evidence ledger and remove or qualify unsupported claims. Then verify:

- branch direction and SHAs are correct;
- the body describes the whole diff, including migrations/config/dependencies when material;
- purpose, behavior, and implementation are not conflated;
- test execution is distinct from test code changes;
- template structure and unchecked boxes are preserved honestly;
- risky reviewer areas and known limitations are visible;
- wording is concise and useful months later;
- output contains the paste-ready description, not meta-commentary about how it was generated.

By default, output the completed body as raw Markdown with no enclosing code fence or generation commentary, so nested code fences remain valid and the body can be copied directly. Put unresolved questions after a clear `---` separator so they are not mistaken for PR content. If the user requests a fenced block, choose an outer fence longer than any fence inside the body.

The methodology is based on GitHub, Google, Microsoft, and Git documentation. Read [references/sources.md](references/sources.md) only when provenance is needed.
