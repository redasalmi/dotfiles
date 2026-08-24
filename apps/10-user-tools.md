# User-level tools

Tools installed outside the Fedora RPM package database on the current user account.

## Mise-managed tools

`mise` manages the runtimes and developer tools declared in `home/.config/mise/config.toml`. The complete tool list and source types are documented in the **Mise-managed tools** section of [MY-APPS.md](MY-APPS.md).

This includes Node.js with npm and Corepack, Go, Rust, Bun, Deno, pnpm, Yarn, the Pi/Codex/Playwright/Shopify/Chrome DevTools/Lighthouse tools, and other CLI utilities.

No separately installed Cargo applications were detected. Keep Mise-managed tools separate from Fedora RPM manifests.
