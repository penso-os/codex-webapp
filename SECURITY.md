# Security Policy

Codex WebApp is a local-first companion UI. Treat Codex remote-control
as a powerful local execution surface.

Remote use requires Tailscale, Cloudflare Access, or an equivalent trusted
access boundary. Exposing a raw app-server on a public IP can give another
person practical control over your local development machine.

The bundled UI server is static and localhost-first. It binds to `127.0.0.1` by
default and refuses non-loopback hosts unless the operator passes
`--allow-non-loopback`. That flag is not an authentication layer; it only records
that the operator has intentionally moved the server outside loopback and must
already have a trusted boundary.

## Supported Surface

This public package candidate supports:

- local Codex CLI readiness checks
- local `codex remote-control` startup
- browser/mobile UI scaffolding
- trusted-network operation behind localhost, Tailscale, Cloudflare Access, or
  an equivalent private access boundary

## Not Supported

Do not use this package to:

- expose a raw app-server to the public internet
- bypass Codex approval or sandbox policy
- store tokens, cookies, session IDs, private keys, or customer data
- represent the tool as an official OpenAI product
- turn a completed Codex turn into a deployment or release approval

## Reporting

Please report security issues privately to the maintainer before opening a
public issue. Public reports should avoid logs, screenshots, URLs, or examples
that include secrets, internal repository names, customer data, or private
network details.

## Safe Defaults

The public module should fail closed when:

- Codex CLI is missing
- Codex CLI is older than `0.130.0`
- `codex remote-control --help` fails
- no trusted access boundary is configured for remote use
- the UI server is asked to bind to a non-loopback host without explicit
  operator override
- unknown app-server events cannot be safely classified

Maintainers and contributors are not responsible for damage caused by exposing the
server without a VPN, trusted proxy, or equivalent access control.
