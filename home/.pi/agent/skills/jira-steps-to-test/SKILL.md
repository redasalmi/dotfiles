---
name: jira-steps-to-test
description: Generates Jira-ready manual test cases for nontechnical QA by comparing a feature or bug-fix branch against its base branch. Use when asked for steps to test, QA notes, manual browser tests, acceptance verification, bug-fix verification, regression scenarios, or test instructions derived from a PR or branch diff.
metadata:
  author: local
  version: "1.1.0"
---

# Jira Steps to Test

Turn a branch diff into clear, risk-based manual tests that a nontechnical QA tester can execute through the product UI. Describe what the tester should do and observe—not how the code works.

The final output must be ready to paste into Jira and must never invent UI, credentials, test data, environment URLs, requirements, or successful test results.

## Inputs and defaults

Preferred invocation:

```text
/skill:jira-steps-to-test base=main head=feature format=jira-cloud JIRA-123
```

Inputs may include base/head branches, Jira issue text or key, acceptance criteria, environment details, roles, a bug report, and `format=jira-cloud|jira-wiki|markdown|plain`. Interpret **base** as the target branch and **head** as the branch under test.

Choose output format from an explicit request or known Jira integration. Otherwise default to **plain paste-safe Markdown**: headings, numbered lists, bold labels, and no Markdown tables. Jira Cloud converts common Markdown as it is entered, while Data Center may use wiki markup and can handle pasted tables inconsistently. If the target is unknown, portability is more valuable than a compact table.

Resolve missing branches as follows:

- **Head:** explicitly named branch, otherwise current `HEAD`.
- **Base:** explicit branch; PR metadata through an available authenticated integration; remote default from `refs/remotes/origin/HEAD`; then a clearly established repository default. Ask if ambiguous.

If a Jira integration is available and the user supplied a key, retrieve the summary, description, acceptance criteria, attachments/links, and relevant comments. Otherwise use only issue content the user supplied. A ticket key or branch name is not evidence of requirements.

Ask at most three blocking questions. Prefer generating useful tests with a short **Open questions** section when unknowns do not prevent execution.

## Compare the branches accurately

Validate refs and use the PR-equivalent three-dot diff:

```bash
git rev-parse --verify '<base>^{commit}'
git rev-parse --verify '<head>^{commit}'
git merge-base <base> <head>
git log --oneline <base>..<head>
git diff --stat <base>...<head>
git diff --name-status --find-renames <base>...<head>
git diff --find-renames <base>...<head>
```

Do not switch branches or include uncommitted worktree changes. Report the compared refs and SHAs in a small traceability note, not in the tester's actions.

Commit messages suggest intent but do not prove behavior. Inspect the changed and surrounding code, routes, visible labels, existing tests, fixtures, feature flags, role checks, validation, state transitions, and API effects. When head is not checked out, use `git show <head>:<path>`.

If there is no merge base, an empty diff, or likely reversed branch direction, stop and resolve it before writing tests.

## Build a behavior map

Translate implementation changes into externally observable behavior:

| Evidence | Extract |
|---|---|
| Jira/acceptance criteria | Intended outcome and explicit pass/fail conditions |
| Changed UI/routes/copy | Where the tester goes and labels they can see |
| Changed state/business logic | Actions, conditions, and visible outcomes |
| Existing/new tests | Supported scenarios and regression intent |
| Permissions/flags/config | Required role, account state, or environment setup |
| Deleted/replaced behavior | Previous failure or behavior that should no longer occur |
| Adjacent unchanged flows | Focused regression surface |

Trace each explicit acceptance criterion to at least one test case. If the diff and ticket disagree, call it out; do not silently rewrite the requirement.

Separate facts from inferences:

- **Confirmed:** directly supported by ticket, UI code, tests, or product documentation.
- **Inferred:** strongly implied by the diff but not specified as a requirement.
- **Unknown:** needs product, developer, or environment clarification.

Do not expose those labels in every step; use them to avoid fabricated certainty.

## Choose tests by risk, not by checklist volume

Create the smallest suite that gives useful confidence. Prioritize:

1. acceptance criteria and primary happy path;
2. exact original bug reproduction and fix verification;
3. permissions, destructive actions, money/data, and security boundaries;
4. validation, empty/boundary inputs, duplicate/repeated action, and error recovery when changed;
5. persistence after reload/revisit and relevant back/forward navigation;
6. one or two adjacent regression flows likely affected by the changed code;
7. keyboard/focus, narrow viewport, or browser coverage only when the change makes them relevant.

Do not append generic “test all browsers,” “check responsiveness,” or “verify accessibility” bullets to every ticket. Add a browser/device matrix only for browser APIs, responsive CSS, input behavior, uploads/downloads, media, clipboard, or other compatibility-sensitive changes.

For changed interactive UI, include a focused keyboard check when useful: reach controls with Tab, see focus, activate them from the keyboard, and escape overlays without a keyboard trap. For changed forms, check clear labels, required indicators that do not rely only on color, retained valid input after errors, and specific recovery guidance.

## Bug-fix test pattern

For a bug fix, derive the original trigger from the issue, deleted logic, or regression test. The first test case should establish:

- the exact state and data needed to trigger the old bug;
- the original action sequence;
- the correct visible result on the fixed build;
- an assertion that the old symptom is absent;
- a nearby case that should continue to work.

If both baseline and feature environments are available, an optional baseline confirmation may demonstrate the old failure. Never require nontechnical QA to check out Git branches or run developer commands.

A manual pass verifies the current build but does not prevent future regression. If a bug fix has no automated regression test, mention that in **Technical coverage gaps**, not as a browser step.

## Write for nontechnical QA

- Use the product's visible page, menu, field, and button labels exactly when known.
- Start from a location the tester can reach, such as “Open **Orders** from the left navigation.”
- Keep each action atomic. Put the observable pass condition beside it.
- Use plain language. Avoid source paths, component names, database terms, endpoints, selectors, logs, DevTools, and shell commands.
- Specify concrete test values only when safe and supported. Otherwise define the kind of record needed, such as “an unpaid order owned by the test account.”
- Make test cases independent where practical and state cleanup/reset steps for data-changing tests.
- Never use “works correctly,” “behaves as expected,” or “verify the fix” as an expected result. State what appears, changes, persists, or does not happen.
- Distinguish product failure from setup failure.

If the change is not observable through the browser—such as a library refactor, background job with no visible status, telemetry-only change, or infrastructure change—say so. Provide only legitimate observable checks and move the rest to **Technical coverage gaps**. Do not fabricate a manual UI path.

## Jira-ready output

Use this structure, omitting empty sections. The default deliberately avoids tables so it pastes reliably across Jira editors:

```markdown
## QA scope
One or two plain-language sentences describing what changed and what this test set covers.

## Test setup
- **Build/environment:** [known value or `Required: QA build for <head>`]
- **Account/role:** ...
- **Test data:** ...
- **Feature flags/configuration:** ...

## Test cases

### TC1 — [Core] Short user-centered outcome
**Covers:** acceptance criterion or bug symptom

**Preconditions**
- Only state unique to this case.

**Steps**
1. **Action:** Open ...
   **Expected:** The ... page appears and ... is visible.
2. **Action:** Select ...
   **Expected:** ...

**Cleanup**
- Only when needed.

## Focused regression checks
- [ ] Specific action — specific observable result

## Technical coverage gaps
- Items that cannot be proven through manual browser testing

## Open questions
- Only information needed from product/development/QA

## Traceability
- Compared `<base>@<sha>` → `<head>@<sha>`
- Acceptance criteria covered: ...
```

Formatting adaptations:

- **Jira Cloud:** use Markdown headings, ordered/unordered lists, bold text, and `[]` action items. Avoid relying on Markdown table conversion.
- **Jira Data Center/wiki:** use the installation's established wiki markup only when known; keep structures simple because visual-editor paste behavior varies.
- **Markdown:** ordinary Markdown is allowed, including a table only when the user requests it.
- **Plain:** remove Markdown heading markers and use numbered text.

Default labels indicate execution importance, not defect severity:

- **Core:** primary acceptance path, original bug, permissions/security, data loss, payment, or release-blocking behavior.
- **Important:** meaningful alternate, validation, recovery, or adjacent regression.
- **Additional:** useful lower-risk exploratory coverage.

Use P0/P1/P2 only when the team's documented test-priority convention uses those labels. Normally produce 3–8 cases. Use fewer for a tiny change and more only when distinct workflows or roles require them. Different workflows should be separate test cases; simple data variations can use a small value list instead of duplicated steps.

## Final quality gate

Before responding, verify:

- every action is possible from evidence in the repository or ticket;
- every expected result is visible and objectively pass/fail;
- the original bug or primary feature is tested first;
- setup includes role, data, environment, and flags actually required;
- acceptance criteria are covered or explicitly called out as untestable/unknown;
- no code vocabulary leaked into nontechnical steps;
- the selected format will paste predictably into the target Jira editor;
- importance labels cannot be mistaken for unsupported defect severity;
- regression and accessibility coverage is change-specific rather than boilerplate;
- unknowns are honest and consolidated;
- no test is marked passed—the document defines tests, it does not claim execution.

The method is based on Atlassian, Microsoft, ISTQB, W3C WAI, GitHub, and regression-testing practice. Read [references/sources.md](references/sources.md) only when provenance is needed.
