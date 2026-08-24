# Design Director Sources and Applied Decisions

This file records provenance. It is intentionally separate so routine design work does not load source summaries into context.

**Last source verification:** 2026-08-16. Re-check platform HIGs, WCAG supporting guidance, browser behavior, and design-system versions during major revisions.

## Accessibility and interaction semantics

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
  - Provides testable A/AA/AAA criteria for contrast, reflow, text spacing, keyboard access, focus not obscured, dragging alternatives, target size, errors, and status messages.
- [WCAG 2 overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
  - W3C recommends the latest WCAG version; WCAG is organized around perceivable, operable, understandable, and robust content.
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
  - Defines semantics, states, focus, and conventional keyboard models for custom widgets such as dialogs, menus, tabs, trees, and grids.
- [Developing a keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
  - Tab normally moves between components while arrow keys operate within composite widgets; all interactive components need keyboard access.
- [GOV.UK Design System accessibility](https://design-system.service.gov.uk/accessibility/)
  - Using accessible components does not automatically make a complete service accessible; research, design, development, and testing are still required.
- [MDN `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
  - The media feature reflects a user's OS preference to remove, reduce, or replace nonessential motion.

**Applied:** target WCAG 2.2 AA when no stricter requirement exists, prefer native semantics, use APG for custom controls, test keyboard/focus manually, honor reduced motion, and never claim conformance from component choice or automation alone.

## General usability

- [Nielsen Norman Group: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
  - Important principles include system-status visibility, user-language match, control/undo, consistency, error prevention, recognition over recall, expert efficiency, focused visual design, actionable errors, and contextual help.
- [Aesthetic and minimalist design](https://www.nngroup.com/articles/aesthetic-minimalist-design/)
  - Minimalism means maximizing useful signal and removing irrelevant competition, not removing elements users need.

**Applied:** establish interaction hierarchy before aesthetics, keep common behavior conventional, prevent and recover from errors, and treat visual restraint as task focus rather than a mandatory visual style.

## Platform guidance

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple accessibility evaluation: sufficient contrast](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/sufficient-contrast-evaluation-criteria/)
- [Apple accessibility evaluation: differentiate without color](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/differentiate-without-color-alone-evaluation-criteria/)
- [Apple accessibility evaluation: reduced motion](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria/)
  - Apple guidance supports platform conventions, full keyboard access, sufficient contrast across themes, non-color state cues, and alternatives for motion triggers.
- [Microsoft Windows app design](https://learn.microsoft.com/en-us/windows/apps/design/)
- [Microsoft keyboard interactions](https://learn.microsoft.com/en-us/windows/apps/design/input/keyboard-interactions)
- [Microsoft navigation basics](https://learn.microsoft.com/en-us/windows/apps/design/basics/navigation-basics)
  - Windows guidance covers input/form-factor adaptation, logical tab order, focus visuals, shortcuts/access keys, inner navigation, and task-appropriate navigation structures.
- [GNOME Human Interface Guidelines](https://developer.gnome.org/hig/)
- [GNOME scaling and adaptiveness](https://developer.gnome.org/hig/guidelines/adaptive.html)
- [GNOME keyboard guidance](https://developer.gnome.org/hig/guidelines/keyboard.html)
  - GNOME expects resizable/adaptive windows, constrained-first layout design, smooth breakpoints, complete keyboard operation, and standard shortcuts.

**Applied:** desktop behavior follows the target OS before brand styling; cross-platform apps adapt menus, modifiers, dialogs, chrome, scaling, and keyboard behavior rather than presenting one web shell everywhere.

## Design systems and visual foundations

- [Microsoft Fluent 2 design tokens](https://fluent2.microsoft.design/design-tokens)
  - Separates raw global values from semantic alias tokens and uses tokens to support light, dark, high-contrast, and branded themes.
- [IBM Carbon 2x Grid](https://carbondesignsystem.com/elements/2x-grid/overview/)
  - A constrained sizing and spacing system creates alignment, grouping, rhythm, and hierarchy across fluid and fixed layouts.
- [IBM Carbon themes](https://carbondesignsystem.com/elements/themes/overview/)
  - Role-based tokens keep component usage stable while theme values change; Carbon distinguishes universal, productive, editorial, and additional type roles.
- [Google Material 3 theming](https://codelabs.developers.google.com/jetpack-compose-theming)
  - Color roles, typography, and shape form a systematic theme; role pairings support accessible contrast.
- [Google research on expressive design](https://design.google/library/expressive-material-design-google-research)
  - Expression through color, size, shape, motion, and containment can improve attention and usability when grounded in user research and accessibility.

**Applied:** use semantic tokens, intentional spacing, context-appropriate typography, systematic color roles, and expression that directs attention rather than decorates indiscriminately.

## Responsive design, assets, and performance

- [web.dev responsive design basics](https://web.dev/articles/responsive-web-design-basics)
  - Use fluid layouts and content-driven breakpoints; do not assume device size determines input capabilities or hide important content solely by viewport.
- [web.dev optimize web fonts](https://web.dev/learn/performance/optimize-web-fonts)
  - Font files and `font-display` affect first rendering and layout stability; family/weight count, format, loading, and fallback metrics matter.
- [web.dev CSS for Web Vitals](https://web.dev/articles/css-web-vitals)
  - Layout, images, fonts, animations, and unused CSS can materially affect loading and cumulative layout shift.
- [SIL Open Font License](https://openfontlicense.org/)
  - Font use and redistribution depend on license terms; authorship, metadata, reserved names, and modification conditions must be respected.
- [Adobe React Spectrum internationalization](https://github.com/adobe/react-spectrum/)
  - Demonstrates cross-input, adaptive, RTL, locale-formatting, and multilingual component requirements; behavior can be shared while styling varies.

**Applied:** breakpoints follow content, font and asset choices include license/performance/script checks, and localization/RTL are layout requirements rather than final QA polish.

## Visual verification

- [Playwright screenshots](https://playwright.dev/docs/screenshots)
  - Supports viewport, full-page, element, and in-memory screenshots.
- [Storybook visual tests](https://storybook.js.org/docs/writing-tests/visual-testing)
  - Pixel baselines capture what users see and reveal visual regressions that markup snapshots can miss.
- [Storybook interaction tests](https://storybook.js.org/docs/writing-tests/interaction-testing)
  - Components can be rendered in known states and exercised with user interactions in a real browser.

**Applied:** prefer existing project tooling, capture stable baseline and final states, inspect rendered pixels, compare like-for-like cases, and keep visual verification distinct from functional and accessibility claims.

## Skill structure

- [Agent Skills specification](https://agentskills.io/specification)
  - Recommends progressive disclosure: concise discovery metadata, focused `SKILL.md`, and detailed references loaded only when needed.

**Applied:** operational instructions remain in `SKILL.md`; creative catalog, platform detail, QA procedure, template, and provenance load only for relevant tasks.
