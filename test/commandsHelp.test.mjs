import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("help explains the Codex App paste, start, and browser-open flow", () => {
  const result = spawnSync("node", ["./bin/codex-webapp.mjs", "help"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Quick start from Codex App:/);
  assert.match(result.stdout, /npx -y codex-webapp doctor/);
  assert.match(result.stdout, /npx -y codex-webapp start/);
  assert.match(result.stdout, /http:\/\/127\.0\.0\.1:8214\//);
});
