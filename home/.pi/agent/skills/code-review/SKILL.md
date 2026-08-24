---
name: code-review
description: Performs evidence-based pull-request-style code reviews by comparing a head branch against a base branch. Use when asked to review a PR, review branch changes, compare branches for defects, assess merge readiness, or produce prioritized inline findings about correctness, security, regressions, tests, performance, or maintainability.
metadata:
  author: local
  version: "1.1.0"
---

# Pull Request Code Review

Act as an independent reviewer, not the change author. Review what the head branch introduces relative to the base branch and return concise, actionable PR feedback. Optimize for finding material defects; do not manufacture comments to appear thorough.

Do not edit code unless the user explicitly asks for fixes after the review.

## Inputs and defaults

Prefer explicit invocation:

```text
/skill:code-review base=main head=my-feature
```

Interpret **base** as the branch the change will merge into and **head** as the proposed branch. If the user says “review feature against main,” use `base=main`, `head=feature` and state that interpretation.

Resolve missing inputs in this order:

- **Head:** explicitly named branch, otherwise current `HEAD`.
- **Base:** explicitly named branch; current PR metadata if `gh` is available and authenticated; the remote default branch from `refs/remotes/origin/HEAD`; then a clearly established repository default. Ask if still ambiguous.

Never silently assume `main` when the repository indicates another default. Validate both refs with `git rev-parse --verify '<ref>^{commit}'`. If not in a Git repository, ask for the repository or correct working directory.

Use local refs by default. Fetch only when the user requests current remote state or stale/missing refs make it necessary and network access is appropriate. Report the exact refs and abbreviated SHAs reviewed.

## Establish PR-equivalent scope

Do not switch branches or mix uncommitted working-tree changes into a branch review. Note a dirty worktree, but compare committed refs.

GitHub PRs use a three-dot diff because it shows what the head introduces since the branches diverged. Use:

```bash
git status --short
git merge-base <base> <head>
git log --oneline --decorate <base>..<head>
git diff --stat <base>...<head>
git diff --name-status --find-renames <base>...<head>
git diff --check <base>...<head>
git diff --find-renames --find-copies <base>...<head> -- <path>
```

`git log <base>..<head>` is for commits reachable from head but not base. `git diff <base>...<head>` is for the PR patch from merge-base to head. Do not confuse the different meanings of dotted notation across `git log` and `git diff`.

If the branches have no merge base, stop and explain that an ordinary PR-style comparison is not valid. If the diff is unexpectedly empty or huge, verify branch direction before reviewing.

Do not hide merge commits categorically: they may explain conflict resolutions or unexpected code. Use `--first-parent`, `--no-merges`, or path-limited history only as an additional view when it clarifies a noisy branch.

For a diff too large to review reliably in one pass:

1. build a complete file/change manifest;
2. separate generated/vendor/lockfile output from human-authored sources;
3. partition human changes by subsystem and review high-risk boundaries first;
4. inspect every changed file at least for scope and risk, but never claim every line was deeply reviewed when it was not;
5. report unreviewed or lightly reviewed areas as coverage gaps and offer a follow-up pass.

When head is not the checked-out commit, inspect files with `git show <head>:<path>` rather than reading the working-tree version. Only run code from the intended head. If executable validation is important and safe, use a temporary detached worktree, run only repository-approved setup/checks there, and remove it afterward even when a check fails. Otherwise state that tests were not run.

## Understand intent before judging implementation

Gather only useful context:

- repository instructions and architecture notes;
- PR or linked issue context when locally/legitimately available;
- commit subjects as hints, never as proof;
- changed production code, tests, schemas, dependencies, configuration, and docs;
- relevant callers, callees, types, existing tests, and surrounding full files.

Write a one-sentence internal change thesis: “This change attempts to ___ by ___.” Use it to keep the review in scope. If intent remains materially ambiguous, ask rather than invent requirements.

## Review in risk order

### 1. Change map

Classify changed files and identify trust boundaries, public contracts, state transitions, persistence, concurrency, user-visible flows, migrations, and generated artifacts. Review generated output through its source when possible, but still notice suspicious generated or lockfile changes.

### 2. High-risk paths

Prioritize code affecting:

- authentication, authorization, sessions, secrets, and personal data;
- money, billing, quotas, irreversible actions, and destructive operations;
- database schemas, migrations, serialization, API contracts, and compatibility;
- concurrency, retries, idempotency, caching, transactions, and distributed state;
- input validation, parsing, file paths/uploads, rendering, queries, and external calls;
- feature flags, configuration defaults, deployment, rollback, and observability.

For security-sensitive changes, trace untrusted data from source through validation and authorization to sinks. Consider business-logic bypasses, not only pattern-matching for known vulnerabilities.

### 3. File-by-file correctness

Review every meaningful human-written changed line, then enough surrounding code to understand it. Check:

- behavior for normal, empty, boundary, malformed, stale, duplicate, and partial inputs;
- error propagation, cleanup, cancellation, timeouts, and failure recovery;
- state invariants and ordering assumptions;
- nullability, type narrowing, locale/time-zone/encoding, and numeric edge cases;
- compatibility with current callers and persisted data;
- UI state, keyboard/accessibility behavior, loading/errors, and responsive regressions where relevant;
- unnecessary complexity or abstraction that raises defect risk.

Do not report unrelated pre-existing defects unless the patch activates or materially worsens them.

### 4. Tests and verification

Assess whether tests would fail for the defect they claim to prevent. Look for missing coverage of changed behavior, regression cases for bug fixes, false-positive assertions, over-mocking, and tests coupled only to implementation details.

Run the smallest relevant existing checks when practical: targeted tests first, then lint/type/build checks if warranted by the change. Follow repository instructions. Never claim a command passed unless it ran successfully in this session against the reviewed head.

## Finding quality bar

Report a finding only when all are true:

1. The branch introduces or exposes it.
2. There is a concrete trigger, execution path, or violated contract.
3. The impact is meaningful to users, data, security, operations, or future changes.
4. The location and fix direction are specific.
5. Confidence is high enough that a human reviewer would reasonably leave the comment.

Before publishing each finding, try to disprove it by checking callers, guards, tests, framework behavior, and repository conventions.

Do not report:

- personal style preferences or issues a formatter/linter reliably handles;
- vague “could be cleaner” commentary without a failure mode;
- speculative performance or security claims without a plausible path;
- missing tests unless a meaningful behavior or regression is actually unprotected;
- broad architecture concerns unrelated to the patch;
- duplicate symptoms of one root cause.

## Priority and blocking intent

Use repository-defined review labels when documented. Otherwise use the lowest defensible default priority:

- **P0 — critical/blocking:** immediate catastrophic risk; severe security exposure, unrecoverable data loss, or system-wide outage under ordinary use.
- **P1 — high/blocking:** likely serious user, security, data, or production failure; should be fixed before merge.
- **P2 — medium/blocking:** real defect under a credible scenario with limited impact; normally fix before merge.
- **P3 — low/non-blocking:** small but concrete issue worth addressing; never use for taste or generic polish.

State any mapping when repository labels differ. Use `question (non-blocking)` separately when evidence is insufficient. A question is not a finding. Avoid P0/P1 inflation.

## Output format

Lead with findings, ordered P0 to P3. Keep each independent and ready to paste as an inline PR comment.

```markdown
## Findings

### [P1] Imperative, specific title
`path/to/file.ts:42-47`

Explain the trigger and observable impact. State why the current guard/test does not prevent it, then give a concise fix direction without redesigning the whole patch.
**Proposed fix:** Add the smallest safe remediation for this finding. **Affected:** `path/to/file.ts` — impacted function or functionality.
```

Every finding must end with exactly one `**Proposed fix:** ... **Affected:** ...` line. Keep the proposed fix actionable but concise, identify all materially affected files/functions, and do not turn it into a full patch or change the finding's priority, location, or rationale. This line is additive to the existing explanation and fix direction.

Location rules:

- cite the head-side path and smallest useful changed line range, ideally 1–5 lines;
- the cited range must overlap the diff;
- if the failure manifests elsewhere, cite the changed line that causes it and name the downstream location in the explanation;
- derive new-side line numbers from diff hunks when head is not checked out.

After findings, include only:

```markdown
## Review summary
- **Verdict:** Request changes / Approve with comments / No material findings
- **Compared:** `<base>@<sha>...<head>@<sha>`
- **Verification:** commands actually run and their result, or `Not run` with reason
- **Residual risk:** only material areas or diff partitions not verified
```

If there are no findings, say **“No material findings.”** Do not invent a nit. Mention positive work only when specific and useful, and never let praise obscure blockers.

The methodology is grounded in GitHub, Google, Microsoft, OWASP, and Conventional Comments guidance. Read [references/sources.md](references/sources.md) only when provenance or methodology details are needed.
