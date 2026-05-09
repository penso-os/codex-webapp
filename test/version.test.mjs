import test from "node:test";
import assert from "node:assert/strict";

import {
  compareVersions,
  extractVersion,
  isRemoteControlReady,
} from "../src/version.js";

test("extractVersion reads codex-cli output", () => {
  assert.equal(extractVersion("codex-cli 0.130.0"), "0.130.0");
  assert.equal(extractVersion("Codex CLI version 1.2.3"), "1.2.3");
  assert.equal(extractVersion("missing"), null);
});

test("compareVersions orders semantic versions", () => {
  assert.equal(compareVersions("0.130.0", "0.130.0"), 0);
  assert.equal(compareVersions("0.131.0", "0.130.0"), 1);
  assert.equal(compareVersions("0.129.9", "0.130.0"), -1);
  assert.equal(compareVersions("0.130.0-beta.1", "0.130.0"), 0);
  assert.equal(compareVersions("codex-cli 0.131.0-beta.1", "0.130.0"), 1);
});

test("isRemoteControlReady requires codex 0.130.0 or newer", () => {
  assert.equal(isRemoteControlReady("codex-cli 0.130.0"), true);
  assert.equal(isRemoteControlReady("codex-cli 0.130.0-beta.1"), true);
  assert.equal(isRemoteControlReady("codex-cli 0.140.1"), true);
  assert.equal(isRemoteControlReady("codex-cli 0.128.0"), false);
});
