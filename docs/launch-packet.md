# Launch Packet

This packet is for a public launch of Codex WebApp. Keep the tone simple, practical, and friendly. The project should be described as an unofficial local companion UI for Codex App users, not as an official OpenAI product or as a security product.

Do not claim that the project is official, endorsed, first, fully safe, or complete protection. Do not include patent-sensitive implementation details. Point technical readers to the README, architecture notes, and clean release checks instead.

Local-first means this package starts from the user's own Mac and local Codex App installation. It is not a complete privacy guarantee: Codex itself still operates under the user's Codex/OpenAI configuration and terms, and users must still redact sensitive logs, screenshots, prompts, and workspace details before posting publicly.

## X Launch Thread

Post 1:

```text
Codex is powerful, but waiting in front of your desktop is not.

I made Codex WebApp: an unofficial local companion UI that lets Codex App users watch from another screen while their project stays on the computer doing the work.

npx -y codex-webapp doctor
npx -y codex-webapp start

Not affiliated with or endorsed by OpenAI.
```

Post 2:

```text
The everyday use case is simple:

Codex is running a task on your Mac, and you want to check in from a browser or phone-sized screen without moving your project into a hosted dashboard.

By default it serves on localhost: http://127.0.0.1:8214/
```

Post 3:

```text
The setup path is meant to be readable:

1. doctor checks local prerequisites
2. start --dry-run previews the local URL
3. start runs the local browser surface
4. smoke gives you a repeatable check

If a check fails, fix that before starting.
```

Post 4:

```text
Important boundary:

Do not expose the raw UI server directly to the public internet.

For phone or remote access, use a trusted access boundary such as Tailscale, Cloudflare Access, WireGuard, SSH tunneling, or equivalent access control you understand.
```

Post 5:

```text
What it does not include:

- Codex App or OpenAI binaries
- app.asar or extracted webview files
- tokens, cookies, private keys, or session databases
- telemetry or a project-operated phone-home path

It prepares the local renderer at runtime from your installed Codex App.
```

Post 6:

```text
If you try it, I would like to see your setup:

- Mac and Node version
- Codex CLI version
- whether doctor/start/smoke passed
- redacted screenshot if you are comfortable sharing one

Please do not post tokens, cookies, private repo contents, customer data, or internal URLs.
```

## OpenAI Release Thread Reply Draft

Use this only as a reply when it is relevant and welcome. Keep it short and do not imply endorsement.

```text
I built a small unofficial companion package for Codex App users who want to watch a local Codex session from another browser surface:

https://github.com/penso-os/codex-webapp

It is local-first by default, serves on 127.0.0.1, and is not affiliated with or endorsed by OpenAI. Feedback from Codex App users is welcome.
```

## Kaito / Non-Engineer Japanese Codex App Prompt

This prompt is for a non-engineer who already has Codex App and Codex CLI installed on a Mac. It asks Codex to run checks first and to stop if something looks wrong.

```text
Codex WebApp をこの Mac で起動したいです。
私はエンジニアではないので、難しいところは短く説明しながら進めてください。

これは Codex App ユーザー向けの非公式ローカル companion UI です。
OpenAI 公式の機能として扱わないでください。

安全のため、token、cookie、private repository の中身、顧客データ、内部URL、`.env`、SECRET、KEY、TOKEN を含む内容は表示しないでください。

次の順番でお願いします。

1. `node -v`、`npm -v`、`npx -v` を確認してください。
2. `npx -y codex-webapp@latest doctor` を実行してください。
3. doctor が失敗したら、そこで止めて、原因と次に何をすればよいかを日本語で説明してください。
4. `npx -y codex-webapp@latest start --dry-run` を実行してください。
5. 問題なければ `npx -y codex-webapp@latest start` を実行してください。
6. 起動できたら、ブラウザで `http://127.0.0.1:8214/` を開くように案内してください。
7. `Ctrl+C` を押すか terminal window を閉じると止まること、Mac を再起動した後はもう一度 start が必要なことを説明してください。

スマホや外出先PCから使う場合は、raw UI server を public IP へ直接公開しないでください。Tailscale、Cloudflare Access、WireGuard、SSH tunneling、または同等の信頼できるアクセス境界が必要です。
```

## Repo Settings Checklist

Use this checklist before or during launch.

- Description: `Unofficial local companion UI for Codex App users. Watch Codex work from another screen while your project stays on your computer.`
- Website: npm package URL or the repository URL, whichever is more useful at launch.
- Topics: `codex`, `codex-app`, `openai-codex`, `local-first`, `developer-tools`, `macos`, `nodejs`, `cli`, `remote-control`.
- Social preview: upload `docs/assets/codex-webapp-social-preview.svg` or a reviewed raster export generated from it.
- Pinned links: README, Launch Assets, Clean Release Verification, Security, Support.
- Branch protection: require CI before merge if repository settings allow it.
- Issue templates: keep bug reports and setup showcases visible.
- Discussions: enable only if there is capacity to triage; otherwise route to issues first.

## Show Your Setup Funnel

Goal: collect useful feedback without encouraging people to paste private material.

Preferred path:

1. User tries the README quick start.
2. If it works, user opens a "Show your setup" issue or discussion.
3. User includes OS, Node version, Codex CLI version, commands that passed, and a short note about the access boundary they used.
4. User may attach a screenshot only after reviewing it for secrets and private work.
5. Maintainers label it `showcase` and optionally `docs-feedback`, `support`, or `networking`.

Use the GitHub issue template at `.github/ISSUE_TEMPLATE/setup-showcase.yml` for repositories that use issues as the main intake channel. If GitHub Discussions are enabled, create a "Show your setup" category and put the same privacy guidance in the category description.

Public guidance:

```text
Show your setup: what Mac, Node, Codex CLI, and access boundary did you use?

Please redact before posting. Do not include tokens, cookies, private repository contents, customer data, private prompts, internal URLs, `.env` values, or screenshots that expose sensitive work.
Confirm that you reviewed logs and screenshots manually before sharing.
```

## Support Triage Guidance

Start with the first failed step. Do not ask for broad logs when a smaller redacted output is enough.

| First failed step | Ask for | Likely next action |
| --- | --- | --- |
| Install or `npx` | OS, shell, Node, npm, exact command, redacted error | Confirm Node version and package manager behavior. |
| `doctor` | Redacted `doctor` output and `codex --version` | Fix Codex CLI, Codex App path, or version mismatch before start. |
| `start --dry-run` | Redacted output and intended host/port | Check host, port, environment variables, and local paths. |
| `start` | Redacted output, whether the process stays running, local URL | Check port conflict, local renderer prep, and Codex App availability. |
| Browser open | Browser, URL, screenshot only if redacted | Confirm `127.0.0.1` vs remote device behavior. |
| Phone or remote access | Access boundary used, local URL, remote URL shape without secrets | Remind users not to expose the raw UI server directly to a public IP. |
| `smoke` | Redacted smoke command and output | Separate server response issues from browser rendering issues. |

Triage rules:

- Keep users on the documented quick start until the first failure is clear.
- Ask for redacted command output, not screenshots, unless layout or browser behavior matters.
- Require explicit confirmation that logs and screenshots were manually reviewed before public sharing.
- Remove or edit comments that expose credentials, session IDs, private repository contents, customer data, internal URLs, or private prompts.
- Do not debug private workspace contents in public issues.
- Do not describe private Codex App internals beyond the public adapter boundary in the README and architecture docs.
- If a report looks security-sensitive, move it to the security policy path instead of continuing in public.
- Close resolved support issues with the command that fixed the problem, so future readers can scan the answer.
