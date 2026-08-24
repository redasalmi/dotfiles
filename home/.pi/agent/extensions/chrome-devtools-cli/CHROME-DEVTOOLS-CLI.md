# Chrome DevTools CLI Pi extension

This extension integrates the official `chrome-devtools` CLI from
[`ChromeDevTools/chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp)
with Pi.

## Requirements

- Node.js supported by the installed `chrome-devtools-mcp` package
- Google Chrome or Chrome for Testing
- `chrome-devtools` available on `PATH`

Install the upstream CLI globally:

```bash
npm i chrome-devtools-mcp@latest -g
chrome-devtools status
```

## Usage

The LLM-callable `chrome_devtools` tool exposes the generated Chrome DevTools CLI
commands. Required tool arguments go in `args`; optional CLI flags go in
`options` using their camelCase names:

```json
{
  "command": "new_page",
  "args": ["https://example.com"]
}
```

```json
{
  "command": "lighthouse_audit",
  "options": {
    "mode": "snapshot",
    "device": "mobile"
  },
  "outputFormat": "json"
}
```

Use snapshots and their UIDs for browser interaction:

```text
chrome_devtools take_snapshot
chrome_devtools click args=["uid"]
chrome_devtools fill args=["uid", "value"]
```

## Slash command

Common commands are also available through:

```text
/chrome-devtools list_pages
/chrome-devtools new_page https://example.com
/chrome-devtools take_snapshot
/chrome-devtools lighthouse_audit --mode=snapshot --device=mobile
/chrome-devtools performance_start_trace --reload=true --autoStop=true --filePath=trace.json.gz
/chrome-devtools stop
```

Use `--output-format=json` for machine-readable output.

## Sessions

The upstream CLI uses a persistent background daemon. This extension gives each
Pi session a deterministic hexadecimal daemon session ID, so independent Pi
sessions do not accidentally share browser state.

Set `CHROME_DEVTOOLS_CLI_SESSION` or `CHROME_DEVTOOLS_SESSION_ID` to override the
session mapping. Invalid labels are deterministically hashed because the
upstream CLI accepts only hexadecimal characters and hyphens in session IDs.

The daemon starts automatically on the first browser command. Use `start`,
`status`, or `stop` when explicit lifecycle control is needed.

## Lighthouse

The upstream CLI includes `lighthouse_audit` directly. It audits:

- Accessibility
- SEO
- Best practices
- Agentic browsing

It intentionally excludes the Lighthouse performance category. Use:

```text
performance_start_trace
performance_stop_trace
performance_analyze_insight
```

for Chrome DevTools performance tracing and insights.

A separate standalone Lighthouse installation is only needed for advanced
Lighthouse features not exposed by the DevTools command, such as custom configs,
custom audits/plugins, CSV output, custom throttling, or full Lighthouse
performance-category runs.

## Files and telemetry

The upstream daemon restricts file-writing tools to MCP roots or the OS temporary
directory by default. To permit report, screenshot, or trace paths outside those
locations, start it with:

```bash
chrome-devtools start --allowUnrestrictedPaths=true
```

Chrome DevTools MCP usage statistics are enabled by default. Disable them with:

```bash
chrome-devtools start --no-usage-statistics
```

Performance CrUX lookups can be disabled with:

```bash
chrome-devtools start --no-performance-crux
```

The extension does not add Pi footer status or permission dialogs. Results are
returned through the tool transcript or command notifications. Output is
truncated and common cookie, authorization, and password values are redacted.
