# Manual QA Sources and Applied Decisions

This file records provenance. It should not be loaded for routine generation.

**Last source verification:** 2026-08-16. Jira Cloud and Data Center editors differ; re-check formatting guidance when either editor changes.

## Atlassian

- [What is acceptance criteria?](https://www.atlassian.com/work-management/project-management/acceptance-criteria)
  - Acceptance criteria should be clear, concise, independently understandable, objectively testable, and focused on user outcomes.
  - Criteria describe results rather than implementation and should map to executable tests.
- [User stories](https://www.atlassian.com/agile/project-management/user-stories)
  - User stories connect persona, goal, value, and confirmation through acceptance criteria.
- [Check acceptance criteria in a code review](https://support.atlassian.com/rovo/docs/check-acceptance-criteria-in-a-code-review/)
  - PR changes can be checked against Jira requirements; criteria should be short, focused, unambiguous, measurable, and positive.

**Applied:** trace test cases to acceptance criteria, write in stakeholder language, and expose gaps instead of inventing requirements.

## Jira editor compatibility

- [Jira Cloud Markdown and keyboard shortcuts](https://support.atlassian.com/jira-software-cloud/docs/markdown-and-keyboard-shortcuts/)
  - Jira Cloud rich-text fields convert common Markdown headings, emphasis, lists, action items, quotes, links, and code while editing.
- [Jira Data Center visual editing](https://confluence.atlassian.com/display/JIRASOFTWARESERVER/Visual+editing)
  - Data Center can expose visual and wiki-markup modes, while pasted tables and complex formatting may behave inconsistently.

**Applied:** default to portable headings and numbered action/expected pairs; use Cloud Markdown or Data Center wiki markup only when the target is known.

## Microsoft Azure Test Plans

- [Create and manage manual test cases](https://learn.microsoft.com/en-us/azure/devops/test/create-test-cases?view=azure-devops)
  - Manual cases contain individual action steps and expected results.
  - Different workflows should be separate cases; data variations can use parameters.
  - Cases can be linked to requirements for traceability.
- [Run manual tests](https://learn.microsoft.com/en-us/azure/devops/test/run-manual-tests?view=azure-devops)
  - Testers mark each validation step pass/fail based on its expected result and capture evidence for failures.
- [Exploratory testing](https://learn.microsoft.com/en-us/azure/devops/test/connected-mode-exploratory-testing?view=azure-devops)
  - Screenshots, notes, recordings, action logs, and linked work items preserve useful evidence.

**Applied:** pair every atomic action with an observable result, separate workflows, include setup/data, and make the result paste-ready for a work item.

## ISTQB terminology

- [ISTQB Standard Glossary](https://api.glossary.istqb.org/storage/help/tZx8UKflTwsfhq67frhOsb8mNPE7r01xRzivgFTG.pdf)
  - A test case includes preconditions, inputs, actions, expected results, and postconditions.
  - Risk-based testing uses risk type and level to prioritize test activity.

**Applied:** include only necessary preconditions and cleanup, make results explicit, and prioritize high-impact scenarios rather than generate an exhaustive generic list.

## W3C Web Accessibility Initiative

- [Easy Checks — A First Review of Web Accessibility](https://www.w3.org/WAI/test-evaluate/preliminary/)
  - Nontechnical reviewers can check keyboard access, visible and logical focus, keyboard traps, text resizing, contrast, labels, required-field cues, and error recovery.
  - Forms should provide clear labels and errors, not rely on color alone, and preserve valid data where practical.

**Applied:** include focused keyboard/form checks when the changed UI makes them relevant; do not turn every ticket into a complete accessibility audit.

## GitHub and Git

- [About comparing branches in pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-comparing-branches-in-pull-requests)
  - A three-dot diff isolates what the topic branch introduces since its merge base with the target branch.
- [git-diff documentation](https://git-scm.com/docs/git-diff)

**Applied:** derive changed behavior from `base...head`, not from uncommitted state or commit messages alone.

## Regression testing practice

- [Goto Fail, Heartbleed, and Unit Testing Culture](https://martinfowler.com/articles/testing-culture.html)
  - A bug fix should reproduce the defect, verify the fix, and include an automated regression test so it stays fixed.

**Applied:** manual steps reproduce the original trigger and assert the old symptom is absent; missing automated regression coverage is reported as a technical gap rather than assigned to nontechnical QA.
