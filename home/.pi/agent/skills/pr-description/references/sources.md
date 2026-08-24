# PR Description Sources and Applied Decisions

This provenance file is not required for routine use.

**Last source verification:** 2026-08-16. Re-verify template locations when GitHub, GitLab, or Azure Repos changes its PR/MR workflow.

## GitHub

- [Helping others review your changes](https://docs.github.com/en/pull-requests/concepts/helping-others-review-your-changes)
  - A clear title and description explain the problem, approach, and result, and direct reviewers to important or risky areas.
  - Self-review should catch accidental changes and verify relevant checks.
  - Generated summaries require human/contextual review.
- [Creating a pull request template](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)
  - Repository templates standardize related issues, proposed changes, testing notes, and reviewer context.
- [Managing and standardizing pull requests](https://docs.github.com/en/pull-requests/reference/managing-and-standardizing-pull-requests)
  - Templates and checks make expectations visible and consistent.
- [How to write the perfect pull request](https://github.blog/developer-skills/github/how-to-write-the-perfect-pull-request/)
  - Explain purpose and why, include relevant links, request the feedback needed, and identify work-in-progress status.
- [About comparing branches in pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-comparing-branches-in-pull-requests)
  - GitHub uses a three-dot merge-base comparison to show what the topic branch introduces.

**Applied:** honor repository templates, summarize `base...head`, include purpose/behavior/testing/risk, and guide reviewers without dumping a file list.

## GitLab and Azure Repos templates

- [GitLab description templates](https://docs.gitlab.com/user/project/description_templates/)
  - Merge request templates live under `.gitlab/merge_request_templates/` and can be selected/defaulted through GitLab's MR workflow.
- [Azure Repos pull request templates](https://learn.microsoft.com/en-us/azure/devops/repos/git/pull-request-templates?view=azure-devops)
  - Azure supports default, target-branch-specific, and additional templates under root, `docs/`, `.azuredevops/`, or `.vsts/`, sourced from the default branch.

**Applied:** detect the provider, read templates from the default branch, apply target-branch precedence for Azure, and never merge multiple optional templates arbitrarily.

## Google Engineering Practices

- [Writing good CL descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)
  - A description is a durable public record that explains what changed and why.
  - Its opening should be short, focused, and able to stand alone.
  - The body should provide problem context, approach, tradeoffs/shortcomings, and relevant links or evidence.
  - Recheck the description before submission because changes during review can make it stale.
- [Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
  - One self-contained change is easier and safer to review; conceptual focus matters more than raw line count.

**Applied:** write outcome-led summaries that remain useful in history and disclose material tradeoffs.

## Microsoft

- [Get feedback with pull requests](https://learn.microsoft.com/en-us/devops/develop/git/git-pull-requests)
  - Authors should provide a clear change description and a working build; reviewers need enough context to give actionable feedback.
  - Out-of-scope improvements should become separate work rather than muddying the current PR.
- [Feature branch workflow](https://learn.microsoft.com/en-us/training/modules/manage-git-branches-workflows/3-explore-feature-branch-workflow)
  - Useful PRs explain what, why, and how, include visual aids when relevant, follow templates, and provide reviewer guidance.

**Applied:** include verifiable test/build evidence, screenshots only when real, and focused follow-ups.

## Git

- [git-diff documentation](https://git-scm.com/docs/git-diff)
- [gitrevisions documentation](https://git-scm.com/docs/gitrevisions)
- [git-merge-base documentation](https://git-scm.com/docs/git-merge-base)

**Applied:** use `git diff base...head` for PR changes and `git log base..head` for head-only commits; do not conflate them.
