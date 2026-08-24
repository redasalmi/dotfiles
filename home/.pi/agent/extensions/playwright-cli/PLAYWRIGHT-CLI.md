# Playwright CLI Pi extension

This extension integrates the official `playwright-cli` command-line browser agent with Pi.

## Usage

The extension is auto-discovered from this directory. Start Pi normally, then use:

```text
/playwright open https://example.com
/playwright snapshot
/playwright screenshot login.png
/playwright sessions
/playwright show
/playwright close
```

The LLM-callable `playwright` tool exposes the full Playwright CLI command surface, including navigation, accessibility snapshots, interaction, tabs, storage, network routing, console/evaluation, tracing, video, test debugging, locator generation, and browser/session management.

## Requirements

- Node.js 20 or newer
- `playwright-cli` available on `PATH`
- Browsers installed through Playwright when needed

Official installation:

```bash
npm install -g @playwright/cli@latest
playwright-cli install-browser
```

The extension does not install packages or browsers automatically. `/playwright install-skills` and `/playwright install-browser` run directly when requested. When the official CLI skill is installed, the extension exposes its package skill directory to Pi during resource discovery and reloads Pi after `/playwright install-skills`.

## Session behavior

Each Pi session maps to a deterministic Playwright session name. The mapping uses `PLAYWRIGHT_CLI_SESSION` when it is set; otherwise it derives a safe name from the Pi session ID.

Playwright browser sessions are intentionally not closed automatically when Pi exits. Use `/playwright close`, `/playwright close-all`, or the `playwright` tool when you want to close them.

## Execution

The extension does not add permission or confirmation dialogs. Playwright actions, including arbitrary code execution, browser attachment, storage access, file uploads, installation, and session deletion, run directly through Pi's extension process when requested.

The extension does not add a footer status or persistent widget. Results appear in the tool transcript or command notifications. Outputs are still truncated and common cookie, authorization, and password values are redacted before being returned to the model.
