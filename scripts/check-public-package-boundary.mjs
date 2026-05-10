import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "bundleDependencies",
  "bundledDependencies",
];

const PRIVATE_PACKAGE_NAMES = new Set([
  "penso-render-envelope",
  "@penso/penso-render-envelope",
  "@penso-os/render-envelope",
]);

const PRIVATE_PACKAGE_PREFIXES = [
  "@penso/",
];

const PRIVATE_SPEC_PATTERNS = [
  { label: "GitHub dependency shorthand", pattern: /^github:/i },
  { label: "Git dependency URL", pattern: /^(?:git\+|git:\/\/|ssh:\/\/)/i },
  { label: "GitHub URL dependency", pattern: /(?:^|[/:@])github\.com[/:]/i },
  { label: "GitHub package registry URL", pattern: /(?:^|[/:@])npm\.pkg\.github\.com[/:]/i },
  { label: "local file dependency", pattern: /^file:/i },
  { label: "local link dependency", pattern: /^link:/i },
  { label: "workspace dependency", pattern: /^workspace:/i },
  { label: "private package alias", pattern: /(?:^|:)@penso\//i },
  { label: "private package alias", pattern: /(?:^|:)@penso-os\/render-envelope(?:$|@)/i },
  { label: "private engine package", pattern: /(?:^|[/:@])penso-render-envelope(?:$|[#/:@])/i },
];

const INSTALL_LIFECYCLE_SCRIPTS = new Set([
  "preinstall",
  "install",
  "postinstall",
]);

const PRIVATE_PACK_PATH_PATTERNS = [
  /(?:^|\/)penso-render-envelope(?:\/|$)/i,
  /(?:^|\/)\.env(?:\.|$)/i,
  /(?:^|\/)\.npmrc$/i,
  /(?:^|\/)(?:secret|secrets)(?:\/|$)/i,
  /(?:^|\/)patent-claims?(?:\/|$)/i,
];

function dependencyEntries(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  return Object.entries(value).map(([name, spec]) => [name, String(spec)]);
}

function isPrivatePackageName(name) {
  return PRIVATE_PACKAGE_NAMES.has(name)
    || PRIVATE_PACKAGE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function lockPackageName(packagePath) {
  const marker = "node_modules/";
  const index = packagePath.lastIndexOf(marker);
  if (index === -1) {
    return null;
  }
  const suffix = packagePath.slice(index + marker.length);
  const parts = suffix.split("/");
  if (parts[0]?.startsWith("@") && parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0] || null;
}

export function findDependencyBoundaryViolations({ manifest, lockfile }) {
  const violations = [];

  checkManifestPolicy(manifest, violations);

  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, spec] of dependencyEntries(manifest[field])) {
      checkDependencyEntry({ source: `package.json ${field}`, name, spec, violations });
    }
  }

  const rootPackage = lockfile?.packages?.[""];
  if (rootPackage) {
    for (const field of DEPENDENCY_FIELDS) {
      for (const [name, spec] of dependencyEntries(rootPackage[field])) {
        checkDependencyEntry({ source: `package-lock.json root ${field}`, name, spec, violations });
      }
    }
  }

  for (const [packagePath, packageMeta] of Object.entries(lockfile?.packages || {})) {
    const name = lockPackageName(packagePath);
    if (name && isPrivatePackageName(name)) {
      violations.push(`${packagePath} uses private package name ${name}`);
    }

    if (packageMeta?.resolved) {
      checkSpec({
        source: `package-lock.json ${packagePath || "<root>"} resolved`,
        name: name || packageMeta.name || "<unknown>",
        spec: String(packageMeta.resolved),
        violations,
      });
    }

    for (const field of DEPENDENCY_FIELDS) {
      for (const [depName, spec] of dependencyEntries(packageMeta?.[field])) {
        checkDependencyEntry({
          source: `package-lock.json ${packagePath || "<root>"} ${field}`,
          name: depName,
          spec,
          violations,
        });
      }
    }
  }

  for (const [name, meta] of Object.entries(lockfile?.dependencies || {})) {
    if (isPrivatePackageName(name)) {
      violations.push(`package-lock.json dependencies uses private package name ${name}`);
    }
    if (meta?.version) {
      checkSpec({
        source: `package-lock.json dependencies ${name} version`,
        name,
        spec: String(meta.version),
        violations,
      });
    }
    if (meta?.resolved) {
      checkSpec({
        source: `package-lock.json dependencies ${name} resolved`,
        name,
        spec: String(meta.resolved),
        violations,
      });
    }
  }

  return violations;
}

export async function checkPublicPackageBoundary({
  rootDir = process.cwd(),
  runPackDryRun = true,
} = {}) {
  const manifestPath = path.join(rootDir, "package.json");
  const lockfilePath = path.join(rootDir, "package-lock.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const lockfile = JSON.parse(await readFile(lockfilePath, "utf8"));
  const violations = findDependencyBoundaryViolations({ manifest, lockfile });

  if (runPackDryRun) {
    violations.push(...checkPackDryRun(rootDir));
  }

  return { violations };
}

export function checkPackEntries(files) {
  const violations = [];
  for (const file of files) {
    const packPath = String(file.path || file);
    for (const pattern of PRIVATE_PACK_PATH_PATTERNS) {
      if (pattern.test(packPath)) {
        violations.push(`npm pack would include private-boundary file path ${packPath}`);
      }
    }
  }
  return violations;
}

function checkManifestPolicy(manifest, violations) {
  for (const scriptName of Object.keys(manifest.scripts || {})) {
    if (INSTALL_LIFECYCLE_SCRIPTS.has(scriptName)) {
      violations.push(`package.json scripts.${scriptName} is not allowed in the public package install path`);
    }
  }

  const registry = manifest.publishConfig?.registry;
  if (registry && !/^https:\/\/registry\.npmjs\.org\/?$/i.test(String(registry))) {
    violations.push(`package.json publishConfig.registry is not public npm: ${registry}`);
  }
}

function checkDependencyEntry({ source, name, spec, violations }) {
  if (isPrivatePackageName(name)) {
    violations.push(`${source} uses private package name ${name}`);
  }
  checkSpec({ source, name, spec, violations });
}

function checkSpec({ source, name, spec, violations }) {
  for (const { label, pattern } of PRIVATE_SPEC_PATTERNS) {
    if (pattern.test(spec)) {
      violations.push(`${source} ${name} uses ${label}: ${spec}`);
    }
  }
  if (/ resolved$/.test(source)
    && /^https?:\/\//i.test(spec)
    && !/^https:\/\/registry\.npmjs\.org\//i.test(spec)
  ) {
    violations.push(`${source} ${name} uses non-public-npm registry URL: ${spec}`);
  }
}

function checkPackDryRun(rootDir) {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: rootDir,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return [`npm pack --dry-run failed: ${result.stderr || result.stdout}`.trim()];
  }

  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    return [`npm pack --dry-run returned non-JSON output: ${error.message}`];
  }

  const files = parsed.flatMap((entry) => entry.files || []);
  return checkPackEntries(files);
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const { violations } = await checkPublicPackageBoundary();
  if (violations.length > 0) {
    console.error("Public package boundary check failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }
  console.log("Public package boundary check passed.");
}
