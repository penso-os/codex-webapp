import test from "node:test";
import assert from "node:assert/strict";

import {
  CODEX_WEB_REFERENCE,
  assertSafeHost,
  buildCodexWebNpxArgs,
  buildWebUrl,
  parseStartArgs,
} from "../src/codexWeb.js";

test("parseStartArgs defaults to the codex-web localhost port", () => {
  assert.deepEqual(parseStartArgs([]), {
    dryRun: false,
    yes: false,
    allowNonLoopback: false,
    host: "127.0.0.1",
    port: 8214,
  });
});

test("parseStartArgs accepts dry-run, yes, host, and port", () => {
  assert.deepEqual(
    parseStartArgs([
      "--dry-run",
      "--yes",
      "--allow-non-loopback",
      "--host",
      "localhost",
      "--port",
      "9000",
    ]),
    {
      dryRun: true,
      yes: true,
      allowNonLoopback: true,
      host: "localhost",
      port: 9000,
    },
  );
});

test("parseStartArgs accepts legacy --ui-port during migration", () => {
  assert.equal(parseStartArgs(["--ui-port", "8765"]).port, 8765);
});

test("buildWebUrl returns the local codex-web URL", () => {
  assert.equal(buildWebUrl({ host: "127.0.0.1", port: 8214 }), "http://127.0.0.1:8214/");
});

test("assertSafeHost refuses non-loopback host without explicit override", () => {
  assert.throws(() => assertSafeHost("0.0.0.0"), /Refusing to bind/);
});

test("buildCodexWebNpxArgs launches the upstream thin web UI", () => {
  assert.deepEqual(buildCodexWebNpxArgs({ host: "127.0.0.1", port: 8214 }), [
    "--yes",
    CODEX_WEB_REFERENCE,
    "--host",
    "127.0.0.1",
    "--port",
    "8214",
  ]);
});
