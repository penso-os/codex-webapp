# Support

Codex WebApp is a local-first companion UI. Start with the checks below before
opening an issue.

Before asking for help:

```bash
npx codex-webapp doctor
npx codex-webapp start --dry-run
npx codex-webapp smoke --url http://127.0.0.1:8214/
```

When reporting an issue, include:

- OS and shell
- Node.js version
- Codex CLI version
- command output from `doctor`
- whether the Codex-style browser UI opened locally

Do not include:

- API keys
- OAuth tokens
- cookies
- session IDs
- private repository names or contents
- customer data
- private network URLs

Security issues should be reported privately first. Public issues should use
redacted logs only.

## Failure Matrix

| Symptom | First check | What to tell a non-engineer |
|---|---|---|
| Codex is missing | `codex --version` | Codex is not installed on this machine yet. Ask Codex App to explain the update command before continuing. |
| Codex is too old | `codex --version` | `remote-control` needs Codex `0.130.0` or newer. Update Codex, then rerun `doctor`. |
| `remote-control` is unavailable | `codex remote-control --help` | Codex is installed, but this build does not expose the remote-control command. Update Codex and retry. |
| Package is unavailable | `npx codex-webapp doctor` | The package may not be public on npm yet. Check npm package status or test from a local tarball during validation. |
| Port is busy | `start --dry-run` or `start` output | Change the local port with `--port <port>` and retry. |
| UI does not open | `smoke --url <printed-url>` | The server may not be running or the wrong URL was opened. Smoke-test the exact printed URL. |
| Browser/mobile cannot reach it | trusted access boundary | Keep localhost local. For phone or another PC, set up Tailscale, Cloudflare Access, or an equivalent private boundary first. |
| Smoke fails | `smoke` output | Capture the first failed step and stop. Do not keep retrying with private URLs or secrets in the transcript. |

## Codex App Diagnosis Prompt

```text
Please diagnose this Codex WebApp setup failure.

Do not print tokens, cookies, private repo contents, customer data, or internal URLs.
Use only redacted command output.

Check in this order:
1. Codex version.
2. Whether `codex remote-control --help` works.
3. `npx codex-webapp doctor`.
4. `npx codex-webapp start --dry-run`.
5. Smoke test against the exact URL printed by start.

Tell me the first failed step, likely cause, and the next safe action.
```
