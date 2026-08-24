import { access, readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";

const ACTIONS = [
  "version",
  "open",
  "attach",
  "close",
  "detach",
  "goto",
  "back",
  "forward",
  "reload",
  "snapshot",
  "find",
  "click",
  "dblclick",
  "fill",
  "type",
  "drag",
  "drop",
  "hover",
  "select",
  "upload",
  "check",
  "uncheck",
  "dialog_accept",
  "dialog_dismiss",
  "resize",
  "press",
  "keydown",
  "keyup",
  "mousemove",
  "mousedown",
  "mouseup",
  "mousewheel",
  "screenshot",
  "pdf",
  "tab_list",
  "tab_new",
  "tab_select",
  "tab_close",
  "state_save",
  "state_load",
  "delete_data",
  "cookie_list",
  "cookie_get",
  "cookie_set",
  "cookie_delete",
  "cookie_clear",
  "localstorage_list",
  "localstorage_get",
  "localstorage_set",
  "localstorage_delete",
  "localstorage_clear",
  "sessionstorage_list",
  "sessionstorage_get",
  "sessionstorage_set",
  "sessionstorage_delete",
  "sessionstorage_clear",
  "network",
  "request",
  "request_headers",
  "request_body",
  "response_headers",
  "response_body",
  "route",
  "route_list",
  "unroute",
  "network_state_set",
  "console",
  "eval",
  "run_code",
  "tracing_start",
  "tracing_stop",
  "video_start",
  "video_stop",
  "video_chapter",
  "show",
  "pause_at",
  "resume",
  "step_over",
  "generate_locator",
  "highlight",
  "install_skills",
  "install_browser",
  "list",
  "close_all",
  "kill_all",
  "config_print",
] as const;

type Action = (typeof ACTIONS)[number];

const playwrightParameters = Type.Object({
  action: StringEnum(ACTIONS),
  session: Type.Optional(Type.String({ description: "Named Playwright session. Defaults to the current Pi session." })),
  url: Type.Optional(Type.String({ description: "URL for open, goto, or tab_new." })),
  target: Type.Optional(Type.String({ description: "Snapshot ref, CSS selector, or Playwright locator." })),
  text: Type.Optional(Type.String({ description: "Text for typing, filling, dialog prompts, or searches." })),
  value: Type.Optional(Type.String({ description: "Dropdown, cookie, storage, or route value." })),
  files: Type.Optional(Type.Array(Type.String(), { description: "Files for upload." })),
  start: Type.Optional(Type.String({ description: "Drag start target." })),
  end: Type.Optional(Type.String({ description: "Drag end target." })),
  button: Type.Optional(Type.String({ description: "Mouse button: left, right, or middle." })),
  key: Type.Optional(Type.String({ description: "Keyboard key, such as Enter or ArrowLeft." })),
  prompt: Type.Optional(Type.String({ description: "Text to provide to a browser prompt dialog." })),
  width: Type.Optional(Type.Integer({ minimum: 1 })),
  height: Type.Optional(Type.Integer({ minimum: 1 })),
  x: Type.Optional(Type.Number()),
  y: Type.Optional(Type.Number()),
  dx: Type.Optional(Type.Number()),
  dy: Type.Optional(Type.Number()),
  index: Type.Optional(Type.Integer({ minimum: 0 })),
  filename: Type.Optional(Type.String()),
  depth: Type.Optional(Type.Integer({ minimum: 1 })),
  fullPage: Type.Optional(Type.Boolean()),
  submit: Type.Optional(Type.Boolean()),
  headed: Type.Optional(Type.Boolean()),
  browser: Type.Optional(Type.String()),
  persistent: Type.Optional(Type.Boolean()),
  profile: Type.Optional(Type.String()),
  attachExtension: Type.Optional(Type.Boolean()),
  cdp: Type.Optional(Type.String()),
  endpoint: Type.Optional(Type.String()),
  config: Type.Optional(Type.String()),
  filter: Type.Optional(Type.String()),
  includeStatic: Type.Optional(Type.Boolean()),
  includeRequestBody: Type.Optional(Type.Boolean()),
  includeRequestHeaders: Type.Optional(Type.Boolean()),
  status: Type.Optional(Type.Integer()),
  contentType: Type.Optional(Type.String()),
  headers: Type.Optional(Type.Array(Type.String())),
  removeHeader: Type.Optional(Type.String()),
  state: Type.Optional(StringEnum(["online", "offline"] as const)),
  minLevel: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
  codeFilename: Type.Optional(Type.String()),
  title: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  duration: Type.Optional(Type.Integer({ minimum: 0 })),
  size: Type.Optional(Type.String()),
  location: Type.Optional(Type.String()),
  hide: Type.Optional(Type.Boolean()),
  withDeps: Type.Optional(Type.Boolean()),
  dryRun: Type.Optional(Type.Boolean()),
  browserList: Type.Optional(Type.Boolean()),
  force: Type.Optional(Type.Boolean()),
  onlyShell: Type.Optional(Type.Boolean()),
  noShell: Type.Optional(Type.Boolean()),
  raw: Type.Optional(Type.Boolean()),
  json: Type.Optional(Type.Boolean()),
  timeout: Type.Optional(Type.Integer({ minimum: 1 })),
});

type PlaywrightParams = Static<typeof playwrightParameters>;

type PlaywrightDetails = {
  action: Action;
  session?: string;
  command: string;
  args: string[];
  code: number;
  page?: { url?: string; title?: string };
  snapshotPath?: string;
  artifacts: string[];
  stdout: string;
  stderr: string;
};

type ActionResult = {
  text: string;
  details: PlaywrightDetails;
};

type RuntimeState = {
  defaultSession: string;
};

const MAX_OUTPUT_BYTES = 45_000;
const MAX_OUTPUT_LINES = 1_800;
const DEFAULT_TIMEOUT = 120_000;

function required(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Playwright action requires ${name}.`);
  }
  return value;
}

function numberString(value: number | undefined, name: string): string {
  if (value === undefined || !Number.isFinite(value)) {
    throw new Error(`Playwright action requires ${name}.`);
  }
  return String(value);
}

function appendOption(args: string[], name: string, value: string | undefined): void {
  if (value !== undefined && value.length > 0) args.push(`--${name}=${value}`);
}

function appendBoolean(args: string[], value: boolean | undefined, name: string): void {
  if (value) args.push(`--${name}`);
}

function isGlobalAction(action: Action): boolean {
  return new Set<Action>([
    "version",
    "install_skills",
    "install_browser",
    "list",
    "close_all",
    "kill_all",
    "config_print",
    "show",
  ]).has(action);
}

function buildCliArgs(params: PlaywrightParams, sessionName: string): string[] {
  const action = params.action as Action;
  const args: string[] = [];

  if (params.raw) args.push("--raw");
  if (params.json) args.push("--json");
  if (params.config) args.push(`--config=${params.config}`);
  if (!isGlobalAction(action)) args.push(`-s=${sessionName}`);

  switch (action) {
    case "version":
      args.push("--version");
      break;
    case "open":
      args.push("open");
      if (params.url) args.push(params.url);
      appendBoolean(args, params.headed, "headed");
      appendOption(args, "browser", params.browser);
      appendBoolean(args, params.persistent, "persistent");
      appendOption(args, "profile", params.profile);
      break;
    case "attach":
      args.push("attach");
      if (params.target) args.push(params.target);
      appendBoolean(args, params.attachExtension, "extension");
      appendOption(args, "cdp", params.cdp);
      appendOption(args, "endpoint", params.endpoint);
      break;
    case "close":
      args.push("close");
      break;
    case "detach":
      args.push("detach");
      break;
    case "back":
      args.push("go-back");
      break;
    case "forward":
      args.push("go-forward");
      break;
    case "reload":
      args.push("reload");
      break;
    case "tab_list":
      args.push("tab-list");
      break;
    case "cookie_clear":
      args.push("cookie-clear");
      break;
    case "localstorage_list":
    case "localstorage_clear":
    case "sessionstorage_list":
    case "sessionstorage_clear":
    case "route_list":
    case "tracing_start":
    case "tracing_stop":
    case "video_stop":
    case "resume":
    case "step_over":
      args.push(action.replaceAll("_", "-"));
      break;
    case "show":
      args.push("show");
      break;
    case "list":
      args.push("list");
      break;
    case "close_all":
      args.push("close-all");
      break;
    case "kill_all":
      args.push("kill-all");
      break;
    case "config_print":
      args.push("config-print");
      break;
    case "goto":
      args.push("goto", required(params.url, "url"));
      break;
    case "snapshot":
      args.push("snapshot");
      if (params.target) args.push(params.target);
      appendOption(args, "filename", params.filename);
      if (params.depth !== undefined) appendOption(args, "depth", String(params.depth));
      break;
    case "find":
      args.push("find");
      if (params.text) args.push(params.text);
      break;
    case "click":
    case "dblclick":
      args.push(action, required(params.target, "target"));
      if (params.button) args.push(params.button);
      break;
    case "fill":
      args.push("fill", required(params.target, "target"), required(params.text, "text"));
      appendBoolean(args, params.submit, "submit");
      break;
    case "type":
      args.push("type", required(params.text, "text"));
      break;
    case "drag":
      args.push("drag", required(params.start, "start"), required(params.end, "end"));
      break;
    case "drop":
    case "hover":
    case "check":
    case "uncheck":
      args.push(action, required(params.target, "target"));
      break;
    case "select":
      args.push("select", required(params.target, "target"), required(params.value, "value"));
      break;
    case "upload":
      if (!params.files || params.files.length === 0) throw new Error("Playwright upload requires files.");
      args.push("upload", ...params.files);
      break;
    case "dialog_accept":
      args.push("dialog-accept");
      if (params.prompt !== undefined) args.push(params.prompt);
      break;
    case "dialog_dismiss":
      args.push("dialog-dismiss");
      break;
    case "resize":
      args.push("resize", numberString(params.width, "width"), numberString(params.height, "height"));
      break;
    case "press":
    case "keydown":
    case "keyup":
      args.push(action, required(params.key, "key"));
      break;
    case "mousemove":
    case "mousedown":
    case "mouseup":
      args.push(action, numberString(params.x, "x"), numberString(params.y, "y"));
      if (params.button && action !== "mousemove") args.push(params.button);
      break;
    case "mousewheel":
      args.push("mousewheel", numberString(params.dx, "dx"), numberString(params.dy, "dy"));
      break;
    case "screenshot":
      args.push("screenshot");
      if (params.target) args.push(params.target);
      appendOption(args, "filename", params.filename);
      appendBoolean(args, params.fullPage, "full-page");
      break;
    case "pdf":
      args.push("pdf");
      appendOption(args, "filename", params.filename);
      break;
    case "tab_new":
      args.push("tab-new");
      if (params.url) args.push(params.url);
      break;
    case "tab_select":
    case "tab_close":
      args.push(action.replaceAll("_", "-"), numberString(params.index, "index"));
      break;
    case "state_save":
      args.push("state-save");
      if (params.filename) args.push(params.filename);
      break;
    case "state_load":
      args.push("state-load", required(params.filename, "filename"));
      break;
    case "delete_data":
      args.push("delete-data");
      break;
    case "cookie_list":
      args.push("cookie-list");
      if (params.target) appendOption(args, "domain", params.target);
      break;
    case "cookie_get":
      args.push("cookie-get", required(params.target, "target"));
      break;
    case "cookie_set":
      args.push("cookie-set", required(params.target, "target"), required(params.value, "value"));
      break;
    case "cookie_delete":
      args.push("cookie-delete", required(params.target, "target"));
      break;
    case "localstorage_get":
    case "localstorage_delete":
    case "sessionstorage_get":
    case "sessionstorage_delete":
      args.push(action.replaceAll("_", "-"), required(params.target, "target"));
      break;
    case "localstorage_set":
    case "sessionstorage_set":
      args.push(action.replaceAll("_", "-"), required(params.target, "target"), required(params.value, "value"));
      break;
    case "network":
      args.push("requests");
      appendOption(args, "filter", params.filter);
      appendBoolean(args, params.includeStatic, "static");
      appendBoolean(args, params.includeRequestBody, "request-body");
      appendBoolean(args, params.includeRequestHeaders, "request-headers");
      break;
    case "request":
      args.push("request", numberString(params.index, "index"));
      break;
    case "request_headers":
    case "request_body":
    case "response_headers":
    case "response_body":
      args.push(action.replaceAll("_", "-"), numberString(params.index, "index"));
      break;
    case "route":
      args.push("route", required(params.target, "pattern"));
      appendOption(args, "status", params.status === undefined ? undefined : String(params.status));
      appendOption(args, "body", params.value);
      appendOption(args, "content-type", params.contentType);
      for (const header of params.headers ?? []) appendOption(args, "header", header);
      appendOption(args, "remove-header", params.removeHeader);
      break;
    case "unroute":
      args.push("unroute");
      if (params.target) args.push(params.target);
      break;
    case "network_state_set":
      args.push("network-state-set", required(params.state, "state"));
      break;
    case "console":
      args.push("console");
      if (params.minLevel) args.push(params.minLevel);
      break;
    case "eval":
      args.push("eval", required(params.code ?? params.text, "code"));
      if (params.target) args.push(params.target);
      break;
    case "run_code":
      args.push("run-code");
      if (params.codeFilename) appendOption(args, "filename", params.codeFilename);
      else args.push(required(params.code ?? params.text, "code"));
      break;
    case "video_start":
      args.push("video-start");
      if (params.filename) args.push(params.filename);
      appendOption(args, "size", params.size);
      break;
    case "video_chapter":
      args.push("video-chapter", required(params.title ?? params.text, "title"));
      appendOption(args, "description", params.description);
      if (params.duration !== undefined) appendOption(args, "duration", String(params.duration));
      break;
    case "pause_at":
      args.push("pause-at", required(params.location, "location"));
      break;
    case "generate_locator":
      args.push("generate-locator", required(params.target, "target"));
      break;
    case "highlight":
      args.push("highlight");
      if (params.target) args.push(params.target);
      appendBoolean(args, params.hide, "hide");
      break;
    case "install_skills":
      args.push("install", "--skills");
      break;
    case "install_browser":
      args.push("install-browser");
      if (params.browser) args.push(params.browser);
      appendBoolean(args, params.withDeps, "with-deps");
      appendBoolean(args, params.dryRun, "dry-run");
      appendBoolean(args, params.browserList, "list");
      appendBoolean(args, params.force, "force");
      appendBoolean(args, params.onlyShell, "only-shell");
      appendBoolean(args, params.noShell, "no-shell");
      break;
  }

  return args;
}

function truncateText(input: string): string {
  const lines = input.split("\n");
  const lineLimited = lines.length > MAX_OUTPUT_LINES
    ? `${lines.slice(0, MAX_OUTPUT_LINES).join("\n")}\n[… output truncated at ${MAX_OUTPUT_LINES} lines …]`
    : input;

  if (Buffer.byteLength(lineLimited, "utf8") <= MAX_OUTPUT_BYTES) return lineLimited;
  const bytes = Buffer.from(lineLimited, "utf8");
  return `${bytes.subarray(0, MAX_OUTPUT_BYTES).toString("utf8")}\n[… output truncated at ${MAX_OUTPUT_BYTES} bytes …]`;
}

function redactSecrets(input: string): string {
  return input
    .replace(/(authorization\s*:\s*bearer\s+)[^\s,]+/gi, "$1[REDACTED]")
    .replace(/(set-cookie\s*:\s*)[^\n]+/gi, "$1[REDACTED]")
    .replace(/(cookie\s*:\s*)[^\n]+/gi, "$1[REDACTED]")
    .replace(/(password\s*[=:]\s*)[^\s,&}]+/gi, "$1[REDACTED]");
}

function cleanPath(value: string): string {
  return value.replace(/[),.;]+$/g, "");
}

function extractArtifactPaths(output: string): string[] {
  const matches = output.match(/(?:\.playwright-cli|\.playwright)\/[^\s)'"`]+/g) ?? [];
  return [...new Set(matches.map(cleanPath))];
}

function extractSnapshotPath(output: string, artifacts: string[]): string | undefined {
  const explicit = output.match(/\[Snapshot\]\(([^)]+\.ya?ml)\)/i)?.[1];
  if (explicit) return cleanPath(explicit);
  return artifacts.find((path) => /\.ya?ml$/i.test(path));
}

function parsePageState(output: string): { url?: string; title?: string } {
  const url = output.match(/Page URL:\s*([^\n\r]+)/i)?.[1]?.trim();
  const title = output.match(/Page Title:\s*([^\n\r]+)/i)?.[1]?.trim();
  return {
    url: url && url !== "undefined" ? url : undefined,
    title: title && title !== "undefined" ? title : undefined,
  };
}

function resolveArtifactPath(cwd: string, path: string): string {
  return isAbsolute(path) ? path : resolve(cwd, path);
}

async function readSnapshot(cwd: string, snapshotPath: string | undefined): Promise<string | undefined> {
  if (!snapshotPath) return undefined;
  try {
    return truncateText(await readFile(resolveArtifactPath(cwd, snapshotPath), "utf8"));
  } catch {
    return undefined;
  }
}

function shortSessionName(name: string): string {
  return name.length > 28 ? `${name.slice(0, 25)}…` : name;
}

function piSessionName(sessionId: string): string {
  const safeId = sessionId.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 48);
  return `pi-${safeId || "session"}`;
}

function commandLabel(args: string[]): string {
  return `playwright-cli ${args.map((arg) => /\s/.test(arg) ? JSON.stringify(arg) : arg).join(" ")}`;
}

async function executeAction(
  pi: ExtensionAPI,
  params: PlaywrightParams,
  ctx: ExtensionContext,
  state: RuntimeState,
  signal?: AbortSignal,
): Promise<ActionResult> {
  const sessionName = params.session?.trim() || state.defaultSession;
  const args = buildCliArgs(params, sessionName);
  const command = commandLabel(args);
  const result = await pi.exec("playwright-cli", args, {
    cwd: ctx.cwd,
    signal,
    timeout: params.timeout ?? DEFAULT_TIMEOUT,
  });

  const rawStdout = redactSecrets(result.stdout.trim());
  const rawStderr = redactSecrets(result.stderr.trim());
  const combined = [rawStdout, rawStderr ? `stderr:\n${rawStderr}` : ""].filter(Boolean).join("\n\n");
  const output = truncateText(combined || "(no output)");

  if (result.code !== 0 || result.killed) {
    const suffix = result.killed ? " (process terminated)" : ` (exit code ${result.code})`;
    throw new Error(`${command}${suffix}\n\n${output}`);
  }

  const page = parsePageState(rawStdout);
  const artifacts = extractArtifactPaths(`${rawStdout}\n${rawStderr}`);
  const snapshotPath = extractSnapshotPath(rawStdout, artifacts);
  const snapshot = await readSnapshot(ctx.cwd, snapshotPath);

  const sections = [output];
  if (snapshot) sections.push(`### Accessibility snapshot\n${snapshot}`);
  if (artifacts.length > 0) sections.push(`### Artifacts\n${artifacts.join("\n")}`);
  const text = truncateText(sections.join("\n\n"));

  return {
    text,
    details: {
      action: params.action as Action,
      session: sessionName,
      command,
      args,
      code: result.code,
      page,
      snapshotPath,
      artifacts,
      stdout: truncateText(rawStdout),
      stderr: truncateText(rawStderr),
    },
  };
}

function displayActionResult(ctx: ExtensionContext, result: ActionResult): void {
  const firstLine = result.text.split("\n").find((line) => line.trim().length > 0) ?? "Playwright completed.";
  const artifactNote = result.details.artifacts.length > 0
    ? ` · ${result.details.artifacts.length} artifact${result.details.artifacts.length === 1 ? "" : "s"}`
    : "";
  ctx.ui.notify(`${firstLine.slice(0, 300)}${artifactNote}`, "info");
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const pattern = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|(\S+)/g;
  for (const match of input.matchAll(pattern)) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return tokens;
}

function parseCommandOptions(tokens: string[]): { values: string[]; params: Partial<PlaywrightParams> } {
  const values: string[] = [];
  const params: Partial<PlaywrightParams> = {};
  for (const token of tokens) {
    if (token === "--headed") params.headed = true;
    else if (token === "--persistent") params.persistent = true;
    else if (token === "--full-page") params.fullPage = true;
    else if (token.startsWith("--browser=")) params.browser = token.slice("--browser=".length);
    else if (token.startsWith("--profile=")) params.profile = token.slice("--profile=".length);
    else if (token.startsWith("--filename=")) params.filename = token.slice("--filename=".length);
    else values.push(token);
  }
  return { values, params };
}

function helpText(): string {
  return [
    "/playwright open <url> [--headed] [--browser=firefox]",
    "/playwright goto <url>",
    "/playwright snapshot | screenshot [filename] | sessions | show | close",
    "/playwright install-skills | install-browser [browser]",
    "The LLM can call the playwright tool for the complete command set.",
  ].join("\n");
}

function commandToParams(input: string): PlaywrightParams | undefined {
  const tokens = tokenize(input.trim());
  if (tokens.length === 0) return undefined;
  const subcommand = tokens.shift()!.toLowerCase();
  const parsed = parseCommandOptions(tokens);
  const values = parsed.values;
  const optionParams = parsed.params;

  if (/^https?:\/\//i.test(subcommand)) {
    return { action: "open", url: subcommand, ...optionParams } as PlaywrightParams;
  }

  switch (subcommand) {
    case "setup":
    case "version":
      return { action: "version", ...optionParams } as PlaywrightParams;
    case "open":
      return { action: "open", url: values[0], ...optionParams } as PlaywrightParams;
    case "goto":
      return { action: "goto", url: values[0], ...optionParams } as PlaywrightParams;
    case "back":
    case "go-back":
      return { action: "back", ...optionParams } as PlaywrightParams;
    case "forward":
    case "go-forward":
      return { action: "forward", ...optionParams } as PlaywrightParams;
    case "reload":
      return { action: "reload", ...optionParams } as PlaywrightParams;
    case "snapshot":
      return { action: "snapshot", ...optionParams } as PlaywrightParams;
    case "screenshot":
      return { action: "screenshot", filename: values[0] ?? optionParams.filename, ...optionParams } as PlaywrightParams;
    case "pdf":
      return { action: "pdf", filename: values[0] ?? optionParams.filename, ...optionParams } as PlaywrightParams;
    case "sessions":
    case "list":
      return { action: "list", ...optionParams } as PlaywrightParams;
    case "show":
      return { action: "show", ...optionParams } as PlaywrightParams;
    case "close":
      return { action: "close", ...optionParams } as PlaywrightParams;
    case "close-all":
      return { action: "close_all", ...optionParams } as PlaywrightParams;
    case "kill-all":
      return { action: "kill_all", ...optionParams } as PlaywrightParams;
    case "install-skills":
      return { action: "install_skills", ...optionParams } as PlaywrightParams;
    case "install-browser":
      return { action: "install_browser", browser: values[0], ...optionParams } as PlaywrightParams;
    default:
      throw new Error(`Unknown /playwright command: ${subcommand}\n\n${helpText()}`);
  }
}

export default function playwrightCliExtension(pi: ExtensionAPI): void {
  const configuredSession = process.env.PLAYWRIGHT_CLI_SESSION?.trim();
  const state: RuntimeState = {
    defaultSession: configuredSession || "pw-pending-session",
  };

  pi.registerTool({
    name: "playwright",
    label: "Playwright",
    description: "Operate a browser through the official playwright-cli. Use snapshots and their element refs for deterministic interaction, then re-snapshot after page changes.",
    promptSnippet: "Automate and inspect a browser with Playwright CLI",
    promptGuidelines: [
      "Use playwright for browser automation instead of invoking playwright-cli through bash.",
      "Use playwright snapshot before interacting and prefer its refs over guessed selectors.",
      "After navigation or an action that changes the page, use the returned snapshot or take a fresh snapshot because refs become stale.",
      "Use screenshots and coordinate mouse actions for canvas, maps, charts, WebGL, and widgets missing from the accessibility tree.",
      "Treat outputs containing cookies, headers, storage, authentication state, or arbitrary code as sensitive.",
    ],
    parameters: playwrightParameters,
    executionMode: "sequential",
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const result = await executeAction(pi, params, ctx, state, signal);
      return {
        content: [{ type: "text", text: result.text }],
        details: result.details,
      };
    },
    renderCall(args, theme) {
      const target = args.target ? ` ${args.target}` : "";
      return new Text(theme.fg("toolTitle", `playwright ${args.action}`) + theme.fg("muted", target), 0, 0);
    },
    renderResult(result, options, theme, context) {
      if (options.isPartial) return new Text(theme.fg("warning", "Running Playwright…"), 0, 0);
      const details = result.details as PlaywrightDetails | undefined;
      if (context.isError) return new Text(theme.fg("error", "✗ Playwright failed"), 0, 0);
      if (!details) return new Text(theme.fg("muted", "Playwright finished"), 0, 0);
      const color = context.isError ? "error" : "success";
      const icon = context.isError ? "✗" : "✓";
      const lines = [`${icon} ${details.action} · ${shortSessionName(details.session ?? "default")}`];
      if (details.page?.url) lines.push(details.page.url);
      if (details.snapshotPath) lines.push(`snapshot: ${details.snapshotPath}`);
      if (details.artifacts.length > 0) lines.push(`artifacts: ${details.artifacts.join(", ")}`);
      if (options.expanded && details.stderr) lines.push(`stderr: ${details.stderr}`);
      return new Text(theme.fg(color, lines.join("\n")), 0, 0);
    },
  });

  pi.registerCommand("playwright", {
    description: "Run common Playwright browser actions, or use the LLM-callable playwright tool for the full command set.",
    getArgumentCompletions(prefix) {
      const commands = ["setup", "open", "goto", "back", "forward", "reload", "snapshot", "screenshot", "pdf", "sessions", "show", "close", "close-all", "kill-all", "install-skills", "install-browser"];
      const filtered = commands.filter((command) => command.startsWith(prefix));
      return filtered.length > 0 ? filtered.map((value) => ({ value, label: value })) : null;
    },
    async handler(args, ctx) {
      if (!args.trim()) {
        ctx.ui.notify(helpText(), "info");
        return;
      }
      const params = commandToParams(args);
      if (!params) return;
      try {
        const result = await executeAction(pi, params, ctx, state, undefined);
        displayActionResult(ctx, result);
        if (params.action === "install_skills") {
          await ctx.reload();
          return;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(message.slice(0, 1_000), "error");
      }
    },
  });

  pi.on("resources_discover", async (_event, ctx) => {
    const executableResult = await pi.exec("which", ["playwright-cli"], {
      cwd: ctx.cwd,
      timeout: 5_000,
    });
    if (executableResult.code !== 0) return;

    try {
      const executable = await realpath(executableResult.stdout.trim());
      const skillPath = resolve(dirname(executable), "skills");
      await access(resolve(skillPath, "playwright-cli", "SKILL.md"));
      return { skillPaths: [skillPath] };
    } catch {
      return;
    }
  });

  pi.on("session_start", (_event, ctx) => {
    if (!configuredSession) state.defaultSession = piSessionName(ctx.sessionManager.getSessionId());
  });

  pi.on("before_agent_start", (event) => {
    if (!/\b(playwright|browser automation|web page|website|screenshot|end-to-end test)\b/i.test(event.prompt)) return;
    return {
      systemPrompt: `${event.systemPrompt}\n\nPlaywright integration: use the playwright tool for browser work. Start with a snapshot, use its refs, and refresh the snapshot whenever navigation or a page-changing action invalidates refs. Keep sensitive cookies, storage, headers, and authentication state out of ordinary summaries.`,
    };
  });
}
