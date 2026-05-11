import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { CodexAppServerBridge } from "../src/appServerBridge.js";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("app-server bridge initializes with package version and handles request/close lifecycle", async () => {
  const fixture = await createMockCodexFixture();
  try {
    const notifications = [];
    const bridge = new CodexAppServerBridge({
      codexPath: fixture.codexPath,
      codexArgs: [fixture.serverPath],
      env: { ...process.env, MOCK_CODEX_LOG: fixture.logPath },
      onNotification: (message) => notifications.push(message),
      timeoutMs: 200,
    });

    await Promise.all([bridge.ensureStarted(), bridge.ensureStarted()]);
    const result = await bridge.request("echo", { ok: true });
    bridge.receiveStdout('{"method":"codex/event","params":{"type":"ready"}}\n');
    bridge.close();

    const log = await fixture.readLog();
    assert.equal(log.filter((line) => line.startsWith("initialize:")).length, 1);
    assert.equal(
      JSON.parse(log.find((line) => line.startsWith("initialize:")).slice("initialize:".length)).version,
      packageJson.version,
    );
    assert.deepEqual(result, { ok: true });
    assert.deepEqual(notifications, [{ method: "codex/event", params: { type: "ready" } }]);
  } finally {
    await fixture.cleanup();
  }
});

test("app-server bridge rejects request timeouts and close rejects pending requests", async () => {
  const fixture = await createMockCodexFixture();
  try {
    const timeoutBridge = new CodexAppServerBridge({
      codexPath: fixture.codexPath,
      codexArgs: [fixture.serverPath],
      env: { ...process.env, MOCK_CODEX_LOG: fixture.logPath },
      timeoutMs: 25,
    });
    await assert.rejects(timeoutBridge.request("never"), /timed out waiting/);
    timeoutBridge.close();

    const closeBridge = new CodexAppServerBridge({
      codexPath: fixture.codexPath,
      codexArgs: [fixture.serverPath],
      env: { ...process.env, MOCK_CODEX_LOG: fixture.logPath },
      timeoutMs: 1_000,
    });
    await closeBridge.ensureStarted();
    const pending = closeBridge.sendRequest("never");
    closeBridge.close();
    await assert.rejects(pending, /bridge closed/);
  } finally {
    await fixture.cleanup();
  }
});

test("app-server bridge keeps initialization stderr diagnostics bounded to the tail", async () => {
  const fixture = await createMockCodexFixture();
  try {
    const bridge = new CodexAppServerBridge({
      codexPath: fixture.codexPath,
      codexArgs: [fixture.serverPath],
      env: {
        ...process.env,
        MOCK_CODEX_LOG: fixture.logPath,
        MOCK_CODEX_FAIL_INIT: "1",
        MOCK_CODEX_STDERR_PREFIX: "old-noise",
        MOCK_CODEX_STDERR_TAIL: "latest-diagnostic",
      },
      timeoutMs: 200,
    });

    await assert.rejects(
      bridge.ensureStarted(),
      (error) => {
        assert.match(error.message, /failed to initialize codex app-server/);
        assert.match(error.message, /latest-diagnostic/);
        assert.doesNotMatch(error.message, /old-noise/);
        assert.ok(Buffer.byteLength(error.message, "utf8") < 17_500);
        return true;
      },
    );
    bridge.close();
  } finally {
    await fixture.cleanup();
  }
});

async function createMockCodexFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "codex-webapp-bridge-"));
  const serverPath = path.join(root, "mock-codex-server.mjs");
  const logPath = path.join(root, "mock.log");
  await writeFile(serverPath, mockCodexSource(), "utf8");
  return {
    codexPath: process.execPath,
    serverPath,
    logPath,
    readLog: async () => (await readFile(logPath, "utf8")).trim().split("\n").filter(Boolean),
    cleanup: async () => rm(root, { recursive: true, force: true }),
  };
}

function mockCodexSource() {
  return `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
import { createInterface } from "node:readline";

const logPath = process.env.MOCK_CODEX_LOG;
function log(line) {
  if (logPath) appendFileSync(logPath, line + "\\n");
}

const rl = createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    log("initialize:" + JSON.stringify(message.params.clientInfo));
    if (process.env.MOCK_CODEX_FAIL_INIT === "1") {
      process.stderr.write((process.env.MOCK_CODEX_STDERR_PREFIX || "") + "x".repeat(20_000));
      process.stderr.write(process.env.MOCK_CODEX_STDERR_TAIL || "");
      process.stdout.write(JSON.stringify({ id: message.id, error: { message: "init failed" } }) + "\\n");
      return;
    }
    process.stdout.write(JSON.stringify({ id: message.id, result: { ok: true } }) + "\\n");
    return;
  }
  if (message.method === "echo") {
    process.stdout.write(JSON.stringify({ id: message.id, result: message.params }) + "\\n");
    return;
  }
  if (message.method === "never") return;
  process.stdout.write(JSON.stringify({ id: message.id, error: { message: "unknown method" } }) + "\\n");
});
`;
}
