import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  checkNodeVersion,
  inspectManifestAndLock,
  inspectPackJson,
  inspectRelativePaths,
  inspectSourceTree,
  parseArgs,
  runRequiredCommand,
} from "../scripts/verify-clean-release.mjs";

test("clean release gate accepts flag and environment private engine path", () => {
  assert.deepEqual(parseArgs(["--private-engine-dir", "/tmp/penso-render-envelope"]), {
    privateEngineDir: "/tmp/penso-render-envelope",
  });
  assert.deepEqual(parseArgs(["--private-engine-dir=/tmp/private-engine"]), {
    privateEngineDir: "/tmp/private-engine",
  });
});

test("clean release gate enforces Node 20.11 minimum", () => {
  assert.deepEqual(checkNodeVersion("20.11.0"), []);
  assert.deepEqual(checkNodeVersion("21.0.0"), []);
  assert.match(checkNodeVersion("20.10.9").join("\n"), /below the clean release gate minimum/);
});

test("clean release gate rejects bundled artifact and sensitive-looking paths", () => {
  const violations = inspectRelativePaths([
    "src/codexWeb.js",
    "fixtures/app.asar",
    "fixtures/webview/index.html",
    "artifacts/openai-runtime.dmg",
    "secrets/tokens.json",
    "customer-data/export.json",
    "session.sqlite",
  ]);

  assert.match(violations.join("\n"), /Codex App archive/);
  assert.match(violations.join("\n"), /pre-extracted renderer payload/);
  assert.match(violations.join("\n"), /Codex\/OpenAI binary-looking artifact/);
  assert.match(violations.join("\n"), /token-looking path/);
  assert.match(violations.join("\n"), /customer data-looking path/);
  assert.match(violations.join("\n"), /session database-looking path/);
});

test("clean release gate rejects private engine names in paths and pack metadata", () => {
  assert.match(
    inspectRelativePaths(["vendor/penso_render.envelope/index.js"]).join("\n"),
    /private engine package name/,
  );

  assert.match(
    inspectPackJson({
      name: "penso-render-envelope",
      filename: "penso-render-envelope-0.0.0.tgz",
      files: [{ path: "lib/index.js" }],
    }).join("\n"),
    /private engine package name/,
  );
});

test("clean release gate rejects private and bundled runtime dependency specs", () => {
  const violations = inspectManifestAndLock({
    manifest: {
      dependencies: {
        "codex-webapp": "^0.1.0",
        "@penso-os/render-envelope": "^0.0.0-private",
      },
    },
    lockfile: {
      packages: {
        "": {
          optionalDependencies: {
            "@openai/codex": "^1.0.0",
          },
        },
      },
    },
  });

  assert.match(violations.join("\n"), /Codex\/OpenAI runtime package/);
  assert.match(violations.join("\n"), /@penso-os\/render-envelope/);
});

test("clean release gate allows public docs to describe excluded artifacts", () => {
  const violations = inspectRelativePaths([
    "README.md",
    "docs/distribution-boundary.md",
    "bin/codex-webapp.mjs",
  ]);

  assert.deepEqual(violations, []);
});

test("clean release gate scans runtime source content while allowing boundary docs", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "codex-webapp-clean-gate-"));
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await mkdir(path.join(root, "docs"), { recursive: true });
    await writeFile(path.join(root, "src", "runtime.js"), "export const engine = 'penso-render-envelope';\n", "utf8");
    await writeFile(path.join(root, "docs", "boundary.md"), "This docs page may name penso-render-envelope as excluded.\n", "utf8");

    const violations = await inspectSourceTree(root);

    assert.deepEqual(violations, [
      "file content appears to include private engine package name: src/runtime.js",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("clean release gate reports an invalid command cwd as a bounded failure", () => {
  const result = runRequiredCommand({
    label: "private engine npm test",
    command: "npm",
    args: ["test"],
    cwd: "/tmp/codex-webapp-missing-private-engine",
    log: () => {},
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "spawn-error");
});
