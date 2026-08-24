# Lighthouse CLI Pi extension

This extension integrates the official standalone [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse) with Pi.

## Requirements

- `lighthouse` version 13.4.1 or later-compatible installation on `PATH`
- Node.js supported by the installed Lighthouse package (`>=22.19` for Lighthouse 13.4.1)
- Chrome or Chromium available to Lighthouse

Check the installation with:

```bash
lighthouse --version
```

The extension launches Lighthouse through `pi.exec("lighthouse", ...)`. It does not reuse a
Chrome DevTools MCP daemon session unless a debugging port is explicitly passed through CLI
options.

## LLM tool

The extension registers the grouped `lighthouse_cli` tool. Use `action=run` for a normal
navigation audit:

```json
{
  "action": "run",
  "url": "https://example.com",
  "output": "json"
}
```

The tool returns a compact summary containing:

- Lighthouse version and final URL
- Category scores
- Core metric values
- Failed audits
- Top opportunities and estimated savings
- Runtime warnings and errors
- Report and artifact paths

JSON and HTML reports are saved to a temporary directory by default so large report contents do
not flood the conversation. Pass `outputPath` to choose a different location.

## Actions

### Normal audit

```json
{
  "action": "run",
  "url": "https://example.com",
  "options": {
    "preset": "desktop",
    "onlyCategories": "performance",
    "disableFullPageScreenshot": true
  }
}
```

`run` supports the complete Lighthouse CLI flag surface through `options`. Use arrays for
repeated flags and dotted names for nested options:

```json
{
  "action": "run",
  "url": "https://example.com",
  "options": {
    "onlyCategories": ["performance", "seo"],
    "throttlingMethod": "devtools",
    "throttling.cpuSlowdownMultiplier": 1
  }
}
```

### Gather and audit later

```json
{
  "action": "gather",
  "url": "https://example.com",
  "artifactPath": "/tmp/example-lighthouse-artifacts",
  "options": {
    "preset": "desktop",
    "onlyCategories": "performance"
  }
}
```

Then audit the saved artifacts:

```json
{
  "action": "audit",
  "artifactPath": "/tmp/example-lighthouse-artifacts",
  "output": "html",
  "options": {
    "preset": "desktop",
    "onlyCategories": "performance"
  }
}
```

The gather and audit settings must match. In particular, keep the same preset, category/audit
filters, emulation, throttling, and screenshot settings. This is an upstream Lighthouse
requirement when auditing saved artifacts.

### Metadata

```json
{"action": "list_audits"}
{"action": "list_locales"}
{"action": "list_trace_categories"}
{"action": "version"}
```

## Slash command

The `/lighthouse` command provides common human-facing access:

```text
/lighthouse https://example.com
/lighthouse run https://example.com --preset=desktop
/lighthouse https://example.com --only-categories=performance,seo
/lighthouse gather https://example.com --artifact-path=/tmp/lighthouse-artifacts
/lighthouse audit --artifact-path=/tmp/lighthouse-artifacts --output=html
/lighthouse run https://example.com --runs=3 --threshold.performance=90
/lighthouse compare_devices https://example.com --runs=3
/lighthouse compare_reports --baseline-path=before.json --candidate-path=after.json --regression-threshold.performance=5
/lighthouse list_audits
/lighthouse version
```

Use the `lighthouse_cli` tool for the complete typed interface and better structured output.

## Important options

The upstream CLI supports:

- `preset=perf`, `preset=desktop`, and `preset=experimental`
- `onlyCategories`, `onlyAudits`, and `skipAudits`
- `output=json|html|csv`
- `outputPath`
- `saveAssets`
- `formFactor`
- `screenEmulation.*`
- `emulatedUserAgent`
- `throttlingMethod=simulate|devtools|provided`
- `throttling.*`
- `blockedUrlPatterns`
- `extraHeaders`
- `disableStorageReset`
- `maxWaitForLoad`
- `plugins`
- `configPath`
- `port` and `hostname`
- `chromeFlags`

The extension defaults browser runs to `--headless=new`, `--quiet`, and
`--no-enable-error-reporting`. Pass `options.chromeFlags` to override the default Chrome flags.

The default Lighthouse run uses mobile emulation, simulated slow-4G networking, and CPU
slowdown. Use `preset=desktop` or explicit throttling/emulation options for comparisons.

## Repeated runs and comparisons

Run sequential audits and summarize scores and metrics using medians:

```json
{
  "action": "run",
  "url": "https://example.com",
  "repeatRuns": 3,
  "thresholds": {
    "performance": 90,
    "largest-contentful-paint": 2500,
    "cumulative-layout-shift": 0.1
  }
}
```

Category thresholds are minimum scores from 0–100. Audit metric thresholds are maximums in
Lighthouse numeric units, such as milliseconds for LCP and TBT. Unknown threshold keys fail the
threshold check. Repeated and device-comparison runs use temporary JSON reports internally so
medians can be calculated. Set `failOnThreshold: true` to return an error when a threshold is violated;
otherwise the result reports PASS or FAIL without failing the process.

Compare mobile and desktop medians directly:

```json
{
  "action": "compare_devices",
  "url": "https://example.com",
  "repeatRuns": 3,
  "thresholds": {"performance": 90}
}
```

Compare two saved JSON reports and report regressions:

```json
{
  "action": "compare_reports",
  "baselinePath": "./reports/before.json",
  "candidatePath": "./reports/after.json",
  "regressionThresholds": {
    "performance": 5,
    "largest-contentful-paint": 200
  },
  "failOnThreshold": true
}
```

Report-comparison category deltas are percentage points. Metric deltas use Lighthouse numeric
units. `regressionThresholds` define the maximum allowed degradation; regressions are still
reported even when no regression threshold is supplied.

## Authentication and sensitive data

Use `options.extraHeaders` only when necessary. It may contain authorization or cookie values and
is redacted from extension command output. Custom `configPath` files and `plugins` execute local
JavaScript and should only reference trusted files.

Lighthouse reports and saved DevTools logs may contain page content, URLs, headers, and other
sensitive data. The extension returns paths rather than embedding large report contents in the
conversation.

The extension does not request permissions, confirmation dialogs, footer status, or persistent
widget UI. It always disables Lighthouse CLI's optional Sentry error reporting unless the caller
explicitly overrides the flag.

## Scope and limitations

- Standalone Lighthouse navigation, full performance scoring, accessibility, SEO, best-practices,
  agentic-browsing, custom configs, plugins, CSV, gather/audit workflows, repeated medians,
  mobile/desktop comparisons, thresholds, and saved-report regression comparisons are supported.
- Lighthouse user flows, Puppeteer-controlled interactions, and in-memory custom gatherers are
  Node API features and are not exposed by this CLI wrapper.
- A standalone Lighthouse run uses its own Chrome process or a Chrome debugging port; it does not
  automatically operate on the browser state managed by the `chrome_devtools` extension.
- Lighthouse performance scores have natural variance. Repeated runs use sequential median
  summaries, but meaningful regression decisions still benefit from stable lab conditions.
