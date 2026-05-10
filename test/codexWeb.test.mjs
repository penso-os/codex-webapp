import test from "node:test";
import assert from "node:assert/strict";

import {
  assertSafeHost,
  buildLocalServerSummary,
  buildWebUrl,
  parseStartArgs,
} from "../src/codexWeb.js";

test("parseStartArgs defaults to the local WebApp port", () => {
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

test("buildWebUrl returns the local WebApp URL", () => {
  assert.equal(buildWebUrl({ host: "127.0.0.1", port: 8214 }), "http://127.0.0.1:8214/");
});

test("assertSafeHost refuses non-loopback host without explicit override", () => {
  assert.throws(() => assertSafeHost("0.0.0.0"), /Refusing to bind/);
});

test("buildLocalServerSummary describes the package-owned renderer bridge", () => {
  assert.deepEqual(buildLocalServerSummary({ host: "127.0.0.1", port: 8214 }), {
    host: "127.0.0.1",
    port: 8214,
    url: "http://127.0.0.1:8214/",
    runtime: "package-owned Codex App renderer bridge",
  });
});
