import { access, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";

const COMMANDS = [
  "click",
  "drag",
  "fill",
  "handle_dialog",
  "hover",
  "press_key",
  "type_text",
  "upload_file",
  "click_at",
  "close_page",
  "list_pages",
  "navigate_page",
  "new_page",
  "select_page",
  "emulate",
  "resize_page",
  "performance_analyze_insight",
  "performance_start_trace",
  "performance_stop_trace",
  "get_network_request",
  "list_network_requests",
  "evaluate_script",
  "get_console_message",
  "lighthouse_audit",
  "list_console_messages",
  "take_screenshot",
  "take_snapshot",
  "screencast_start",
  "screencast_stop",
  "take_heapsnapshot",
  "close_heapsnapshot",
  "compare_heapsnapshots",
  "get_heapsnapshot_class_nodes",
  "get_heapsnapshot_details",
  "get_heapsnapshot_dominators",
  "get_heapsnapshot_duplicate_strings",
  "get_heapsnapshot_edges",
  "get_heapsnapshot_object_details",
  "get_heapsnapshot_retainers",
  "get_heapsnapshot_retaining_paths",
  "get_heapsnapshot_summary",
  "query_heapsnapshot_objects",
  "install_extension",
  "list_extensions",
  "reload_extension",
  "trigger_extension_action",
  "uninstall_extension",
  "execute_3p_developer_tool",
  "list_3p_developer_tools",
  "execute_webmcp_tool",
  "list_webmcp_tools",
  "get_os_app_state",
  "install_pwa",
  "launch_pwa",
  "uninstall_pwa",
  "start",
  "status",
  "stop",
  "version",
] as const;

type Command = (typeof COMMANDS)[number];

type OptionValue = string | number | boolean | string[];

const optionValue = Type.Union([
  Type.String(),
  Type.Number(),
  Type.Boolean(),
  Type.Array(Type.String()),
]);

const chromeDevtoolsParameters = Type.Object({
  command: StringEnum(COMMANDS, {
    description: "Chrome DevTools CLI command or daemon lifecycle command.",
  }),
  args: Type.Optional(
    Type.Array(Type.String(), {
      description: "Required positional arguments for the selected CLI command, in order.",
    }),
  ),
  options: Type.Optional(
    Type.Record(Type.String(), optionValue, {
      description:
        "Optional CLI flags as camelCase keys. Arrays repeat the flag, booleans use true/false, and values are passed as --key=value.",
    }),
  ),
  outputFormat: Type.Optional(
    StringEnum(["md", "json"] as const, {
      description: "CLI result format. Defaults to Markdown-like human-readable output.",
    }),
  ),
  session: Type.Optional(
    Type.String({
      description:
        "Optional daemon session ID. Hexadecimal and hyphen characters are accepted; other labels are deterministically hashed.",
    }),
  ),
  timeoutMs: Type.Optional(
    Type.Integer({
      minimum: 1,
      description: "Pi process timeout in milliseconds. This is separate from a command's own timeout flag.",
    }),
  ),
});

type ChromeDevtoolsParams = Static<typeof chromeDevtoolsParameters>;

type ChromeDevtoolsDetails = {
  command: Command;
  sessionId?: string;
  cliCommand: string;
  args: string[];
  code: number;
  artifacts: string[];
  stdout: string;
  stderr: string;
};

type ActionResult = {
  text: string;
  details: ChromeDevtoolsDetails;
};

type RuntimeState = {
  defaultSession: string;
};

const MAX_OUTPUT_BYTES = 45_000;
const MAX_OUTPUT_LINES = 1_800;
const DEFAULT_TIMEOUT = 120_000;
const SESSION_ID_PATTERN = /^[a-fA-F0-9-]+$/;
const ARTIFACT_EXTENSIONS =
  "png|jpeg|jpg|webp|html|json|csv|txt|gz|mp4|heapsnapshot|network-request|network-response";

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

function normalizeSessionId(value: string): string {
  const trimmed = value.trim();
  if (SESSION_ID_PATTERN.test(trimmed)) return trimmed;
  return createHash("sha256").update(trimmed).digest("hex").slice(0, 32);
}

function piSessionId(sessionId: string): string {
  return createHash("sha256").update(`pi:${sessionId}`).digest("hex").slice(0, 32);
}

function requiredArgs(args: string[] | undefined): string[] {
  return args ?? [];
}

function appendOption(args: string[], name: string, value: OptionValue): void {
  if (Array.isArray(value)) {
    for (const item of value) args.push(`--${name}=${item}`);
    return;
  }
  args.push(`--${name}=${String(value)}`);
}

function buildCliArgs(params: ChromeDevtoolsParams, sessionId: string): string[] {
  const command = params.command as Command;
  const args: string[] = [];

  if (command !== "version") args.push(`--sessionId=${sessionId}`);
  if (command === "version") {
    args.push("--version");
    return args;
  }

  args.push(command);
  args.push(...requiredArgs(params.args));

  if (!(["start", "status", "stop"] as Command[]).includes(command) && params.outputFormat !== undefined) {
    args.push(`--output-format=${params.outputFormat}`);
  }

  for (const [name, value] of Object.entries(params.options ?? {})) {
    if (name === "sessionId" || name === "output-format" || name === "outputFormat") continue;
    appendOption(args, name, value as OptionValue);
  }

  return args;
}

function shellQuote(value: string): string {
  return /[^a-zA-Z0-9_./:=@%+,-]/.test(value) ? JSON.stringify(value) : value;
}

function commandLabel(args: string[]): string {
  return `chrome-devtools ${args.map(shellQuote).join(" ")}`;
}

function cleanArtifactPath(value: string): string {
  return value.replace(/[),.;]+$/g, "");
}

function extractArtifacts(output: string): string[] {
  const pathPattern = new RegExp(
    `(?:^|[\\s([\\\"'])((?:/|\\./|[A-Za-z]:[\\\\/])[^\\s)\\],;\\\"']+\\.(?:${ARTIFACT_EXTENSIONS}))`,
    "g",
  );
  const paths: string[] = [];
  for (const match of output.matchAll(pathPattern)) {
    paths.push(cleanArtifactPath(match[1]));
  }
  return [...new Set(paths)];
}

function parsePageUrl(output: string): string | undefined {
  const match = output.match(/(?:Page URL|URL):\s*([^\n\r]+)/i)?.[1]?.trim();
  return match && match !== "undefined" ? match : undefined;
}

function parseCommandTokens(input: string): string[] {
  const tokens: string[] = [];
  const pattern = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|(\S+)/g;
  for (const match of input.matchAll(pattern)) {
    tokens.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return tokens;
}

const BOOLEAN_FLAGS = new Set([
  "autoConnect",
  "headless",
  "isolated",
  "acceptInsecureCerts",
  "categoryEmulation",
  "categoryPerformance",
  "categoryNetwork",
  "categoryExtensions",
  "categoryExperimentalThirdParty",
  "categoryPwa",
  "performanceCrux",
  "usageStatistics",
  "memoryDebugging",
  "experimentalVision",
  "experimentalScreencast",
  "experimentalDevtools",
  "includeSnapshot",
  "includePreservedRequests",
  "includePreservedMessages",
  "includeStackTraces",
  "fullPage",
  "background",
  "bringToFront",
  "dblClick",
  "ignoreCache",
  "reload",
  "autoStop",
  "verbose",
  "readOnly",
]);

function parseSlashCommand(input: string): ChromeDevtoolsParams | undefined {
  const tokens = parseCommandTokens(input.trim());
  if (tokens.length === 0) return undefined;

  const command = tokens.shift()!.toLowerCase() as Command;
  if (!COMMANDS.includes(command)) {
    throw new Error(`Unknown /chrome-devtools command: ${command}\n\n${helpText()}`);
  }

  const positional: string[] = [];
  const options: Record<string, OptionValue> = {};
  let outputFormat: "md" | "json" | undefined;
  let session: string | undefined;

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    if (token === "--no-usage-statistics") {
      options.usageStatistics = false;
      continue;
    }

    const body = token.slice(2);
    const equals = body.indexOf("=");
    let name = equals >= 0 ? body.slice(0, equals) : body;
    let value: OptionValue = equals >= 0 ? body.slice(equals + 1) : true;

    if (name === "output-format") {
      const format = String(value);
      if (format !== "md" && format !== "json") throw new Error("--output-format must be md or json.");
      outputFormat = format;
      continue;
    }
    if (name === "sessionId" || name === "session-id") {
      if (value === true) {
        value = tokens[++index];
      }
      session = String(value);
      continue;
    }

    if (equals < 0 && value === true && !BOOLEAN_FLAGS.has(name) && tokens[index + 1] && !tokens[index + 1].startsWith("--")) {
      value = tokens[++index];
    }
    if (name.startsWith("no-") && value === true) {
      name = name.slice(3);
      value = false;
    }

    const previous = options[name];
    if (previous === undefined) {
      options[name] = value;
    } else if (Array.isArray(previous)) {
      previous.push(String(value));
    } else {
      options[name] = [String(previous), String(value)];
    }
  }

  return {
    command,
    args: positional.length > 0 ? positional : undefined,
    options: Object.keys(options).length > 0 ? options : undefined,
    outputFormat,
    session,
  } as ChromeDevtoolsParams;
}

function helpText(): string {
  return [
    "/chrome-devtools <command> [positional args] [--flag=value]",
    "Examples:",
    "  /chrome-devtools list_pages",
    "  /chrome-devtools new_page https://example.com",
    "  /chrome-devtools take_snapshot",
    "  /chrome-devtools lighthouse_audit --mode=snapshot --device=mobile",
    "  /chrome-devtools performance_start_trace --reload=true --autoStop=true --filePath=trace.json.gz",
    "  /chrome-devtools stop",
    "Use the chrome_devtools tool for the complete typed interface.",
  ].join("\n");
}

async function findSkillRoot(executablePath: string): Promise<string | undefined> {
  let current = dirname(executablePath);
  for (let depth = 0; depth < 8; depth++) {
    const candidate = join(current, "skills");
    try {
      await access(join(candidate, "chrome-devtools-cli", "SKILL.md"));
      return candidate;
    } catch {
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return undefined;
}

function displayActionResult(ctx: ExtensionContext, result: ActionResult): void {
  const firstLine = result.text.split("\n").find(line => line.trim().length > 0) ?? "Chrome DevTools completed.";
  const artifactNote = result.details.artifacts.length > 0
    ? `\nartifacts: ${result.details.artifacts.join(", ")}`
    : "";
  ctx.ui.notify(`${firstLine.slice(0, 300)}${artifactNote}`.slice(0, 1_000), "info");
}

async function executeCommand(
  pi: ExtensionAPI,
  params: ChromeDevtoolsParams,
  ctx: ExtensionContext,
  state: RuntimeState,
  signal?: AbortSignal,
): Promise<ActionResult> {
  const sessionId = normalizeSessionId(params.session?.trim() || state.defaultSession);
  const args = buildCliArgs(params, sessionId);
  const cliCommand = commandLabel(args);
  const result = await pi.exec("chrome-devtools", args, {
    cwd: ctx.cwd,
    signal,
    timeout: params.timeoutMs ?? DEFAULT_TIMEOUT,
  });

  const stdout = redactSecrets(result.stdout.trim());
  const stderr = redactSecrets(result.stderr.trim());
  const combined = [stdout, stderr ? `stderr:\n${stderr}` : ""].filter(Boolean).join("\n\n");
  const output = truncateText(combined || "(no output)");
  const artifacts = extractArtifacts(`${stdout}\n${stderr}`);

  if (result.code !== 0 || result.killed) {
    const suffix = result.killed ? " (process terminated)" : ` (exit code ${result.code})`;
    throw new Error(`${cliCommand}${suffix}\n\n${output}`);
  }

  const sections = [output];
  if (artifacts.length > 0) sections.push(`### Artifacts\n${artifacts.join("\n")}`);

  const text = truncateText(sections.join("\n\n"));
  return {
    text,
    details: {
      command: params.command as Command,
      sessionId,
      cliCommand,
      args,
      code: result.code,
      artifacts,
      stdout: truncateText(stdout),
      stderr: truncateText(stderr),
    },
  };
}

export default function chromeDevtoolsCliExtension(pi: ExtensionAPI): void {
  const configuredSession = (
    process.env.CHROME_DEVTOOLS_CLI_SESSION || process.env.CHROME_DEVTOOLS_SESSION_ID || ""
  ).trim();
  const state: RuntimeState = {
    defaultSession: configuredSession ? normalizeSessionId(configuredSession) : "pending",
  };

  pi.registerTool({
    name: "chrome_devtools",
    label: "Chrome DevTools",
    description:
      "Operate Chrome through the official chrome-devtools CLI daemon. Use take_snapshot and its UIDs for deterministic interaction; use lighthouse_audit for accessibility, SEO, best practices, and agentic-browsing audits, and performance tracing for performance analysis.",
    promptSnippet: "Automate, inspect, debug, and audit Chrome with Chrome DevTools CLI",
    promptGuidelines: [
      "Use chrome_devtools instead of invoking chrome-devtools through bash.",
      "Start browser interaction with take_snapshot and use the returned UIDs rather than guessed selectors.",
      "After navigation or a page-changing action, take a fresh snapshot because previous UIDs may be stale.",
      "Use take_screenshot or click_at for canvas, charts, WebGL, and controls missing from the accessibility tree.",
      "Use lighthouse_audit for accessibility, SEO, best practices, and agentic-browsing audits. It intentionally excludes performance; use performance_start_trace and performance_stop_trace for performance insights.",
      "Use --output-format=json when the result needs to be parsed programmatically. Large reports, screenshots, traces, and snapshots are returned as file paths.",
    ],
    parameters: chromeDevtoolsParameters,
    executionMode: "sequential",
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const result = await executeCommand(pi, params, ctx, state, signal);
      return {
        content: [{ type: "text", text: result.text }],
        details: result.details,
      };
    },
    renderCall(args, theme) {
      return new Text(theme.fg("toolTitle", `chrome-devtools ${args.command}`), 0, 0);
    },
    renderResult(result, options, theme, context) {
      if (options.isPartial) return new Text(theme.fg("warning", "Running Chrome DevTools…"), 0, 0);
      const details = result.details as ChromeDevtoolsDetails | undefined;
      if (context.isError) return new Text(theme.fg("error", "✗ Chrome DevTools failed"), 0, 0);
      if (!details) return new Text(theme.fg("muted", "Chrome DevTools finished"), 0, 0);
      const lines = [`✓ ${details.command} · ${details.sessionId ?? "default"}`];
      const url = parsePageUrl(details.stdout);
      if (url) lines.push(url);
      if (details.artifacts.length > 0) lines.push(`artifacts: ${details.artifacts.join(", ")}`);
      if (options.expanded && details.stderr) lines.push(`stderr: ${details.stderr}`);
      return new Text(theme.fg("success", lines.join("\n")), 0, 0);
    },
  });

  pi.registerCommand("chrome-devtools", {
    description: "Run Chrome DevTools CLI commands; use the chrome_devtools tool for the typed interface.",
    getArgumentCompletions(prefix) {
      const filtered = [...COMMANDS].filter(command => command.startsWith(prefix));
      return filtered.length > 0 ? filtered.map(value => ({ value, label: value })) : null;
    },
    async handler(args, ctx) {
      if (!args.trim()) {
        ctx.ui.notify(helpText(), "info");
        return;
      }
      try {
        const params = parseSlashCommand(args);
        if (!params) return;
        const result = await executeCommand(pi, params, ctx, state);
        displayActionResult(ctx, result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(message.slice(0, 1_000), "error");
      }
    },
  });

  pi.on("resources_discover", async (_event, ctx) => {
    const executableResult = await pi.exec("which", ["chrome-devtools"], {
      cwd: ctx.cwd,
      timeout: 5_000,
    });
    if (executableResult.code !== 0) return;

    try {
      const executable = await realpath(executableResult.stdout.trim());
      const skillRoot = await findSkillRoot(executable);
      return skillRoot ? { skillPaths: [skillRoot] } : undefined;
    } catch {
      return undefined;
    }
  });

  pi.on("session_start", (_event, ctx) => {
    if (!configuredSession) state.defaultSession = piSessionId(ctx.sessionManager.getSessionId());
  });

  pi.on("before_agent_start", event => {
    if (!/\b(chrome devtools|devtools|browser automation|lighthouse|performance trace|website|web page)\b/i.test(event.prompt)) return;
    return {
      systemPrompt: `${event.systemPrompt}\n\nChrome DevTools integration: use the chrome_devtools tool rather than shelling out to chrome-devtools. Start with take_snapshot and use its UIDs; refresh snapshots after page-changing actions. Use lighthouse_audit for accessibility, SEO, best practices, and agentic-browsing checks, and performance tracing tools for performance analysis.`,
    };
  });
}
