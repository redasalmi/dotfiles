import { mkdtemp, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";

const ACTIONS = [
  "run",
  "gather",
  "audit",
  "compare_devices",
  "compare_reports",
  "list_audits",
  "list_locales",
  "list_trace_categories",
  "version",
] as const;

type Action = (typeof ACTIONS)[number];
type OutputFormat = "json" | "html" | "csv";
type OptionValue = string | number | boolean | string[];

const optionValue = Type.Union([
  Type.String(),
  Type.Number(),
  Type.Boolean(),
  Type.Array(Type.String()),
]);

const outputFormat = StringEnum(["json", "html", "csv"] as const, {
  description: "Lighthouse reporter format.",
});

const lighthouseParameters = Type.Object({
  action: StringEnum(ACTIONS, {
    description:
      "Lighthouse operation. run performs a complete audit; gather saves artifacts; audit processes saved artifacts; compare_devices runs mobile and desktop comparisons; compare_reports compares saved JSON reports; list_* prints CLI metadata.",
  }),
  url: Type.Optional(
    Type.String({
      description: "URL to audit. Required for run and gather; optional for audit mode.",
    }),
  ),
  artifactPath: Type.Optional(
    Type.String({
      description:
        "Directory used by gather/audit mode for saved artifacts. Relative paths resolve from the current working directory.",
    }),
  ),
  output: Type.Optional(
    Type.Union([
      outputFormat,
      Type.Array(outputFormat),
    ], {
      description: "Report format or formats. Defaults to JSON for run and audit.",
    }),
  ),
  outputPath: Type.Optional(
    Type.String({
      description:
        "Report output path. If omitted, run/audit reports are saved in a temporary directory and the path is returned.",
    }),
  ),
  options: Type.Optional(
    Type.Record(Type.String(), optionValue, {
      description:
        "Additional Lighthouse CLI flags using camelCase or kebab-case names. Arrays repeat flags; nested flags use dots, e.g. throttling.cpuSlowdownMultiplier=4.",
    }),
  ),
  repeatRuns: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 10,
      description: "Number of sequential runs. Results are summarized using medians.",
    }),
  ),
  thresholds: Type.Optional(
    Type.Record(Type.String(), Type.Number(), {
      description:
        "Quality thresholds. Category scores use 0-100 minimums; audit metric values use Lighthouse numeric units and are maximums.",
    }),
  ),
  regressionThresholds: Type.Optional(
    Type.Record(Type.String(), Type.Number(), {
      description:
        "Maximum allowed degradation for compare_reports. Category values are score percentage points; metric values use Lighthouse numeric units.",
    }),
  ),
  failOnThreshold: Type.Optional(
    Type.Boolean({
      description: "Fail the action when a quality or regression threshold is violated.",
    }),
  ),
  baselinePath: Type.Optional(
    Type.String({description: "Baseline JSON Lighthouse report for compare_reports."}),
  ),
  candidatePath: Type.Optional(
    Type.String({description: "Candidate JSON Lighthouse report for compare_reports."}),
  ),
  timeoutMs: Type.Optional(
    Type.Integer({
      minimum: 1,
      description: "Pi process timeout in milliseconds per Lighthouse process.",
    }),
  ),
});

type LighthouseParams = Static<typeof lighthouseParameters>;

type LighthouseAudit = {
  id?: string;
  title?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  numericValue?: number;
  numericUnit?: string;
  displayValue?: string;
  explanation?: string;
  details?: {
    type?: string;
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
  };
};

type LighthouseResult = {
  lighthouseVersion?: string;
  requestedUrl?: string;
  finalDisplayedUrl?: string;
  fetchTime?: string;
  timing?: { total?: number };
  runtimeError?: { code?: string; message?: string };
  runWarnings?: Array<string | { message?: string }>;
  configSettings?: {
    formFactor?: string;
    throttlingMethod?: string;
    output?: string | string[];
  };
  categories?: Record<string, {
    id?: string;
    title?: string;
    score?: number | null;
    categoryScoreDisplayMode?: string;
  }>;
  audits?: Record<string, LighthouseAudit>;
};

type LighthouseMetric = {
  id: string;
  value: string;
  numericValue?: number;
  numericUnit?: string;
};

type LighthouseSummary = {
  version?: string;
  url?: string;
  scores: Array<{ id: string; title: string; score: string }>;
  categoryScores: Record<string, number | null>;
  categoryScoreModes: Record<string, string | undefined>;
  metrics: LighthouseMetric[];
  metricValues: Record<string, number>;
  metricUnits: Record<string, string | undefined>;
  failedAudits: Array<{ id: string; title: string; score: number; displayValue?: string }>;
  opportunities: Array<{ id: string; title: string; savingsMs?: number; savingsBytes?: number }>;
  warnings: string[];
  runtimeError?: string;
  timingMs?: number;
};

type ThresholdCheck = {
  key: string;
  actual?: number;
  threshold: number;
  unit: string;
  rule: "minimum" | "maximum";
  passed: boolean;
};

type ThresholdReport = {
  passed: boolean;
  checks: ThresholdCheck[];
  failures: ThresholdCheck[];
};

type ComparisonPoint = {
  id: string;
  title: string;
  baseline?: number;
  candidate?: number;
  delta?: number;
  unit: "score" | string;
  regression: boolean;
  allowedRegression?: number;
  withinRegressionThreshold?: boolean;
};

type ReportComparison = {
  baselineLabel: string;
  candidateLabel: string;
  detectRegressions: boolean;
  scores: ComparisonPoint[];
  metrics: ComparisonPoint[];
  regressions: ComparisonPoint[];
  thresholdFailures: ComparisonPoint[];
};

type LighthouseDetails = {
  action: Action;
  cliCommand: string;
  args: string[];
  code: number;
  outputFormat?: OutputFormat | OutputFormat[];
  reportPath?: string;
  artifactPaths: string[];
  tempDirectory?: string;
  summary?: LighthouseSummary;
  repeatedRuns?: number;
  thresholdReport?: ThresholdReport;
  thresholdReports?: Record<string, ThresholdReport>;
  comparison?: ReportComparison;
  runDetails?: LighthouseDetails[];
  stdout: string;
  stderr: string;
};

type ActionResult = {
  text: string;
  details: LighthouseDetails;
};

type SingleExecution = {
  lhr?: LighthouseResult;
  summary?: LighthouseSummary;
  result: ActionResult;
};

type PreparedRun = {
  args: string[];
  outputFormats?: OutputFormat | OutputFormat[];
  reportPath?: string;
  artifactPath?: string;
  tempDirectory?: string;
};

const MAX_OUTPUT_BYTES = 32_000;
const MAX_OUTPUT_LINES = 1_200;
const MAX_SUMMARY_BYTES = 16_000;
const DEFAULT_TIMEOUT = 180_000;
const ARTIFACT_EXTENSIONS =
  "html|json|csv|gz|png|jpeg|jpg|webp|trace|devtoolslog|txt";

const METRIC_IDS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
  "interaction-to-next-paint",
] as const;

type MetadataAction = "list_audits" | "list_locales" | "list_trace_categories" | "version";

const LIST_FLAGS: Record<MetadataAction, string> = {
  list_audits: "list-all-audits",
  list_locales: "list-locales",
  list_trace_categories: "list-trace-categories",
  version: "version",
};

const BOOLEAN_FLAGS = new Set([
  "verbose",
  "quiet",
  "save-assets",
  "list-all-audits",
  "list-locales",
  "list-trace-categories",
  "debug-navigation",
  "enable-error-reporting",
  "gather-mode",
  "audit-mode",
  "disable-full-page-screenshot",
  "ignore-status-code",
  "disable-storage-reset",
  "view",
  "chrome-ignore-default-flags",
  "screenEmulation.disabled",
  "no-enable-error-reporting",
  "no-emulated-user-agent",
]);

function truncateText(input: string, maxBytes = MAX_OUTPUT_BYTES): string {
  const lines = input.split("\n");
  const lineLimited = lines.length > MAX_OUTPUT_LINES
    ? `${lines.slice(0, MAX_OUTPUT_LINES).join("\n")}\n[… output truncated at ${MAX_OUTPUT_LINES} lines …]`
    : input;

  if (Buffer.byteLength(lineLimited, "utf8") <= maxBytes) return lineLimited;
  const bytes = Buffer.from(lineLimited, "utf8");
  return `${bytes.subarray(0, maxBytes).toString("utf8")}\n[… output truncated at ${maxBytes} bytes …]`;
}

function redactSecrets(input: string): string {
  return input
    .replace(/(--extra-(?:headers|headers-path)=)([^\s]+)/gi, "$1[REDACTED]")
    .replace(/([\"']?(?:authorization|cookie|set-cookie|password|passwd|token|secret|api[-_]?key)[\"']?\s*[:=]\s*)(\"[^\"]*\"|'[^']*'|[^,}\s\]]+)/gi, "$1[REDACTED]")
    .replace(/(authorization\s*[:=]\s*(?:bearer\s+)?)[^\s,}\]]+/gi, "$1[REDACTED]");
}

function shellQuote(value: string): string {
  return /[^a-zA-Z0-9_./:=@%+,-]/.test(value) ? JSON.stringify(value) : value;
}

function commandLabel(args: string[]): string {
  return `lighthouse ${args.map(shellQuote).join(" ")}`;
}

function appendOption(args: string[], name: string, value: OptionValue): void {
  if (Array.isArray(value)) {
    for (const item of value) args.push(`--${name}=${item}`);
    return;
  }
  args.push(`--${name}=${String(value)}`);
}

function hasOption(options: Record<string, OptionValue>, names: string[]): boolean {
  return names.some(name => Object.prototype.hasOwnProperty.call(options, name));
}

function getOption(options: Record<string, OptionValue>, names: string[]): OptionValue | undefined {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(options, name)) return options[name];
  }
  return undefined;
}

function asOutputFormats(value: LighthouseParams["output"] | OptionValue | undefined): OutputFormat[] {
  if (value === undefined) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.filter((item): item is OutputFormat =>
    item === "json" || item === "html" || item === "csv"
  );
}

function resolveUserPath(value: string, cwd: string): string {
  return resolve(cwd, value);
}

function stripKnownExtension(value: string): string {
  return value.replace(/\.[a-z0-9]{2,12}$/i, "");
}

function reportPathForFormats(outputPath: string, formats: OutputFormat[], cwd: string): string | undefined {
  if (outputPath === "stdout") return undefined;
  const resolvedPath = resolveUserPath(outputPath, cwd);
  if (formats.length !== 1) {
    return formats.includes("json") ? `${stripKnownExtension(resolvedPath)}.report.json` : undefined;
  }
  return resolvedPath;
}

function cleanArtifactPath(value: string): string {
  return value.replace(/[),.;]+$/g, "");
}

function extractArtifactPaths(output: string): string[] {
  const pathPattern = new RegExp(
    `(?:^|[\\s([\\\"'])((?:/|\\./|[A-Za-z]:[\\\\/])[^\\s)\\],;\\\"']+\\.(?:${ARTIFACT_EXTENSIONS})(?:\\.gz)?)`,
    "g",
  );
  const paths: string[] = [];
  for (const match of output.matchAll(pathPattern)) {
    paths.push(cleanArtifactPath(match[1]));
  }
  return [...new Set(paths)];
}

function parseJsonOutput(output: string): unknown | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return undefined;
    }
  }
}

function isLighthouseResult(value: unknown): value is LighthouseResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.audits === "object" || typeof candidate.categories === "object";
}

function scoreText(score: number | null | undefined, displayMode?: string): string {
  if (score === null || score === undefined) return "n/a";
  if (displayMode === "fraction") return String(score);
  return `${Math.round(score * 100)}%`;
}

function auditDisplayValue(audit: LighthouseAudit): string | undefined {
  if (audit.displayValue) return audit.displayValue;
  if (typeof audit.numericValue !== "number") return undefined;
  return formatNumericMetric(audit.numericValue, audit.numericUnit);
}

function formatNumericMetric(value: number, unit?: string): string {
  if (unit === "millisecond") return `${Math.round(value)} ms`;
  if (unit === "unitless") return String(Number(value.toFixed(3)));
  return String(Number(value.toFixed(3)));
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function collectWarnings(lhr: LighthouseResult): string[] {
  const warnings = (lhr.runWarnings ?? []).map(warning =>
    typeof warning === "string" ? warning : warning.message ?? JSON.stringify(warning)
  );
  if (lhr.runtimeError?.message) warnings.unshift(lhr.runtimeError.message);
  return [...new Set(warnings.filter(Boolean))];
}

function summarizeLighthouseResult(lhr: LighthouseResult): LighthouseSummary {
  const scores = Object.entries(lhr.categories ?? {}).map(([id, category]) => ({
    id,
    title: category.title ?? id,
    score: scoreText(category.score, category.categoryScoreDisplayMode),
  }));
  const categoryScores = Object.fromEntries(
    Object.entries(lhr.categories ?? {}).map(([id, category]) => [id, category.score ?? null]),
  );

  const audits = lhr.audits ?? {};
  const metrics: LighthouseMetric[] = [];
  const metricValues: Record<string, number> = {};
  const metricUnits: Record<string, string | undefined> = {};
  for (const id of METRIC_IDS) {
    const audit = audits[id];
    if (!audit) continue;
    const value = auditDisplayValue(audit);
    if (value) metrics.push({
      id,
      value,
      numericValue: audit.numericValue,
      numericUnit: audit.numericUnit,
    });
    if (typeof audit.numericValue === "number") {
      metricValues[id] = audit.numericValue;
      metricUnits[id] = audit.numericUnit;
    }
  }

  const failedAudits = Object.entries(audits)
    .filter(([, audit]) =>
      typeof audit.score === "number" &&
      audit.score < 1 &&
      !["manual", "informative", "notApplicable", "error"].includes(audit.scoreDisplayMode ?? "")
    )
    .map(([id, audit]) => ({
      id,
      title: audit.title ?? id,
      score: audit.score as number,
      displayValue: auditDisplayValue(audit),
    }))
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id));

  const opportunities = Object.entries(audits)
    .filter(([, audit]) =>
      audit.details?.type === "opportunity" ||
      typeof audit.details?.overallSavingsMs === "number" ||
      typeof audit.details?.overallSavingsBytes === "number"
    )
    .map(([id, audit]) => ({
      id,
      title: audit.title ?? id,
      savingsMs: audit.details?.overallSavingsMs,
      savingsBytes: audit.details?.overallSavingsBytes,
    }))
    .sort((a, b) =>
      (b.savingsMs ?? 0) - (a.savingsMs ?? 0) ||
      (b.savingsBytes ?? 0) - (a.savingsBytes ?? 0)
    );

  return {
    version: lhr.lighthouseVersion,
    url: lhr.finalDisplayedUrl ?? lhr.requestedUrl,
    scores,
    categoryScores,
    categoryScoreModes: Object.fromEntries(
      Object.entries(lhr.categories ?? {}).map(([id, category]) => [id, category.categoryScoreDisplayMode]),
    ),
    metrics,
    metricValues,
    metricUnits,
    failedAudits,
    opportunities,
    warnings: collectWarnings(lhr),
    runtimeError: lhr.runtimeError?.message,
    timingMs: lhr.timing?.total,
  };
}

function medianSummary(summaries: LighthouseSummary[]): LighthouseSummary {
  if (summaries.length === 0) throw new Error("Cannot calculate a median without Lighthouse results.");
  const first = summaries[0];
  const categoryIds = [...new Set(summaries.flatMap(summary => Object.keys(summary.categoryScores)))];
  const categoryScores: Record<string, number | null> = {};
  const categoryScoreModes: Record<string, string | undefined> = {};
  for (const id of categoryIds) {
    const values = summaries
      .map(summary => summary.categoryScores[id])
      .filter((value): value is number => typeof value === "number");
    categoryScores[id] = median(values) ?? null;
    categoryScoreModes[id] = first.categoryScoreModes[id];
  }

  const scores = categoryIds.map(id => ({
    id,
    title: summaries.find(summary => summary.scores.some(score => score.id === id))?.scores.find(score => score.id === id)?.title ?? id,
    score: scoreText(categoryScores[id], categoryScoreModes[id]),
  }));

  const metricIds = [...new Set(summaries.flatMap(summary => Object.keys(summary.metricValues)))];
  const metricValues: Record<string, number> = {};
  const metricUnits: Record<string, string | undefined> = {};
  const metrics: LighthouseMetric[] = [];
  for (const id of metricIds) {
    const values = summaries
      .map(summary => summary.metricValues[id])
      .filter((value): value is number => typeof value === "number");
    const value = median(values);
    if (value === undefined) continue;
    metricValues[id] = value;
    metricUnits[id] = summaries.find(summary => summary.metricUnits[id])?.metricUnits[id];
    metrics.push({
      id,
      value: formatNumericMetric(value, metricUnits[id]),
      numericValue: value,
      numericUnit: metricUnits[id],
    });
  }

  const failedAudits = [...new Map(
    summaries.flatMap(summary => summary.failedAudits).map(audit => [audit.id, audit]),
  ).values()].sort((a, b) => a.score - b.score || a.id.localeCompare(b.id));
  const opportunities = [...new Map(
    summaries.flatMap(summary => summary.opportunities).map(opportunity => [opportunity.id, opportunity]),
  ).values()];
  const warnings = [...new Set(summaries.flatMap(summary => summary.warnings))];
  const timingMs = median(summaries.map(summary => summary.timingMs).filter((value): value is number => value !== undefined));

  return {
    version: first.version,
    url: first.url,
    scores,
    categoryScores,
    categoryScoreModes,
    metrics,
    metricValues,
    metricUnits,
    failedAudits,
    opportunities,
    warnings,
    runtimeError: summaries.find(summary => summary.runtimeError)?.runtimeError,
    timingMs,
  };
}

function thresholdValue(
  thresholds: Record<string, number>,
  id: string,
  category: boolean,
): number | undefined {
  const aliases = category
    ? [id, `category.${id}`, `categories.${id}`]
    : [id, `metric.${id}`, `metrics.${id}`];
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(thresholds, alias)) return thresholds[alias];
  }
  return undefined;
}

function evaluateThresholds(
  summary: LighthouseSummary,
  thresholds: Record<string, number> | undefined,
): ThresholdReport | undefined {
  if (!thresholds || Object.keys(thresholds).length === 0) return undefined;
  const checks: ThresholdCheck[] = [];
  for (const [key, threshold] of Object.entries(thresholds)) {
    const categoryId = key.replace(/^(category|categories)\./, "");
    const metricId = key.replace(/^(metric|metrics)\./, "");
    if (Object.prototype.hasOwnProperty.call(summary.categoryScores, categoryId)) {
      const score = summary.categoryScores[categoryId];
      const actual = typeof score === "number" ? score * 100 : undefined;
      checks.push({key, actual, threshold, unit: "score", rule: "minimum", passed: actual !== undefined && actual >= threshold});
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(summary.metricValues, metricId)) {
      const actual = summary.metricValues[metricId];
      checks.push({
        key,
        actual,
        threshold,
        unit: summary.metricUnits[metricId] ?? "numeric",
        rule: "maximum",
        passed: actual <= threshold,
      });
      continue;
    }
    checks.push({key, threshold, unit: "unavailable", rule: "maximum", passed: false});
  }
  return {passed: checks.every(check => check.passed), checks, failures: checks.filter(check => !check.passed)};
}

function formatThresholdReport(report: ThresholdReport | undefined): string[] {
  if (!report) return [];
  const lines = ["", `Thresholds: ${report.passed ? "PASS" : "FAIL"}`];
  for (const check of report.checks) {
    const actual = check.actual === undefined ? "unavailable" : formatNumericMetric(check.actual, check.unit);
    lines.push(`- ${check.key}: ${actual} ${check.rule === "minimum" ? ">=" : "<="} ${check.threshold} ${check.unit}`);
  }
  return lines;
}

function buildComparison(
  baseline: LighthouseSummary,
  candidate: LighthouseSummary,
  baselineLabel: string,
  candidateLabel: string,
  regressionThresholds?: Record<string, number>,
  detectRegressions = true,
): ReportComparison {
  const scores: ComparisonPoint[] = [];
  const scoreIds = [...new Set([...Object.keys(baseline.categoryScores), ...Object.keys(candidate.categoryScores)])];
  for (const id of scoreIds) {
    const baselineValue = baseline.categoryScores[id];
    const candidateValue = candidate.categoryScores[id];
    const point: ComparisonPoint = {
      id,
      title: candidate.scores.find(score => score.id === id)?.title ?? baseline.scores.find(score => score.id === id)?.title ?? id,
      baseline: typeof baselineValue === "number" ? baselineValue * 100 : undefined,
      candidate: typeof candidateValue === "number" ? candidateValue * 100 : undefined,
      unit: "score",
      regression: detectRegressions && typeof baselineValue === "number" && typeof candidateValue === "number" && candidateValue < baselineValue,
    };
    if (point.baseline !== undefined && point.candidate !== undefined) point.delta = point.candidate - point.baseline;
    const allowed = regressionThresholds ? thresholdValue(regressionThresholds, id, true) : undefined;
    if (allowed !== undefined) {
      point.allowedRegression = allowed;
      point.withinRegressionThreshold = !point.regression || Math.abs(point.delta ?? 0) <= allowed;
    }
    scores.push(point);
  }

  const metrics: ComparisonPoint[] = [];
  const metricIds = [...new Set([...Object.keys(baseline.metricValues), ...Object.keys(candidate.metricValues)])];
  for (const id of metricIds) {
    const baselineValue = baseline.metricValues[id];
    const candidateValue = candidate.metricValues[id];
    const delta = baselineValue !== undefined && candidateValue !== undefined ? candidateValue - baselineValue : undefined;
    const point: ComparisonPoint = {
      id,
      title: candidate.metrics.find(metric => metric.id === id)?.id ?? id,
      baseline: baselineValue,
      candidate: candidateValue,
      delta,
      unit: candidate.metricUnits[id] ?? baseline.metricUnits[id] ?? "numeric",
      regression: detectRegressions && delta !== undefined && delta > 0,
    };
    const allowed = regressionThresholds ? thresholdValue(regressionThresholds, id, false) : undefined;
    if (allowed !== undefined) {
      point.allowedRegression = allowed;
      point.withinRegressionThreshold = !point.regression || Math.abs(delta ?? 0) <= allowed;
    }
    metrics.push(point);
  }

  const points = [...scores, ...metrics];
  return {
    baselineLabel,
    candidateLabel,
    detectRegressions,
    scores,
    metrics,
    regressions: points.filter(point => point.regression),
    thresholdFailures: points.filter(point => point.withinRegressionThreshold === false),
  };
}

function formatComparisonValue(value: number | undefined, unit: string): string {
  if (value === undefined) return "unavailable";
  if (unit === "score") return `${value.toFixed(1)}%`;
  return formatNumericMetric(value, unit);
}

function formatComparison(comparison: ReportComparison): string {
  const lines = [
    `Comparison: ${comparison.baselineLabel} → ${comparison.candidateLabel}`,
    "",
    "Scores:",
    ...comparison.scores.map(point =>
      `- ${point.title}: ${formatComparisonValue(point.baseline, point.unit)} → ${formatComparisonValue(point.candidate, point.unit)} (${point.delta === undefined ? "n/a" : `${point.delta >= 0 ? "+" : ""}${point.delta.toFixed(1)} pts`})${point.regression ? " REGRESSION" : ""}`
    ),
  ];
  if (comparison.metrics.length > 0) {
    lines.push("", "Metrics:", ...comparison.metrics.map(point =>
      `- ${point.id}: ${formatComparisonValue(point.baseline, point.unit)} → ${formatComparisonValue(point.candidate, point.unit)} (${point.delta === undefined ? "n/a" : `${point.delta >= 0 ? "+" : ""}${formatNumericMetric(point.delta, point.unit)}`})${point.regression ? " REGRESSION" : ""}`
    ));
  }
  lines.push("", `${comparison.detectRegressions ? "Regressions" : "Differences"}: ${comparison.regressions.length}`);
  if (comparison.thresholdFailures.length > 0) {
    lines.push("", "Regression threshold failures:", ...comparison.thresholdFailures.map(point =>
      `- ${point.id}: degradation ${formatNumericMetric(Math.abs(point.delta ?? 0), point.unit)} > allowed ${point.allowedRegression} ${point.unit}`
    ));
  }
  return truncateText(lines.join("\n"), MAX_SUMMARY_BYTES);
}

function formatSummary(summary: LighthouseSummary, reportPath?: string, artifactPaths: string[] = [], thresholdReport?: ThresholdReport): string {
  const lines = [
    `Lighthouse ${summary.version ?? "completed"}`,
    summary.url ? `URL: ${summary.url}` : "",
    "",
    "Scores:",
    ...summary.scores.map(category => `- ${category.title}: ${category.score}`),
  ];

  if (summary.metrics.length > 0) {
    lines.push("", "Metrics:", ...summary.metrics.map(metric => `- ${metric.id}: ${metric.value}`));
  }

  if (summary.failedAudits.length > 0) {
    lines.push(
      "",
      `Failed audits (${summary.failedAudits.length}):`,
      ...summary.failedAudits.slice(0, 25).map(audit =>
        `- ${audit.id}: ${audit.title}${audit.displayValue ? ` (${audit.displayValue})` : ""}`
      ),
    );
    if (summary.failedAudits.length > 25) lines.push("- … additional failures are in the JSON report");
  }

  if (summary.opportunities.length > 0) {
    lines.push(
      "",
      "Top opportunities:",
      ...summary.opportunities.slice(0, 10).map(opportunity => {
        const savings = [
          opportunity.savingsMs !== undefined ? `${Math.round(opportunity.savingsMs)} ms` : "",
          opportunity.savingsBytes !== undefined ? `${Math.round(opportunity.savingsBytes / 1024)} KiB` : "",
        ].filter(Boolean).join(", ");
        return `- ${opportunity.id}: ${opportunity.title}${savings ? ` (${savings})` : ""}`;
      }),
    );
  }

  if (summary.warnings.length > 0) {
    lines.push("", "Warnings:", ...summary.warnings.map(warning => `- ${warning}`));
  }
  if (summary.timingMs !== undefined) lines.push("", `Run time: ${Math.round(summary.timingMs)} ms`);
  lines.push(...formatThresholdReport(thresholdReport));
  if (reportPath) lines.push("", `Report: ${reportPath}`);
  if (artifactPaths.length > 0) lines.push("", "Artifacts:", ...artifactPaths.map(path => `- ${path}`));

  return truncateText(lines.filter((line, index) => line !== "" || lines[index - 1] !== "").join("\n"), MAX_SUMMARY_BYTES);
}

function parseSlashCommand(input: string): LighthouseParams | undefined {
  const tokens = input.trim().match(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|(\S+)/g)
    ?.map(token => token.startsWith("\"") || token.startsWith("'") ? token.slice(1, -1) : token) ?? [];
  if (tokens.length === 0) return undefined;

  let action: Action = "run";
  if (ACTIONS.includes(tokens[0] as Action)) action = tokens.shift() as Action;

  let url: string | undefined;
  let artifactPath: string | undefined;
  let outputPath: string | undefined;
  let output: OutputFormat | OutputFormat[] | undefined;
  let repeatRuns: number | undefined;
  let thresholds: Record<string, number> | undefined;
  let regressionThresholds: Record<string, number> | undefined;
  let failOnThreshold: boolean | undefined;
  let baselinePath: string | undefined;
  let candidatePath: string | undefined;
  let timeoutMs: number | undefined;
  const options: Record<string, OptionValue> = {};
  const positional: string[] = [];

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const body = token.slice(2);
    const equals = body.indexOf("=");
    let name = equals >= 0 ? body.slice(0, equals) : body;
    let value: OptionValue = equals >= 0 ? body.slice(equals + 1) : true;

    if (equals < 0 && value === true && !BOOLEAN_FLAGS.has(name) && tokens[index + 1] && !tokens[index + 1].startsWith("--")) {
      value = tokens[++index];
    }
    if (name.startsWith("no-")) {
      name = name.slice(3);
      value = false;
    }

    if (["artifact-path", "artifacts-path"].includes(name)) {
      artifactPath = String(value);
      continue;
    }
    if (["output-path", "report-path"].includes(name)) {
      outputPath = String(value);
      continue;
    }
    if (name === "output-format") name = "output";
    if (name === "output") {
      const formats = asOutputFormats(value);
      if (formats.length === 0) throw new Error("--output must be json, html, or csv.");
      output = output === undefined ? formats[0] : [...asOutputFormats(output), ...formats];
      continue;
    }
    if (name === "repeat-runs" || name === "runs") {
      repeatRuns = Number(value);
      continue;
    }
    if (name.startsWith("threshold.") || name.startsWith("thresholds.")) {
      thresholds ??= {};
      thresholds[name.replace(/^thresholds?\./, "")] = Number(value);
      continue;
    }
    if (name.startsWith("regression-threshold.") || name.startsWith("regression-thresholds.")) {
      regressionThresholds ??= {};
      regressionThresholds[name.replace(/^regression-thresholds?\./, "")] = Number(value);
      continue;
    }
    if (name === "fail-on-threshold" || name === "fail-on-thresholds") {
      failOnThreshold = value === true || value === "true";
      continue;
    }
    if (name === "baseline-path") {
      baselinePath = String(value);
      continue;
    }
    if (name === "candidate-path") {
      candidatePath = String(value);
      continue;
    }
    if (name === "timeout" || name === "timeout-ms") {
      timeoutMs = Number(value);
      continue;
    }

    const previous = options[name];
    if (previous === undefined) options[name] = value;
    else if (Array.isArray(previous)) previous.push(String(value));
    else options[name] = [String(previous), String(value)];
  }

  if (positional.length > 0) url = positional[0];
  return {
    action,
    url,
    artifactPath,
    output,
    outputPath,
    repeatRuns,
    thresholds,
    regressionThresholds,
    failOnThreshold,
    baselinePath,
    candidatePath,
    options: Object.keys(options).length > 0 ? options : undefined,
    timeoutMs,
  } as LighthouseParams;
}

function helpText(): string {
  return [
    "/lighthouse [run|gather|audit|compare_devices|compare_reports|list_audits|list_locales|list_trace_categories|version] [url] [--flag=value]",
    "Examples:",
    "  /lighthouse https://example.com",
    "  /lighthouse run https://example.com --preset=desktop",
    "  /lighthouse https://example.com --only-categories=performance,seo",
    "  /lighthouse gather https://example.com --artifact-path=/tmp/lh-artifacts",
    "  /lighthouse audit --artifact-path=/tmp/lh-artifacts",
    "  /lighthouse compare_devices https://example.com --runs=3",
    "  /lighthouse compare_reports --baseline-path=before.json --candidate-path=after.json --regression-threshold.performance=5",
    "  /lighthouse list_audits",
    "  /lighthouse version",
    "Use the lighthouse_cli tool for the complete typed interface.",
  ].join("\n");
}

async function prepareRun(params: LighthouseParams, ctx: ExtensionContext): Promise<PreparedRun> {
  const options = {...(params.options ?? {})} as Record<string, OptionValue>;
  const args: string[] = [];
  const action = params.action as Action;
  let tempDirectory: string | undefined;
  let reportPath: string | undefined;
  let artifactPath: string | undefined;

  if (action === "run" || action === "gather") {
    if (!params.url) throw new Error(`${action} requires a URL.`);
    args.push(params.url);
  } else if (action === "audit" && params.url) {
    args.push(params.url);
  } else if (action.startsWith("list_") || action === "version") {
    args.push(`--${LIST_FLAGS[action as MetadataAction]}`);
  }

  if (action === "gather" && !hasOption(options, ["gather-mode", "gatherMode"])) {
    artifactPath = params.artifactPath
      ? resolveUserPath(params.artifactPath, ctx.cwd)
      : await mkdtemp(join(tmpdir(), "pi-lighthouse-artifacts-"));
    args.push(`--gather-mode=${artifactPath}`);
  } else if (action === "audit" && !hasOption(options, ["audit-mode", "auditMode"])) {
    if (params.artifactPath) {
      artifactPath = resolveUserPath(params.artifactPath, ctx.cwd);
      args.push(`--audit-mode=${artifactPath}`);
    } else {
      args.push("--audit-mode");
    }
  }

  if (!hasOption(options, ["enable-error-reporting", "enableErrorReporting"])) {
    args.push("--no-enable-error-reporting");
  }
  if (!hasOption(options, ["quiet"]) && !hasOption(options, ["verbose"])) {
    args.push("--quiet");
  }
  if (!hasOption(options, ["chrome-flags", "chromeFlags"]) && (action === "run" || action === "gather" || action === "audit")) {
    args.push("--chrome-flags=--headless=new");
  }

  const optionHasOutput = hasOption(options, ["output"]);
  const optionHasOutputPath = hasOption(options, ["output-path", "outputPath"]);
  const outputFormats = asOutputFormats(params.output ?? getOption(options, ["output"]));
  const effectiveOutputFormats = outputFormats.length > 0
    ? outputFormats
    : (action === "run" || action === "audit" ? ["json" as OutputFormat] : undefined);

  if (action === "run" || action === "audit") {
    if (params.output !== undefined) {
      appendOption(args, "output", params.output);
    } else if (!optionHasOutput) {
      appendOption(args, "output", "json");
    }
  }

  if (action === "run" || action === "audit") {
    const formats = effectiveOutputFormats ?? ["json" as OutputFormat];
    if (params.outputPath !== undefined) {
      args.push(`--output-path=${params.outputPath}`);
      reportPath = reportPathForFormats(params.outputPath, formats, ctx.cwd);
    } else if (!optionHasOutputPath) {
      tempDirectory = await mkdtemp(join(tmpdir(), "pi-lighthouse-report-"));
      const outputValue = formats.length === 1
        ? join(tempDirectory, `lighthouse-report.${formats[0]}`)
        : join(tempDirectory, "lighthouse-report");
      args.push(`--output-path=${outputValue}`);
      reportPath = reportPathForFormats(outputValue, formats, ctx.cwd);
    } else {
      const rawOutputPath = getOption(options, ["output-path", "outputPath"]);
      if (typeof rawOutputPath === "string") {
        reportPath = reportPathForFormats(rawOutputPath, formats, ctx.cwd);
      }
    }
  }

  if (params.options) {
    for (const [name, value] of Object.entries(params.options)) {
      if (params.output !== undefined && name === "output") continue;
      if (params.outputPath !== undefined && ["outputPath", "output-path"].includes(name)) continue;
      appendOption(args, name, value as OptionValue);
    }
  }

  return {
    args,
    outputFormats: effectiveOutputFormats,
    reportPath,
    artifactPath,
    tempDirectory,
  };
}

function withoutReportOptions(options: LighthouseParams["options"]): Record<string, OptionValue> | undefined {
  if (!options) return undefined;
  const copy = {...options} as Record<string, OptionValue>;
  for (const name of ["output", "outputPath", "output-path"]) delete copy[name];
  return Object.keys(copy).length > 0 ? copy : undefined;
}

function withoutDeviceOptions(options: LighthouseParams["options"]): Record<string, OptionValue> | undefined {
  const copy = withoutReportOptions(options);
  if (!copy) return undefined;
  for (const name of Object.keys(copy)) {
    if (["preset", "formFactor", "form-factor", "emulatedUserAgent", "emulated-user-agent"].includes(name) || name === "screenEmulation" || name.startsWith("screenEmulation.") || name.startsWith("screen-emulation.")) {
      delete copy[name];
    }
  }
  return Object.keys(copy).length > 0 ? copy : undefined;
}

function thresholdFailure(details: LighthouseDetails): boolean {
  if (details.thresholdReport && !details.thresholdReport.passed) return true;
  if (details.thresholdReports && Object.values(details.thresholdReports).some(report => !report.passed)) return true;
  if (details.comparison?.thresholdFailures.length) return true;
  return false;
}

async function executeSingleAction(
  pi: ExtensionAPI,
  params: LighthouseParams,
  ctx: ExtensionContext,
  signal?: AbortSignal,
): Promise<SingleExecution> {
  const prepared = await prepareRun(params, ctx);
  if (params.thresholds && (params.action === "run" || params.action === "audit") && !prepared.outputFormats?.includes("json")) {
    throw new Error("thresholds require output=json so Lighthouse results can be evaluated.");
  }
  const redactedArgs = prepared.args.map(redactSecrets);
  const cliCommand = commandLabel(redactedArgs);
  const result = await pi.exec("lighthouse", prepared.args, {
    cwd: ctx.cwd,
    signal,
    timeout: params.timeoutMs ?? DEFAULT_TIMEOUT,
  });

  const stdout = redactSecrets(result.stdout.trim());
  const stderr = redactSecrets(result.stderr.trim());
  const combined = [stdout, stderr ? `stderr:\n${stderr}` : ""].filter(Boolean).join("\n\n");
  const artifactPaths = extractArtifactPaths(`${stdout}\n${stderr}`);
  if (prepared.reportPath) artifactPaths.unshift(prepared.reportPath);
  if (prepared.artifactPath) artifactPaths.unshift(prepared.artifactPath);
  const uniqueArtifacts = [...new Set(artifactPaths)];

  if (result.code !== 0 || result.killed) {
    const suffix = result.killed ? " (process terminated)" : ` (exit code ${result.code})`;
    throw new Error(`${cliCommand}${suffix}\n\n${truncateText(combined || "(no output)")}`);
  }

  let lhr: LighthouseResult | undefined;
  if (prepared.reportPath && prepared.outputFormats?.includes("json")) {
    try {
      const reportJson = await readFile(prepared.reportPath, "utf8");
      const parsed = parseJsonOutput(reportJson);
      if (isLighthouseResult(parsed)) lhr = parsed;
    } catch {
      // The CLI may have written JSON to stdout or used a multi-output path.
    }
  }
  if (!lhr && prepared.outputFormats?.includes("json")) {
    const parsed = parseJsonOutput(stdout);
    if (isLighthouseResult(parsed)) lhr = parsed;
  }

  const summary = lhr ? summarizeLighthouseResult(lhr) : undefined;
  const thresholdReport = summary ? evaluateThresholds(summary, params.thresholds) : undefined;
  const text = summary
    ? formatSummary(summary, prepared.reportPath, uniqueArtifacts, thresholdReport)
    : truncateText(combined || `${params.action} completed.`);

  const details: LighthouseDetails = {
    action: params.action as Action,
    cliCommand,
    args: redactedArgs,
    code: result.code,
    outputFormat: prepared.outputFormats,
    reportPath: prepared.reportPath,
    artifactPaths: uniqueArtifacts,
    tempDirectory: prepared.tempDirectory,
    summary,
    thresholdReport,
    stdout: truncateText(stdout),
    stderr: truncateText(stderr),
  };

  return {lhr, summary, result: {text, details}};
}

async function executeRepeatedRuns(
  pi: ExtensionAPI,
  params: LighthouseParams,
  ctx: ExtensionContext,
  signal?: AbortSignal,
): Promise<ActionResult> {
  const count = params.repeatRuns ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error("repeatRuns must be an integer from 1 to 10.");
  const runParams = {
    ...params,
    action: "run" as const,
    output: "json" as const,
    outputPath: undefined,
    options: withoutReportOptions(params.options),
  };
  const executions: SingleExecution[] = [];
  for (let index = 0; index < count; index++) {
    executions.push(await executeSingleAction(pi, runParams, ctx, signal));
  }
  const summaries = executions.map(execution => execution.summary).filter((summary): summary is LighthouseSummary => summary !== undefined);
  if (summaries.length !== count) throw new Error("Repeated Lighthouse runs did not produce JSON reports for median calculation.");
  const summary = medianSummary(summaries);
  const thresholdReport = evaluateThresholds(summary, params.thresholds);
  const artifactPaths = [...new Set(executions.flatMap(execution => execution.result.details.artifactPaths))];
  const text = `${formatSummary(summary, undefined, artifactPaths, thresholdReport)}\n\nRuns: ${count} (median values)`;
  const details: LighthouseDetails = {
    action: "run",
    cliCommand: `lighthouse (repeat ${count} runs)`,
    args: [],
    code: 0,
    outputFormat: "json",
    artifactPaths,
    summary,
    repeatedRuns: count,
    thresholdReport,
    runDetails: executions.map(execution => execution.result.details),
    stdout: truncateText(executions.map(execution => execution.result.details.stdout).filter(Boolean).join("\n")),
    stderr: truncateText(executions.map(execution => execution.result.details.stderr).filter(Boolean).join("\n")),
  };
  return {text, details};
}

async function executeDeviceComparison(
  pi: ExtensionAPI,
  params: LighthouseParams,
  ctx: ExtensionContext,
  signal?: AbortSignal,
): Promise<ActionResult> {
  if (!params.url) throw new Error("compare_devices requires a URL.");
  const count = params.repeatRuns ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error("repeatRuns must be an integer from 1 to 10.");
  const baseOptions = withoutDeviceOptions(params.options);
  const deviceResults: Record<string, SingleExecution[]> = {mobile: [], desktop: []};
  for (const [device, preset] of [["mobile", "perf"], ["desktop", "desktop"]] as const) {
    for (let index = 0; index < count; index++) {
      deviceResults[device].push(await executeSingleAction(pi, {
        ...params,
        action: "run",
        output: "json",
        outputPath: undefined,
        options: {...baseOptions, preset},
      }, ctx, signal));
    }
  }
  const mobileSummaries = deviceResults.mobile.map(execution => execution.summary).filter((summary): summary is LighthouseSummary => summary !== undefined);
  const desktopSummaries = deviceResults.desktop.map(execution => execution.summary).filter((summary): summary is LighthouseSummary => summary !== undefined);
  if (mobileSummaries.length !== count || desktopSummaries.length !== count) throw new Error("Device comparison did not produce JSON reports for median calculation.");
  const mobile = medianSummary(mobileSummaries);
  const desktop = medianSummary(desktopSummaries);
  const comparison = buildComparison(mobile, desktop, "mobile", "desktop", undefined, false);
  const thresholdReports = {
    mobile: evaluateThresholds(mobile, params.thresholds),
    desktop: evaluateThresholds(desktop, params.thresholds),
  };
  const artifactPaths = [...new Set(Object.values(deviceResults).flatMap(results => results.flatMap(execution => execution.result.details.artifactPaths)))];
  const text = `${formatComparison(comparison)}\n\nMobile median:\n${formatSummary(mobile, undefined, [], thresholdReports.mobile)}\n\nDesktop median:\n${formatSummary(desktop, undefined, [], thresholdReports.desktop)}`;
  const details: LighthouseDetails = {
    action: "compare_devices",
    cliCommand: `lighthouse (mobile vs desktop, ${count} run${count === 1 ? "" : "s"} each)`,
    args: [],
    code: 0,
    outputFormat: "json",
    artifactPaths,
    repeatedRuns: count,
    thresholdReports: Object.fromEntries(Object.entries(thresholdReports).filter((entry): entry is [string, ThresholdReport] => entry[1] !== undefined)),
    comparison,
    runDetails: Object.values(deviceResults).flatMap(results => results.map(execution => execution.result.details)),
    stdout: "",
    stderr: "",
  };
  return {text, details};
}

async function readLighthouseSummary(path: string, cwd: string): Promise<LighthouseSummary> {
  const resolvedPath = resolveUserPath(path, cwd);
  const parsed = parseJsonOutput(await readFile(resolvedPath, "utf8"));
  if (!isLighthouseResult(parsed)) throw new Error(`Not a Lighthouse JSON report: ${resolvedPath}`);
  return summarizeLighthouseResult(parsed);
}

async function executeReportComparison(
  params: LighthouseParams,
  ctx: ExtensionContext,
): Promise<ActionResult> {
  if (!params.baselinePath || !params.candidatePath) throw new Error("compare_reports requires baselinePath and candidatePath.");
  const baselinePath = resolveUserPath(params.baselinePath, ctx.cwd);
  const candidatePath = resolveUserPath(params.candidatePath, ctx.cwd);
  const [baseline, candidate] = await Promise.all([
    readLighthouseSummary(baselinePath, ctx.cwd),
    readLighthouseSummary(candidatePath, ctx.cwd),
  ]);
  const comparison = buildComparison(baseline, candidate, baselinePath, candidatePath, params.regressionThresholds);
  const thresholdReport = evaluateThresholds(candidate, params.thresholds);
  const text = `${formatComparison(comparison)}${formatThresholdReport(thresholdReport).join("\n")}`;
  const details: LighthouseDetails = {
    action: "compare_reports",
    cliCommand: "lighthouse (compare reports)",
    args: [],
    code: 0,
    artifactPaths: [baselinePath, candidatePath],
    thresholdReport,
    comparison,
    stdout: "",
    stderr: "",
  };
  return {text, details};
}

async function executeAction(
  pi: ExtensionAPI,
  params: LighthouseParams,
  ctx: ExtensionContext,
  signal?: AbortSignal,
): Promise<ActionResult> {
  if (params.repeatRuns !== undefined && (!Number.isInteger(params.repeatRuns) || params.repeatRuns < 1 || params.repeatRuns > 10)) {
    throw new Error("repeatRuns must be an integer from 1 to 10.");
  }
  let result: ActionResult;
  if (params.action === "compare_devices") {
    result = await executeDeviceComparison(pi, params, ctx, signal);
  } else if (params.action === "compare_reports") {
    result = await executeReportComparison(params, ctx);
  } else if (params.action === "run" && (params.repeatRuns ?? 1) > 1) {
    result = await executeRepeatedRuns(pi, params, ctx, signal);
  } else {
    result = (await executeSingleAction(pi, params, ctx, signal)).result;
  }

  if (params.failOnThreshold && thresholdFailure(result.details)) {
    throw new Error(`${result.text}\n\nThreshold enforcement failed.`);
  }
  return result;
}

function displayActionResult(ctx: ExtensionContext, result: ActionResult): void {
  const firstLine = result.text.split("\n").find(line => line.trim().length > 0) ?? "Lighthouse completed.";
  const hasThresholdFailure = thresholdFailure(result.details);
  const headline = hasThresholdFailure && !firstLine.includes("FAIL") ? "Lighthouse thresholds: FAIL" : firstLine;
  const artifactNote = result.details.artifactPaths.length > 0
    ? `\nartifacts: ${result.details.artifactPaths.join(", ")}`
    : "";
  ctx.ui.notify(`${headline.slice(0, 300)}${artifactNote}`.slice(0, 1_000), hasThresholdFailure ? "error" : "info");
}

export default function lighthouseCliExtension(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "lighthouse_cli",
    label: "Lighthouse CLI",
    description:
      "Run the official standalone Lighthouse CLI locally. Use it for full audits, repeated median runs, mobile/desktop comparisons, thresholds, regression reports, custom configuration, plugins, and gather/audit workflows.",
    promptSnippet: "Run full Lighthouse CLI audits and inspect compact report summaries",
    promptGuidelines: [
      "Use lighthouse_cli instead of invoking the lighthouse executable through bash.",
      "Use action=run with a URL for a normal Lighthouse navigation audit.",
      "Use action=gather to save reusable trace, DevTools log, and artifact data; use action=audit to process that data later. Use action=version or the list_* actions for CLI metadata.",
      "Use repeatRuns for sequential runs summarized with median scores and metrics.",
      "Use action=compare_devices for mobile versus desktop medians.",
      "Use thresholds for category minimums and metric maximums; use regressionThresholds with compare_reports for allowed degradation.",
      "Use action=compare_reports with baselinePath and candidatePath to compare saved JSON reports.",
      "Use output=json for machine-readable results. The extension saves run/audit reports to a temporary path by default and returns the path.",
      "Use onlyCategories or onlyAudits for focused audits, and preset=desktop for desktop scoring.",
      "Use throttlingMethod and throttling.* flags explicitly when comparing lab conditions; Lighthouse defaults to simulated mobile throttling.",
      "Use options.extraHeaders for authentication only when necessary; never expose cookies, authorization headers, or report contents in the conversation.",
      "The standalone CLI launches or connects to its own Chrome. It does not reuse a chrome_devtools daemon session unless a debugging port is supplied.",
      "Run repeated audits for performance comparisons because Lighthouse results have natural variability.",
    ],
    parameters: lighthouseParameters,
    executionMode: "sequential",
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const result = await executeAction(pi, params, ctx, signal);
      return {
        content: [{type: "text", text: result.text}],
        details: result.details,
      };
    },
    renderCall(args, theme) {
      return new Text(theme.fg("toolTitle", `lighthouse ${args.action}`), 0, 0);
    },
    renderResult(result, options, theme, context) {
      if (options.isPartial) return new Text(theme.fg("warning", "Running Lighthouse…"), 0, 0);
      const details = result.details as LighthouseDetails | undefined;
      if (context.isError) return new Text(theme.fg("error", "✗ Lighthouse failed"), 0, 0);
      if (!details) return new Text(theme.fg("muted", "Lighthouse finished"), 0, 0);
      const lines = [`✓ ${details.action}`];
      if (details.summary?.scores.length) {
        lines.push(details.summary.scores.map(category => `${category.title}: ${category.score}`).join(" · "));
      }
      if (details.comparison) lines.push(`regressions: ${details.comparison.regressions.length}`);
      if (details.thresholdReport) lines.push(`thresholds: ${details.thresholdReport.passed ? "PASS" : "FAIL"}`);
      if (details.thresholdReports) {
        const passed = Object.values(details.thresholdReports).every(report => report.passed);
        lines.push(`thresholds: ${passed ? "PASS" : "FAIL"}`);
      }
      if (details.reportPath) lines.push(`report: ${details.reportPath}`);
      if (details.artifactPaths.length > 0) lines.push(`artifacts: ${details.artifactPaths.length}`);
      return new Text(theme.fg("success", lines.join("\n")), 0, 0);
    },
  });

  pi.registerCommand("lighthouse", {
    description: "Run the standalone Lighthouse CLI; use the lighthouse_cli tool for the typed interface.",
    getArgumentCompletions(prefix) {
      const filtered = [...ACTIONS].filter(action => action.startsWith(prefix));
      return filtered.length > 0 ? filtered.map(value => ({value, label: value})) : null;
    },
    async handler(args, ctx) {
      if (!args.trim()) {
        ctx.ui.notify(helpText(), "info");
        return;
      }
      try {
        const params = parseSlashCommand(args);
        if (!params) return;
        const result = await executeAction(pi, params, ctx);
        displayActionResult(ctx, result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(message.slice(0, 1_000), "error");
      }
    },
  });

  pi.on("before_agent_start", event => {
    if (!/\b(lighthouse|performance audit|web vitals|core web vitals|page speed)\b/i.test(event.prompt)) return;
    return {
      systemPrompt: `${event.systemPrompt}\n\nLighthouse CLI integration: use the lighthouse_cli tool rather than shelling out to lighthouse. Use action=run for navigation audits, repeatRuns for median results, action=compare_devices for mobile/desktop comparisons, thresholds for quality gates, and action=compare_reports for saved-report regressions. Use output=json for machine-readable results, preset=desktop for desktop runs, and action=gather/action=audit for reusable artifacts. Summarize scores, metrics, failures, opportunities, threshold results, regressions, and report paths without pasting large reports.`,
    };
  });
}
