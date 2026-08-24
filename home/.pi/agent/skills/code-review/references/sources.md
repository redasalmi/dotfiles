# Code Review Sources and Applied Decisions

This file records the evidence behind the skill. It is not required reading for every review.

**Last source verification:** 2026-08-16. Re-verify provider behavior and security guidance during major skill revisions.

## GitHub: branch comparison and review workflow

- [About comparing branches in pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-comparing-branches-in-pull-requests)
  - GitHub PRs compare head with base and show a three-dot diff from merge-base to head.
  - This isolates what the topic branch introduces since divergence.
- [Reviewing proposed changes](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request)
  - Review changed files deliberately, leave comments on specific changes, and finish with an explicit review outcome.
- [Helping others review your changes](https://docs.github.com/en/pull-requests/concepts/helping-others-review-your-changes)
  - Context, small scope, self-review, tests, and security-sensitive areas improve review quality.

**Applied:** use `base...head` for the patch, verify branch direction, cite specific changed lines, and report a verdict.

## Google Engineering Practices

- [What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html)
  - Review design, functionality, complexity, tests, naming, comments, documentation, style, and every meaningful line in broader system context.
  - Think about edge cases and concurrency; inspect user-facing behavior when code alone is insufficient.
  - Tests need human review and should fail when behavior breaks.
- [How to write code review comments](https://google.github.io/eng-practices/review/reviewer/comments.html)
  - Be courteous, comment on code rather than the person, explain why, and distinguish required changes from optional or nit feedback.
- [The standard of code review](https://google.github.io/eng-practices/review/reviewer/standard.html)
  - Seek an improvement in overall code health, not perfection; do not block on preference-level polish.

**Applied:** use a material-defect threshold, verify tests, explain impact and resolution, and avoid perfectionism or style noise.

## Microsoft

- [Get feedback with pull requests](https://learn.microsoft.com/en-us/devops/develop/git/git-pull-requests)
  - Good feedback is actionable and constructive, comes from understanding the code, identifies the issue, and offers specific direction.
  - Out-of-scope improvements belong in separate work items rather than blocking the current PR.

**Applied:** keep findings actionable and patch-scoped.

## OWASP

- [Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html)
  - Diff-based review should assess modified components, existing controls, trust boundaries, integrations, and regressions.
  - Human review adds the most value for authorization, business logic, state transitions, race conditions, data flow, and context-specific threats.
  - Trace sources through processing to sinks and validate controls at each boundary.

**Applied:** prioritize security-sensitive diffs and trace plausible attack/data paths instead of emitting generic security warnings.

## Conventional Comments

- [Conventional Comments](https://conventionalcomments.org/)
  - Labels and blocking decorations clarify intent; issues need rationale and a resolution path, while uncertain concerns should be questions.

**Applied:** separate high-confidence findings from non-blocking questions and make blocking intent explicit.

## Git

- [git-diff documentation](https://git-scm.com/docs/git-diff)
- [gitrevisions documentation](https://git-scm.com/docs/gitrevisions)
- [git-merge-base documentation](https://git-scm.com/docs/git-merge-base)

**Applied:** `git diff A...B` means merge-base-to-B, while revision ranges used by `git log` have different set semantics. The skill uses each form deliberately.
