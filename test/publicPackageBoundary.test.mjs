import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { test } from "node:test";

import {
  checkPackEntries,
  checkPublicPackageBoundary,
  findDependencyBoundaryViolations,
} from "../scripts/check-public-package-boundary.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("public package boundary guard passes current package and npm pack file list", async () => {
  const { violations } = await checkPublicPackageBoundary({ rootDir });
  assert.deepEqual(violations, []);
});

test("npm package keeps launch and marketing docs out of the runtime tarball", async () => {
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const files = JSON.parse(result.stdout)[0].files.map((file) => file.path);
  assert.ok(files.includes("docs/architecture.md"));
  assert.ok(files.includes("docs/distribution-boundary.md"));
  assert.ok(!files.includes("docs/launch-packet.md"));
  assert.ok(!files.includes("docs/launch-assets.md"));
  assert.ok(!files.includes("docs/ja-quickstart.md"));
  assert.ok(!files.some((file) => file.startsWith("docs/assets/")));
  assert.ok(!files.some((file) => file.startsWith("docs/i18n/")));
});

test("public package boundary guard rejects private runtime dependency specs", () => {
  const violations = findDependencyBoundaryViolations({
    manifest: {
      publishConfig: {
        registry: "https://npm.pkg.github.com/",
      },
      scripts: {
        postinstall: "node ./scripts/fetch-private-engine.mjs",
      },
      dependencies: {
        "penso-render-envelope": "github:penso-os/penso-render-envelope",
        "@penso/runtime": "git+ssh://git@github.com/penso-os/runtime.git",
      },
      optionalDependencies: {
        "local-engine": "file:../penso-render-envelope",
      },
      peerDependencies: {
        "@penso-os/render-envelope": "^0.0.0-private",
      },
    },
    lockfile: {
      packages: {
        "": {
          dependencies: {
            "alias-engine": "npm:@penso/penso-render-envelope@1.0.0",
          },
        },
        "node_modules/@penso/runtime": {
          version: "1.0.0",
          resolved: "git+https://github.com/penso-os/runtime.git",
        },
      },
    },
  });

  assert.match(violations.join("\n"), /penso-render-envelope/);
  assert.match(violations.join("\n"), /GitHub dependency shorthand/);
  assert.match(violations.join("\n"), /Git dependency URL/);
  assert.match(violations.join("\n"), /local file dependency/);
  assert.match(violations.join("\n"), /private package alias/);
  assert.match(violations.join("\n"), /scripts\.postinstall/);
  assert.match(violations.join("\n"), /publishConfig\.registry/);
});

test("public package boundary guard rejects private-looking npm pack paths", () => {
  const violations = checkPackEntries([
    { path: "package/bin/codex-webapp.mjs" },
    { path: "package/penso-render-envelope/index.js" },
    { path: "package/.npmrc" },
  ]);

  assert.deepEqual(violations, [
    "npm pack would include private-boundary file path package/penso-render-envelope/index.js",
    "npm pack would include private-boundary file path package/.npmrc",
  ]);
});
