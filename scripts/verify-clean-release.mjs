#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { Dirent } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  checkPackEntries,
  findDependencyBoundaryViolations,
} from "./check-public-package-boundary.mjs";

const MIN_NODE_VERSION = [20, 11, 0];
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "bundleDependencies",
  "bundledDependencies",
];
const SOURCE_SCAN_SKIP_DIRS = new Set([
  ".git",
  ".hg",
  ".svn",
  "coverage",
  "dist",
  "node_modules",
  ".next",
  ".turbo",
  ".vite",
]);
const CONTENT_SCAN_EXTENSIONS = new Set([
  ".cjs",
  ".js",
  ".json",
  ".mjs",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml",
]);
const CONTENT_SCAN_ALLOWLIST = [
  /^docs\//,
  /^test\//,
  /^README(?:\.[^.]+)?\.md$/i,
  /^ACKNOWLEDGEMENTS\.md$/i,
  /^CONTRIBUTING\.md$/i,
  /^LICENSE\.md$/i,
  /^SECURITY\.md$/i,
  /^SUPPORT\.md$/i,
  /^scripts\/check-public-package-boundary\.mjs$/,
  /^scripts\/verify-clean-release\.mjs$/,
];

const PRIVATE_ENGINE_NAME_PATTERNS = [
  /(?:^|[/@._-])penso[._-]?render[._-]?envelope(?:$|[/@._-])/i,
  /(?:^|[/@])@penso-os[/@]render[._-]?envelope(?:$|[/@._-])/i,
];

const FORBIDDEN_ARTIFACT_PATH_PATTERNS = [
  {
    label: "Codex App archive",
    pattern: /(?:^|[/\\])app\.asar$/i,
  },
  {
    label: "pre-extracted renderer payload",
    pattern: /(?:^|[/\\])webview(?:[/\\]|$)/i,
  },
  {
    label: "Codex/OpenAI binary-looking artifact",
    pattern: /(?:^|[/\\])(?:codex|openai)(?:[-_.]?(?:app|cli|binary|runtime))?\.(?:app|asar|dmg|pkg|exe|bin|zip|tar|tgz|gz)$/i,
  },
  {
    label: "secret environment file",
    pattern: /(?:^|[/\\])\.env(?:\.|$)/i,
  },
  {
    label: "npm credential file",
    pattern: /(?:^|[/\\])\.npmrc$/i,
  },
  {
    label: "token-looking path",
    pattern: /(?:^|[/\\])(?:tokens?|api[-_]?keys?|auth[-_]?store)(?:[/\\.]|$)/i,
  },
  {
    label: "cookie-looking path",
    pattern: /(?:^|[/\\])cookies?(?:[/\\.]|$)/i,
  },
  {
    label: "signed URL-looking path",
    pattern: /(?:^|[/\\])signed[-_]?urls?(?:[/\\.]|$)/i,
  },
  {
    label: "session database-looking path",
    pattern: /(?:^|[/\\])(?:session|sessions|session[-_]?db|state)\.(?:db|sqlite|sqlite3)$/i,
  },
  {
    label: "customer data-looking path",
    pattern: /(?:^|[/\\])customer[-_]?data(?:[/\\.]|$)/i,
  },
  {
    label: "private key-looking path",
    pattern: /(?:^|[/\\])(?:id_rsa|id_ed25519|private[-_]?key|.*\.pem)$/i,
  },
];
const FORBIDDEN_CONTENT_PATTERNS = [
  {
    label: "private engine package name",
    pattern: /(?:^|[^a-z0-9])(?:@penso-os\/render[._-]?envelope|penso[._-]?render[._-]?envelope)(?:$|[^a-z0-9])/i,
  },
  {
    label: "private GitHub package registry URL",
    pattern: /npm\.pkg\.github\.com/i,
  },
  {
    label: "private repo dependency spec",
    pattern: /(?:github:|git\+https:\/\/github\.com\/|git\+ssh:\/\/git@github\.com:|file:\.\.\/)penso-os\/(?:penso[._-]?render[._-]?envelope|render[._-]?envelope)/i,
  },
  {
    label: "OpenAI API key-looking value",
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    label: "GitHub token-looking value",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/,
  },
  {
    label: "private key block",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    label: "signed URL-looking value",
    pattern: /https?:\/\/[^\s"'`]+[?&](?:X-Amz-Signature|Signature|sig)=/i,
  },
];

const PACK_METADATA_FIELDS = [
  "name",
  "version",
  "filename",
  "id",
  "shasum",
  "integrity",
  "unpackedSize",
];

export function parseArgs(argv) {
  const args = [...argv];
  let privateEngineDir = process.env.PENSO_RENDER_ENVELOPE_DIR || "";
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--private-engine-dir") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--private-engine-dir requires a path value");
      }
      privateEngineDir = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--private-engine-dir=")) {
      privateEngineDir = arg.slice("--private-engine-dir=".length);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return { privateEngineDir: privateEngineDir || null };
}

export function checkNodeVersion(version = process.versions.node) {
  const actual = version.split(".").map((part) => Number(part));
  for (let index = 0; index < MIN_NODE_VERSION.length; index += 1) {
    const current = actual[index] || 0;
    const required = MIN_NODE_VERSION[index];
    if (current > required) return [];
    if (current < required) {
      return [`Node.js ${version} is below the clean release gate minimum ${MIN_NODE_VERSION.join(".")}`];
    }
  }
  return [];
}

export function inspectManifestAndLock({ manifest, lockfile }) {
  const violations = findDependencyBoundaryViolations({ manifest, lockfile });
  for (const { source, name, spec } of dependencySpecEntries({ manifest, lockfile })) {
    if (looksLikeBundledCodexRuntime(name, spec)) {
      violations.push(`${source} appears to depend on a Codex/OpenAI runtime package: ${name}`);
    }
  }
  return violations;
}

export function inspectPackJson(packJson) {
  const entries = Array.isArray(packJson) ? packJson : [packJson];
  const violations = [];
  for (const entry of entries) {
    for (const field of PACK_METADATA_FIELDS) {
      if (entry?.[field] && hasPrivateEngineName(String(entry[field]))) {
        violations.push(`npm pack metadata ${field} references a private engine package name`);
      }
    }
    violations.push(...checkPackEntries(entry?.files || []));
    violations.push(...inspectRelativePaths((entry?.files || []).map((file) => `package/${file.path || file}`)));
  }
  return uniqueViolations(violations);
}

export function inspectRelativePaths(relativePaths) {
  const violations = [];
  for (const originalPath of relativePaths) {
    const normalized = normalizeForScan(originalPath);
    if (!normalized) continue;
    if (hasPrivateEngineName(normalized)) {
      violations.push(`path appears to include a private engine package name: ${originalPath}`);
    }
    for (const { label, pattern } of FORBIDDEN_ARTIFACT_PATH_PATTERNS) {
      if (pattern.test(normalized)) {
        violations.push(`path appears to include ${label}: ${originalPath}`);
      }
    }
  }
  return uniqueViolations(violations);
}

export async function collectSourcePaths(rootDir) {
  const paths = [];
  await walk(rootDir, "", paths, null);
  return paths;
}

export async function inspectSourceTree(rootDir) {
  const entries = [];
  await walk(rootDir, "", null, entries);
  const sourcePaths = entries.map((entry) => entry.relativePath);
  return uniqueViolations([
    ...inspectRelativePaths(sourcePaths),
    ...await inspectTextFileContents(rootDir, entries),
  ]);
}

export async function verifyCleanRelease({
  rootDir = process.cwd(),
  privateEngineDir = null,
  log = console.log,
  errorLog = console.error,
} = {}) {
  const failures = [];
  const results = [];

  failures.push(...checkNodeVersion());

  const manifest = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf8"));
  const lockfile = JSON.parse(await readFile(path.join(rootDir, "package-lock.json"), "utf8"));
  failures.push(...inspectManifestAndLock({ manifest, lockfile }));
  failures.push(...await inspectSourceTree(rootDir));

  results.push(runRequiredCommand({ label: "npm test", command: "npm", args: ["test"], cwd: rootDir, log }));
  results.push(runRequiredCommand({
    label: "npm run check:public-boundary",
    command: "npm",
    args: ["run", "check:public-boundary"],
    cwd: rootDir,
    log,
  }));

  const packResult = runPackDryRun(rootDir, log);
  results.push(packResult);
  if (packResult.ok && packResult.packJson) {
    failures.push(...inspectPackJson(packResult.packJson));
  }

  if (manifest.scripts?.["start:dry-run"]) {
    results.push(runRequiredCommand({
      label: "npm run start:dry-run",
      command: "npm",
      args: ["run", "start:dry-run"],
      cwd: rootDir,
      log,
    }));
  } else {
    results.push({ label: "npm run start:dry-run", ok: true, skipped: true, reason: "script is absent" });
  }

  if (privateEngineDir) {
    const resolvedPrivateEngineDir = path.resolve(privateEngineDir);
    results.push(runRequiredCommand({
      label: `private engine npm test (${resolvedPrivateEngineDir})`,
      command: "npm",
      args: ["test"],
      cwd: resolvedPrivateEngineDir,
      log,
    }));
    results.push(runRequiredCommand({
      label: `private engine npm pack --dry-run (${resolvedPrivateEngineDir})`,
      command: "npm",
      args: ["pack", "--dry-run"],
      cwd: resolvedPrivateEngineDir,
      log,
    }));
  } else {
    results.push({
      label: "private engine checks",
      ok: true,
      skipped: true,
      reason: "set PENSO_RENDER_ENVELOPE_DIR or pass --private-engine-dir to include the private repo",
    });
  }

  for (const result of results) {
    if (!result.ok) {
      failures.push(`${result.label} failed with exit code ${result.status}`);
    }
  }

  const uniqueFailures = uniqueViolations(failures);
  printSummary({ results, failures: uniqueFailures, log, errorLog });
  return { ok: uniqueFailures.length === 0, results, failures: uniqueFailures };
}

function runPackDryRun(rootDir, log) {
  log("==> npm pack --dry-run");
  const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  if (result.status !== 0) {
    return { label: "npm pack --dry-run", ok: false, status: result.status };
  }
  try {
    const packJson = JSON.parse(result.stdout);
    const entries = Array.isArray(packJson) ? packJson : [packJson];
    for (const entry of entries) {
      log(`packed ${entry.filename || entry.name || "package"} (${entry.files?.length || 0} files)`);
    }
    return { label: "npm pack --dry-run", ok: true, status: 0, packJson };
  } catch (error) {
    return {
      label: `npm pack --dry-run JSON parse (${error.message})`,
      ok: false,
      status: 1,
    };
  }
}

function runRequiredCommand({ label, command, args, cwd, log }) {
  log(`==> ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  return { label, ok: result.status === 0, status: result.status };
}

function printSummary({ results, failures, log, errorLog }) {
  log("\nClean release verification summary:");
  for (const result of results) {
    if (result.skipped) {
      log(`- SKIP ${result.label}: ${result.reason}`);
      continue;
    }
    log(`- ${result.ok ? "PASS" : "FAIL"} ${result.label}`);
  }

  if (failures.length > 0) {
    errorLog("\nClean release verification found bounded release-readiness issues:");
    for (const failure of failures) {
      errorLog(`- ${failure}`);
    }
    return;
  }
  log("\nClean release verification passed. This is a bounded gate, not a guarantee of release safety.");
}

function looksLikeBundledCodexRuntime(name, spec) {
  if (/^@openai\/codex$/i.test(name)) return true;
  if (/^codex(?:-cli)?$/i.test(name) && /openai|codex/i.test(spec)) return true;
  return false;
}

function dependencySpecEntries({ manifest, lockfile }) {
  const entries = [];
  collectDependencySpecs(entries, "package.json", manifest);
  collectDependencySpecs(entries, "package-lock.json root", lockfile?.packages?.[""]);
  for (const [packagePath, packageMeta] of Object.entries(lockfile?.packages || {})) {
    collectDependencySpecs(entries, `package-lock.json ${packagePath || "<root>"}`, packageMeta);
  }
  for (const [name, meta] of Object.entries(lockfile?.dependencies || {})) {
    entries.push({ source: `package-lock.json dependencies ${name}`, name, spec: String(meta?.version || "") });
  }
  return entries;
}

function collectDependencySpecs(entries, source, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, spec] of Object.entries(value[field] || {})) {
      entries.push({ source: `${source} ${field}`, name, spec: String(spec) });
    }
  }
}

function hasPrivateEngineName(value) {
  return PRIVATE_ENGINE_NAME_PATTERNS.some((pattern) => pattern.test(normalizeForScan(value)));
}

function normalizeForScan(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\/+/, "");
}

async function walk(rootDir, relativeDir, paths, entriesOut) {
  const dir = path.join(rootDir, relativeDir);
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!(entry instanceof Dirent)) continue;
    if (entry.name === "." || entry.name === "..") continue;
    const relativePath = path.join(relativeDir, entry.name);
    const normalized = normalizeForScan(relativePath);
    if (entry.isDirectory()) {
      if (SOURCE_SCAN_SKIP_DIRS.has(entry.name)) continue;
      paths?.push(`${normalized}/`);
      entriesOut?.push({ relativePath: `${normalized}/`, isFile: false });
      await walk(rootDir, relativePath, paths, entriesOut);
      continue;
    }
    paths?.push(normalized);
    entriesOut?.push({ relativePath: normalized, isFile: true });
  }
}

async function inspectTextFileContents(rootDir, entries) {
  const violations = [];
  for (const entry of entries) {
    if (!entry.isFile || !shouldScanFileContent(entry.relativePath)) continue;
    let text;
    try {
      text = await readFile(path.join(rootDir, entry.relativePath), "utf8");
    } catch {
      continue;
    }
    for (const { label, pattern } of FORBIDDEN_CONTENT_PATTERNS) {
      if (pattern.test(text)) {
        violations.push(`file content appears to include ${label}: ${entry.relativePath}`);
      }
    }
  }
  return violations;
}

function shouldScanFileContent(relativePath) {
  const normalized = normalizeForScan(relativePath);
  if (CONTENT_SCAN_ALLOWLIST.some((pattern) => pattern.test(normalized))) {
    return false;
  }
  return CONTENT_SCAN_EXTENSIONS.has(path.extname(normalized));
}

function uniqueViolations(violations) {
  return [...new Set(violations.filter(Boolean))];
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  try {
    const { privateEngineDir } = parseArgs(process.argv.slice(2));
    const result = await verifyCleanRelease({ privateEngineDir });
    if (!result.ok) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`Clean release verification failed to start: ${error.message}`);
    process.exit(1);
  }
}
