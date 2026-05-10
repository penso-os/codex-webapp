# Clean Release Verification

Status: release operator checklist for public Codex WebApp package readiness.

This gate gives release operators a repeatable public-repo check before publishing or handing off a release candidate. It is bounded evidence, not a guarantee of release safety.

## Command

From a clean checkout of this public repo:

```bash
npm ci
npm run verify:clean-release
```

The command runs:

- `npm test`
- `npm run check:public-boundary`
- `npm pack --dry-run`
- `npm run start:dry-run` when the package exposes that script

It also inspects package metadata, the dry-run pack file list, and source-tree paths for private engine package names, bundled Codex App artifacts, pre-extracted renderer payloads, credential-looking paths, session database-looking paths, customer-data-looking paths, and private dependency specs.

The path scan intentionally allows public docs to name excluded artifacts so the boundary remains explainable. Do not add private implementation notes, patent-sensitive details, secrets, binary fixtures, `app.asar`, extracted renderer files, screenshots, private repo content, or private package dependencies to this repository.

## Optional Private Engine Check

If the private engine repository is available locally, include it without making this public package depend on it:

```bash
npm run verify:clean-release -- --private-engine-dir /private/tmp/penso-render-envelope
```

The same path can be provided with:

```bash
PENSO_RENDER_ENVELOPE_DIR=/private/tmp/penso-render-envelope npm run verify:clean-release
```

When the private repo path is absent, the gate reports a `SKIP` for private engine checks and still verifies the public package. That skip is expected for public contributors and clean npm install environments.

The optional private check runs only the private repo's `npm test` and `npm pack --dry-run`. It does not copy private files into this repo or add a package dependency.

## Empty Directory Package Check

For a clean install-style proof, create a temporary directory outside this repo and install from the dry-run tarball or current public npm package:

```bash
tmpdir="$(mktemp -d)"
npm pack --pack-destination "$tmpdir"
cd "$tmpdir"
npm init -y
npm install ./codex-webapp-*.tgz
npx codex-webapp start --dry-run
```

For the already-published package, use:

```bash
tmpdir="$(mktemp -d)"
cd "$tmpdir"
npm init -y
npx -y codex-webapp@latest doctor
npx -y codex-webapp@latest start --dry-run
```

Keep outputs redacted. Do not attach credentials, local app archives, extracted renderer files, private repo listings, or user data.

## Local Browser Smoke Evidence

On a Mac with Codex App installed, release evidence may include a local browser smoke run:

```bash
npx -y codex-webapp start
npx -y codex-webapp smoke --browser --url http://127.0.0.1:8214/
```

Screenshots are optional and should be attached only after review for tokens, cookies, prompts, private repository contents, customer data, internal URLs, or other sensitive material.

## Evidence To Attach

Attach concise, redacted evidence:

- commit hash and branch
- `npm ci`
- `npm test`
- `npm run check:public-boundary`
- `npm run verify:clean-release`
- optional private engine check result or the explicit `SKIP`
- `npm pack --dry-run`
- empty-directory install or public `npx` dry-run proof when performed
- local Codex.app browser smoke result when performed

The evidence should show whether each check passed, failed, or was skipped. Avoid claiming complete detection or absolute protection.
