# Evidence-Based Visual QA

Rendered pixels and interaction behavior are part of the implementation. Use this workflow after meaningful visual changes; scale it down for small isolated fixes.

## 1. Discover the existing path

Read repository instructions and inspect existing scripts/configuration before adding tooling. Prefer, in order:

1. the project's documented dev/preview command;
2. existing Storybook or component explorer;
3. existing Playwright, Cypress, browser automation, screenshot, or visual-regression setup;
4. the framework's normal local preview;
5. a native app preview/test harness for desktop work.

Do not install a large dependency or subscribe to a service solely for screenshots without user intent and project fit. Do not commit temporary screenshots unless the repository expects visual baselines or the user asks.

Start the smallest reliable environment that provides representative data. Record blockers such as unavailable credentials, services, fixtures, feature flags, or OS runtime.

## 2. Capture the baseline

Before substantial redesign, capture the current implementation at the same route, data, theme, viewport/window size, and state that will be reviewed afterward.

A useful baseline includes only relevant cases:

- primary view and action;
- changed component or region;
- narrowest supported view or minimum useful window;
- expected default desktop/laptop view;
- dense/long and empty/sparse content when layout depends on data;
- one important overlay or interaction state.

If no previous UI exists, use requirements or reference screenshots as the baseline and label them as references—not as the product's prior state.

## 3. Build a risk-based matrix

Choose cases from the change, not a generic checklist.

### Web marketing/content

- initial viewport and full-page narrative;
- mobile navigation;
- primary conversion path;
- slow/missing image or font behavior when assets changed;
- long headings and realistic content.

### Web applications

- primary happy path;
- navigation open/closed;
- loading, empty, validation, error, selected, disabled, permission, and destructive states affected by the change;
- dense data, long labels, overflow, pagination, or scrolling as relevant;
- supported themes and high-contrast/forced-color behavior when tokens changed.

### Desktop applications

- minimum useful, default, and large window;
- resized/tiled layout;
- menus, toolbar, sidebar/split view, inspector, context menu, and dialog affected by the work;
- keyboard focus, selection, drag/resize, and platform-specific chrome;
- target scaling/theme/accessibility settings where practical.

For responsive work, test immediately below and above changed breakpoints. Starting dimensions such as 360×800, 768×1024, and 1440×900 are useful only when they match the product. Include 320 CSS px reflow checks when WCAG web requirements apply.

## 4. Make captures stable

- Use deterministic fixtures or mock data where the project supports them.
- Wait for intended fonts, images, data, and transitions before capture.
- Disable animation only for deterministic comparison, not to hide a motion defect; separately test reduced-motion behavior.
- Keep theme, scale, zoom, locale, and data constant for before/after comparison.
- Mask volatile timestamps or user data only when visual-regression tooling already supports it and the masked region is not under review.
- Check browser/runtime console and failed requests before blaming CSS for an incomplete render.

Prefer full-page screenshots for narrative flow and viewport/element screenshots for interaction detail. Playwright can capture all three; Storybook baselines are useful for component states. Use existing tools rather than requiring either product.

In Pi, inspect the saved image itself with the `read` tool. Do not infer visual quality from markup or CSS alone.

## 5. Inspect at three levels

### Whole-view composition

Check:

- primary task/action and reading order;
- balance of visual weight, density, and negative space;
- grid/alignment and purposeful width use;
- navigation and system-status visibility;
- product identity beyond logo and accent color;
- fixed/sticky regions, scrolling, overlays, and viewport obstructions.

### Component and content detail

Check:

- type rendering, line length, wrapping, truncation, numerals, and fallback fonts;
- spacing relationships, control sizes, borders, radii, and surface hierarchy;
- icon alignment and consistency;
- realistic long/empty/localized content;
- hover, focus, pressed, selected, disabled, loading, error, success, and destructive differentiation;
- clipping, accidental scrollbars, z-index, layout shift, and low-resolution assets.

### Interaction and platform behavior

Check:

- keyboard reachability, focus order/visibility/restoration, and escape behavior;
- common control semantics and expected keys;
- no hover-only essential action;
- error prevention, feedback, cancel/undo, and recovery;
- resizing/recomposition rather than simple shrinking;
- platform menus, shortcuts, window behavior, scaling, and themes for desktop.

Automated accessibility scans can supplement these checks. They do not validate task flow, keyboard quality, screen-reader meaning, or full WCAG conformance.

## 6. Record evidence-based findings

Do not assign an aggregate design score. Use:

- **Blocker:** critical task or access failure.
- **High:** material hierarchy, responsive, platform, or state problem affecting the main task.
- **Medium:** concrete readability, consistency, discoverability, or secondary-flow problem.
- **Polish:** optical improvement without meaningful usability impact.

Use this format internally or for Review mode:

```markdown
### [High] Primary action disappears below the sticky footer
- **Evidence:** `/checkout`, 360×800, validation-error state
- **Impact:** The user cannot submit or recover without discovering an obscured scroll region.
- **Correction:** Keep the action in normal flow at this width or reserve footer space and scroll the first error into view.
- **Verify:** Repeat the same state at 320, 360, and immediately above the footer breakpoint with keyboard focus visible.
```

A finding must identify an actual visible/behavioral symptom. “Feels dated,” “needs polish,” and taste unsupported by product goals are not findings.

## 7. Fix root causes

Prioritize at most three material issues per pass. Prefer system fixes:

- correct hierarchy rather than add decoration;
- repair the grid rather than nudge unrelated elements;
- revise type/spacing/color tokens rather than add one-off overrides;
- simplify surface grouping rather than strengthen every shadow;
- recompose at a breakpoint rather than scale everything down;
- improve content/state architecture rather than add visual emphasis to compensate.

Re-capture the same matrix after fixes and compare against the baseline and intended direction. Confirm that intentional changes did not create regressions elsewhere. One to three focused passes are normally enough; do not churn polish while a high-impact problem remains.

## 8. Functional and accessibility checks

Run the relevant existing formatting, lint, type, unit, integration, build, and visual checks. Then, where applicable:

- operate the changed flow with keyboard only;
- inspect focus at sticky regions and overlays;
- test zoom/text growth and long labels;
- test reduced motion;
- inspect light/dark/high-contrast or forced-color modes;
- check console/runtime errors and failed assets;
- run the project's existing accessibility scanner.

Never claim a check ran based on the presence of configuration or test files.

## 9. Report honestly

Record:

- route/screens and data states inspected;
- exact viewport/window sizes, themes, locales, and platform used;
- baseline and final captures when retained;
- material findings corrected;
- commands and checks actually run;
- browsers/OS/input/accessibility checks not covered;
- blockers that prevented rendering.

Do not say the UI was visually verified if no rendered output was inspected. Do not claim user validation or accessibility conformance from an agent review.
