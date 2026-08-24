# Platform, Accessibility, and Asset Guide

Use the relevant sections rather than applying every rule mechanically. Official target-platform conventions take precedence over generic cross-platform advice.

## Decision hierarchy

For behavior and component selection, prefer:

1. native semantic element or platform control;
2. established project component with verified behavior;
3. official platform/design-system pattern;
4. custom component following the expected interaction model.

A branded surface can still behave conventionally. Familiar behavior lowers learning cost and improves assistive-technology support.

## Marketing and content websites

Optimize for comprehension, trust, evidence, and one clear next action.

- State what the product is, who it helps, and why it is credible without forcing a long scroll.
- Build a narrative hierarchy instead of repeating interchangeable centered sections.
- Use truthful product evidence and meaningful visuals; never fabricate customers, quotes, ratings, or metrics.
- Change composition when the narrative changes while retaining grid and typography continuity.
- Keep navigation and calls to action clear at narrow widths and high zoom.
- Budget fonts, images, embeds, and motion against loading and layout stability.

## Web applications

Optimize for repeated task completion and state clarity.

- Derive navigation from information architecture; a sidebar is one option, not the default.
- Preserve working context during navigation and asynchronous operations.
- Design relevant loading, empty, error, stale, partial-data, permission, and offline states.
- Match density to usage: frequent expert tasks can be compact; occasional tasks need guidance and stronger recognition cues.
- Make destructive or irreversible actions explicit and recoverable where practical.
- Support keyboard workflows for frequent actions and visible focus for every action.

## Responsive and adaptive web behavior

- Let content determine breakpoints. Do not target named devices or assume screen size predicts pointer, touch, hover, or keyboard capability.
- Start with the most constrained useful layout, then add space and parallelism where the content benefits.
- Recompose and prioritize instead of merely shrinking or stacking. A pane might become a drawer, bottom sheet, disclosure, or separate route.
- Do not hide essential content solely because the viewport is small.
- Use fluid grids/media and component/container queries where they fit the existing support policy.
- Test immediately below and above each meaningful breakpoint, not only at common screenshot widths.
- Limit line length and surface width when additional width harms reading or separates related controls.

Useful starting views—not product requirements—are approximately 360×800, 768×1024, 1440×900, plus any product-specific extremes. WCAG reflow also requires attention around 320 CSS px for vertically scrolling web content, subject to documented exceptions.

## Web accessibility baseline

Target the project's required standard; when none is given, design toward WCAG 2.2 AA.

- Normal text needs at least 4.5:1 contrast and qualifying large text at least 3:1.
- Essential component boundaries and states need at least 3:1 non-text contrast where WCAG applies.
- Content should reflow without loss of information/function at the required narrow width, except genuinely two-dimensional content.
- Pointer targets should meet WCAG 2.2 AA minimum size or spacing requirements; prefer larger targets for touch-heavy use.
- Keyboard focus must be visible, logical, and not obscured by sticky regions or overlays.
- All functionality must be available without a pointer; drag interactions need a non-drag alternative where required.
- Status, errors, progress, and completion must be available to assistive technologies without disruptive focus changes.
- Support text resize/spacing without clipping controls or losing content.
- Do not encode state by color alone.
- Honor `prefers-reduced-motion`; replace or remove nonessential large-scale movement.

Prefer semantic HTML. If a custom widget is necessary, use the matching WAI-ARIA Authoring Practices pattern for roles, states, keyboard behavior, and focus management. Automated scans find only part of the problem; include keyboard and, when practical, screen-reader checks.

## Desktop applications

A desktop app is not a website with a fixed window. Determine the runtime and target OS: native toolkit, Electron, Tauri, Qt, Flutter, or another shell.

Design for:

- a documented minimum useful size, sensible default size, and productive large-window layout;
- continuous resizing, maximized/full-screen, tiling, scaling, and multiple displays;
- pointer and keyboard as first-class inputs;
- menus, command discoverability, shortcut labels, and context menus;
- toolbars, split panes, inspectors, status regions, tables, and multi-selection when task-appropriate;
- drag/drop plus keyboard alternatives, clipboard, undo/redo, inline editing, and file operations where relevant;
- dialogs/sheets/popovers, destructive confirmation, focus restoration, and interruption recovery;
- long sessions, stable spatial memory, dense information, and persistent window/pane preferences;
- offline, sync, update, permission, conflict, and file-system states when applicable.

Do not recreate OS-owned window controls unless custom chrome is intentional and moving, resizing, minimizing, maximizing, full-screen, system menus, accessibility, and drag regions remain correct.

### macOS

- Respect the global menu bar and standard File/Edit/View/Window/Help command organization.
- Use Command-based standard shortcuts and do not override system/accessibility shortcuts.
- Support full keyboard access, pointer precision, window resizing, full-screen, and multiple windows where the task expects them.
- Use toolbars, sidebars, inspectors, sheets, and settings terminology according to their platform roles.
- Do not imitate macOS with decorative traffic-light buttons inside content.

### Windows

- Follow Windows/Fluent behavior for navigation, title bars, command surfaces, focus visuals, access keys, dialogs, and selection.
- Preserve system window commands and valid titlebar drag regions.
- Use Ctrl-based standard shortcuts, logical tab order, and arrow-key inner navigation for grouped controls.
- Test system scaling, high contrast/forced colors, keyboard-only use, touch/pointer combinations, and narrow snapped windows.
- Do not put initial focus on a destructive action.

### GNOME/Linux

- When GNOME is the target, follow the GNOME HIG for header bars, primary/secondary menus, adaptive windows, standard shortcuts, and keyboard navigation.
- Primary windows should resize smoothly; constrained/tiled layouts must retain functionality.
- Support standard Tab/Shift+Tab, Return/Space, Escape, menu/context-menu, and platform shortcut behavior.
- For KDE or another desktop environment, use that environment's current HIG instead of applying GNOME visuals generically.
- Expect variation in fonts, themes, scaling, window managers, and input hardware.

### Cross-platform desktop

- Keep product identity in content, data, icons, and selected surfaces; adapt menus, modifier keys, labels, dialogs, and chrome per OS.
- Display the correct shortcut symbols/names for the running platform.
- Use a platform adapter for behavioral differences rather than a lowest-common-denominator web shell.
- Test at least one real target environment per supported OS before claiming native quality.

## Input behavior

### Keyboard

- Visual and focus order should agree with the task and locale.
- Restore focus sensibly after closing dialogs, menus, and transient views.
- Tab moves between components; arrow keys usually move within composite components.
- Common actions expose conventional shortcuts without making shortcuts mandatory.
- Escape, Enter/Return, Space, arrows, and platform modifiers follow control conventions.

### Touch

- Provide comfortably sized and separated targets.
- Never depend on hover for essential information or actions.
- Gestures need visible alternatives and must not conflict with system navigation.

### Pointer

- Cursors communicate text, links, dragging, and resizing accurately.
- Dense controls remain hittable and tooltips supplement—not replace—understandable labels.

## Localization and internationalization

- Test longer translated labels, multiline text, plural forms, and 200% text growth.
- Use locale-aware dates, times, numbers, currency, names, and sorting.
- Use logical start/end layout properties where possible and inspect a real RTL layout; mirroring alone does not solve mixed-direction content.
- Verify fonts cover required scripts and that fallback fonts preserve hierarchy and line metrics.
- Do not encode meaning in capitalization, word length, or English-specific alphabetical order.
- Keep icons directional only when their meaning is directional; do not mirror universal symbols indiscriminately.

## Fonts, imagery, and performance

- Verify font and image licenses before adding files or external URLs. Preserve required notices and do not assume “free download” permits redistribution.
- Follow repository policy for remote assets and third-party font services; consider privacy, offline behavior, CSP, and availability.
- For web fonts, minimize families/weights/subsets, prefer modern compressed formats where supported, and choose `font-display` deliberately.
- Match fallback metrics to reduce text reflow and layout shift; test slow loading and missing-font behavior.
- Verify glyph coverage with actual target-language text rather than a font marketing claim.
- Give images intrinsic dimensions/aspect ratios to prevent layout shift and provide appropriate alternatives for meaningful content.
- Compress and size assets for their rendered use. Decoration should not materially delay the primary task.

## Evidence limits

Using an accessible component library or design system does not make the complete product accessible. Likewise, following a platform HIG does not prove native quality. Report the exact checks performed and remaining gaps.
