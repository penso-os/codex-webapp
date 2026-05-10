# Codex WebApp Distribution Boundary Decision

Status: accepted for PAN-1596.

## Decision

Codex WebApp remains a public-install-independent npm package. `npx codex-webapp` must work from the public npm registry without GitHub credentials, private package registry credentials, or access to a private engine repository.

The package will not depend on `penso-render-envelope` or any other private engine package at runtime. The public package owns only the local Codex App renderer bridge, public docs, and public-safe checks needed to start and smoke-test the installed Codex App renderer.

Future integration with private rendering work requires a new approval step and one of these public-safe paths:

- a generated subset that contains only reviewed public-safe code and metadata
- a separately licensed package that can be installed from a public or approved registry without private repository credentials

An adapter or interface boundary is preferred over transforming private implementation into public code. A generated subset is allowed only after review because comments, metadata, control flow, or test fixtures can still reveal private engine mechanics even when direct secrets are removed.

## Rejected Options

- Direct private GitHub dependency in `package.json` or `package-lock.json`: rejected because public `npx` installs would require private credentials and would fail for normal npm users.
- Runtime fetch from a private repository or private package registry: rejected because it turns first run into an authentication-dependent install path and can expose private infrastructure assumptions.
- Vendoring private engine internals into this public package: rejected because it risks publishing private implementation detail and changes the licensing and IP surface without approval.
- Embedding patent claim text or private engine design notes in public docs: rejected because the package only needs the distribution boundary, not protected claim language or private internals.

## License And IP Notes

This repository is public and distributed under its existing Apache-2.0 license. That license should apply only to the public code and docs intentionally shipped here. Private engine code, generated artifacts, or separately licensed packages need an explicit approval and compatibility review before being added to this package or its runtime path.

This note is an engineering distribution decision, not legal advice. It avoids making ownership, patent scope, or licensing conclusions beyond the public package boundary.

## Guardrail

`npm test` includes a public package boundary guard. The guard fails if `package.json`, `package-lock.json`, or the `npm pack --dry-run --json` file list shows private package names, GitHub dependency specs, private registry URLs, local `file:` or `link:` dependency specs, workspace dependency specs, install lifecycle scripts, non-public npm `publishConfig.registry`, or private-boundary pack paths such as `.npmrc`, `.env`, secrets directories, or a bundled private engine directory.

The guard intentionally checks dependency and package contents paths rather than every word in docs. Public documentation may name the boundary and the private package to explain what is not included, but package code should not dynamically import or fetch it, and docs must not expose private engine internals or patent claim text.

Counterproof review for this decision specifically called out dependency confusion, lockfile `resolved` URL leakage, `optionalDependencies`, install lifecycle scripts, and IP bleed from generated subsets. The accepted follow-up was to keep all dependency collections under the guard, add install lifecycle and private registry checks, and document adapter-first future integration.
