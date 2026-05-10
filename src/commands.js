import { spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  compareVersions,
  extractVersion,
  MIN_CODEX_VERSION,
} from "./version.js";
import { runSmoke } from "./browserSmoke.js";
import { startLocalServer } from "./localServer.js";
import {
  assertSafeHost,
  buildLocalServerSummary,
  buildWebUrl,
  parseStartArgs,
} from "./codexWeb.js";

const BANNER = "Codex WebApp — unofficial OpenAI Codex companion; not endorsed by OpenAI.";
const DEFAULT_WEB_URL = "http://127.0.0.1:8214/";

function codexAppFlowLines(url = DEFAULT_WEB_URL) {
  return [
    "Codex App flow:",
    "  1. Paste a setup request into the Codex App prompt.",
    "  2. Codex runs: npx -y codex-webapp start",
    `  3. When it starts, open: ${url}`,
    "  4. Keep this terminal window open. Closing it will stop the browser UI.",
  ];
}

export function main(argv = process.argv) {
  const command = argv[2] ?? "help";
  if (command === "doctor") {
    doctor();
    return;
  }
  if (command === "start") {
    start(argv.slice(3)).catch((error) => {
      fail([
        "Start failed.",
        String(error?.message ?? error),
      ]);
    });
    return;
  }
  if (command === "smoke") {
    runSmoke(argv.slice(3)).catch((error) => {
      fail([
        "Smoke failed.",
        String(error?.message ?? error),
        "",
        "Check that the UI server is running and that the URL is reachable.",
      ]);
    });
    return;
  }
  help();
}

export function doctor() {
  const codexPath = resolveCodexPath();
  const codexCommand = codexPath || "codex";
  const codex = spawnSync(codexCommand, ["--version"], { encoding: "utf8" });
  if (codex.error || codex.status !== 0) {
    fail([
      "Codex CLI was not found.",
      "",
      "Install or update Codex first:",
      "  npm install -g @openai/codex",
      "",
      "Then run:",
      "  npx codex-webapp doctor",
    ]);
  }

  const versionText = `${codex.stdout}${codex.stderr}`.trim();
  const version = extractVersion(versionText);
  if (!version || compareVersions(version, MIN_CODEX_VERSION) < 0) {
    fail([
      `Codex CLI ${MIN_CODEX_VERSION}+ is required for remote-control.`,
      `Detected: ${versionText || "unknown"}`,
      "",
      "Update Codex:",
      "  npm install -g @openai/codex@latest",
      "",
      "Then verify:",
      "  codex remote-control --help",
    ]);
  }

  const helpResult = spawnSync(codexCommand, ["remote-control", "--help"], {
    encoding: "utf8",
  });
  if (helpResult.status !== 0) {
    fail([
      "`codex remote-control --help` did not run successfully.",
      "",
      "Codex is installed, but this CLI may not include remote-control yet.",
      "Update Codex and try again:",
      "  npm install -g @openai/codex@latest",
    ]);
  }

  const appServerResult = spawnSync(codexCommand, ["app-server", "--help"], {
    encoding: "utf8",
  });
  if (appServerResult.status !== 0) {
    fail([
      "`codex app-server --help` did not run successfully.",
      "",
      "Codex is installed, but the local app-server substrate is unavailable.",
      "Update Codex and try again:",
      "  npm install -g @openai/codex@latest",
    ]);
  }

  ok([
    BANNER,
    `Codex CLI is ready: ${versionText}`,
    `Codex executable: ${codexPath || "unknown"}`,
    "`codex remote-control` is available.",
    "`codex app-server` is available.",
    "Next:",
    "  npx -y codex-webapp start",
    "",
    ...codexAppFlowLines(),
  ]);
}

export async function start(args = []) {
  const options = parseStartArgs(args);
  const codexPath = resolveCodexPath();
  const codexCommand = codexPath || process.env.CODEX_CLI_PATH || "codex";
  const check = spawnSync(codexCommand, ["app-server", "--help"], {
    encoding: "utf8",
  });
  const appServerReady = check.status === 0;

  assertSafeHost(options.host, { allowNonLoopback: options.allowNonLoopback });
  const plannedWebUrl = buildWebUrl({ host: options.host, port: options.port });
  const localServer = buildLocalServerSummary({
    host: options.host,
    port: options.port,
  });

  if (options.dryRun) {
    ok([
      BANNER,
      "Dry run passed.",
      `Would start Codex WebApp: ${plannedWebUrl}`,
      `Runtime: ${localServer.runtime}`,
      "",
      ...codexAppFlowLines(plannedWebUrl),
    ]);
    return;
  }

  await assertPortAvailable(options.host, options.port);

  if (!options.yes) {
    console.log(BANNER);
    console.log(`About to start Codex WebApp: ${plannedWebUrl}`);
    console.log("Default expectation: keep it on localhost or behind Tailscale, Cloudflare Access, or an equivalent trusted boundary.");
    console.log("Anyone who can reach this URL can operate Codex on this host.");
    const rl = createInterface({ input, output });
    const answer = await rl.question("Continue? Type 'yes' to start: ");
    rl.close();
    if (answer.trim().toLowerCase() !== "yes") {
      console.log("Canceled.");
      return;
    }
  }

  console.log("Starting Codex WebApp local server...");
  if (!appServerReady) {
    console.log("Warning: `codex app-server --help` did not pass. The UI will still open, but health will show the Codex substrate issue.");
    console.log("Run `npx codex-webapp doctor` in another terminal for the exact fix.");
  }
  console.log(`Open: ${plannedWebUrl}`);
  console.log("");
  for (const line of codexAppFlowLines(plannedWebUrl)) console.log(line);
  console.log("");
  console.log("Keep this terminal open. Expose it only through a trusted local, Tailscale, Cloudflare Access, or equivalent boundary.");
  await startLocalServer({
    host: options.host,
    port: options.port,
    codexPath: codexCommand,
    cwd: process.cwd(),
  });
}

async function assertPortAvailable(host, port) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", (error) => {
      if (error?.code === "EADDRINUSE") {
        reject(new Error(`Port ${port} is already in use on ${host}. Codex WebApp may already be running. Close the other terminal window, or start with --port <port>.`));
        return;
      }
      reject(error);
    });
    server.once("listening", () => {
      server.close(resolve);
    });
    server.listen(port, host);
  });
}

export function help() {
  console.log(`${BANNER}

Commands:
  codex-webapp doctor       Check Codex CLI >= ${MIN_CODEX_VERSION}
  codex-webapp start        Confirm, then start Codex WebApp
  codex-webapp start --dry-run
  codex-webapp start --yes  Start without the confirmation prompt
  codex-webapp start --port 8214
  codex-webapp start --host 127.0.0.1
  codex-webapp start --allow-non-loopback
  codex-webapp smoke --url http://127.0.0.1:8214/
  codex-webapp smoke --browser --screenshot artifacts/codex-webapp.png

Quick start from Codex App:
  Paste a request that asks Codex to run:
    npx -y codex-webapp doctor
    npx -y codex-webapp start
  Then open:
    ${DEFAULT_WEB_URL}

Terminal quick start:
  npx -y codex-webapp doctor
  npx -y codex-webapp start
`);
}

function ok(lines) {
  for (const line of lines) console.log(line);
}

function fail(lines) {
  console.error(BANNER);
  for (const line of lines) console.error(line);
  process.exit(1);
}

export function resolveCodexPath() {
  const result = spawnSync("bash", ["-l", "-c", "which codex"], {
    encoding: "utf8",
  });
  if (result.status !== 0) return "";
  return result.stdout.trim();
}
