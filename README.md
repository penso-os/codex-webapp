# Codex WebApp

[![CI](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml/badge.svg)](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/codex-webapp?label=npm)](https://www.npmjs.com/package/codex-webapp)
[![npm beta](https://img.shields.io/npm/v/codex-webapp/beta?label=beta)](https://www.npmjs.com/package/codex-webapp)
[![License](https://img.shields.io/npm/l/codex-webapp)](./LICENSE.md)

Open a Codex-style browser UI from Codex App.

Codex WebApp is a small, unofficial npm package that helps Codex App check your
local Codex install, start the browser surface, and verify that something useful
actually opened.

![Codex WebApp overview](./docs/assets/codex-webapp-overview.svg)

## Start From Codex App

Paste this into Codex App:

```text
Please set up Codex WebApp on this machine.

Use this npm package:
codex-webapp@beta

Please:
1. Check my Codex version.
2. Run the package doctor.
3. Run start in dry-run mode first.
4. Start the local browser UI on localhost.
5. Smoke-test the printed local URL.

Do not print tokens, cookies, private repo contents, customer data, or internal URLs.
```

Codex should run commands like:

```bash
npx -y codex-webapp@beta doctor
npx -y codex-webapp@beta start --dry-run
npx -y codex-webapp@beta start
```

`npx` means Codex runs the published package temporarily. You do not need to
create a project or install this package by hand.

## Use From A Terminal

```bash
npx -y codex-webapp@beta doctor
npx -y codex-webapp@beta start --dry-run
npx -y codex-webapp@beta start
```

By default the local UI opens at:

```text
http://127.0.0.1:8214/
```

Check the browser surface:

```bash
npx -y codex-webapp@beta smoke --url http://127.0.0.1:8214/
```

Capture browser evidence when needed:

```bash
npx -y codex-webapp@beta smoke \
  --browser \
  --url http://127.0.0.1:8214/ \
  --screenshot artifacts/codex-webapp.png
```

## What It Does

- checks that Codex CLI is installed
- checks that `codex remote-control --help` works
- starts a pinned Codex-style browser surface on localhost
- refuses non-loopback hosts unless explicitly allowed
- smoke-tests that the UI URL is reachable
- keeps the install path simple enough to paste into Codex App

Current runtime reference:

```text
github:0xcaff/codex-web#585613f5a3a355af5aefc388ca4e31b07a472cda
```

## Safety Notes

Codex WebApp is not affiliated with or endorsed by OpenAI.

Keep the raw UI server on `localhost` unless you have Tailscale, Cloudflare
Access, or an equivalent trusted access boundary. Do not expose it directly on a
public IP.

Codex WebApp does not include telemetry, analytics, or a project-operated
phone-home path. It does not install a browser extension and does not store
browser tokens in extension storage.

## Languages

- English: this README
- Japanese: [README.ja.md](./README.ja.md)
- Korean: [docs/i18n/README.ko.md](./docs/i18n/README.ko.md)
- Simplified Chinese: [docs/i18n/README.zh-CN.md](./docs/i18n/README.zh-CN.md)

## Development

```bash
npm test
npm pack --dry-run
npm run start:dry-run
```

## Support

Open an issue with your OS, Node version, Codex version, the command you ran,
and redacted output from `doctor`, `start`, or `smoke`.

Do not paste tokens, cookies, private repository contents, customer data, or
internal URLs into a public issue.

See [SECURITY.md](./SECURITY.md), [SUPPORT.md](./SUPPORT.md), and
[ACKNOWLEDGEMENTS.md](./ACKNOWLEDGEMENTS.md).

## License

[Apache-2.0](./LICENSE.md)
