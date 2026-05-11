# Launch Assets

These lightweight source assets support a public launch without committing binary video or private capture material. They do not use the PENSO logo and must not be presented as official OpenAI material.

## Files

| File | Use |
| --- | --- |
| [`assets/codex-webapp-social-preview.svg`](./assets/codex-webapp-social-preview.svg) | 1280x640 English social preview for X, cards, and changelog links. |
| [`assets/codex-webapp-social-preview-ja.svg`](./assets/codex-webapp-social-preview-ja.svg) | 1280x640 Japanese social preview for Japanese launch posts. |
| [`assets/codex-webapp-readme-hero.svg`](./assets/codex-webapp-readme-hero.svg) | README hero image for the first screen of the repository. |
| [`assets/codex-webapp-overview.svg`](./assets/codex-webapp-overview.svg) | Existing architecture-style overview image. |
| [`assets/codex-webapp-mobile.svg`](./assets/codex-webapp-mobile.svg) | Existing mobile and trusted-access concept image. |

All files above are source assets intended to be distributed with this repository under the repository's Apache-2.0 license. They contain no Codex App binaries, OpenAI binaries, private session data, tokens, cookies, customer data, or captured user workspace content.

## 15s X Storyboard

| Time | Visual | Caption |
| --- | --- | --- |
| 0-3s | Social preview title frame. | "Codex WebApp: watch Codex work from another screen." |
| 3-6s | Terminal runs `npx -y codex-webapp doctor`. | "Check local prerequisites first." |
| 6-9s | Terminal runs `npx -y codex-webapp start --dry-run`, then `start`. | "Start the local browser surface." |
| 9-12s | Browser opens `http://127.0.0.1:8214/`. | "Default binding is localhost." |
| 12-15s | Phone concept with trusted boundary label. | "For phone access, use Tailscale, Cloudflare Access, WireGuard, SSH tunnel, or equivalent access control." |

Suggested post copy:

```text
Codex WebApp is an unofficial local companion UI for Codex App users.

Watch Codex work from another screen while your project stays on your computer.

npx -y codex-webapp doctor
npx -y codex-webapp start

Not affiliated with or endorsed by OpenAI.
```

## 45s README Demo Storyboard

| Time | Visual | Voiceover or Caption |
| --- | --- | --- |
| 0-5s | README hero and badges. | "This is Codex WebApp, an unofficial local companion UI for Codex App users." |
| 5-10s | Highlight the Codex App prompt block. | "Paste the quick-start prompt into Codex App when you want Codex to start the browser surface for you." |
| 10-18s | Terminal shows `node -v`, `npm -v`, `npx -v`, and `doctor`. | "The setup path checks local tools before starting anything." |
| 18-26s | Terminal shows `start --dry-run`, then `start`. | "The adapter prepares the installed Codex App renderer on your machine and serves it locally." |
| 26-33s | Browser opens the localhost URL. | "Open the local URL while the command is running." |
| 33-39s | Smoke command and screenshot evidence path. | "Use smoke checks for repeatable release evidence." |
| 39-45s | Network model section and mobile concept image. | "Do not expose the raw UI server directly. Use a trusted access boundary for phone or remote access." |

## 2min Walkthrough Outline

1. Introduce the use case: checking in on a running Codex task from another screen while the workspace remains on the local computer.
2. State the boundary: unofficial project, not affiliated with or endorsed by OpenAI, and not a security guarantee.
3. Show requirements: macOS Codex App, Codex CLI, Node.js, and the npm package.
4. Run `npx -y codex-webapp doctor` and explain that failures should be fixed before starting.
5. Run `npx -y codex-webapp start --dry-run` to preview the local URL.
6. Run `npx -y codex-webapp start` and open `http://127.0.0.1:8214/`.
7. Run `npx -y codex-webapp smoke --url http://127.0.0.1:8214/`.
8. Explain stop behavior: `Ctrl+C`, terminal close, sleep interruption, or restart stops the page.
9. Explain the network model: localhost by default, explicit non-loopback opt-in, and trusted access boundary for phone access.
10. Close with support guidance: redact output before filing issues and never share tokens, cookies, private repository contents, customer data, or internal URLs.

## Capture Checklist

- Use a clean demo repository with no customer code, private prompts, private issue titles, internal URLs, or confidential filenames.
- Use a throwaway terminal profile with large readable type and no shell prompt secrets.
- Clear browser history suggestions, extension badges, bookmarks bar, and downloaded-file notifications before recording.
- Record only the local commands needed for the demo: `doctor`, `start --dry-run`, `start`, and `smoke`.
- Keep the URL on `127.0.0.1` unless explicitly demonstrating a trusted access boundary.
- Do not capture package manager auth, npm tokens, environment variables, cookies, signed URLs, private keys, or `.env` files.
- Prefer SVG source assets for static launch cards. If raster exports are needed, generate them from these SVG files during release preparation and review the result before posting.
- Keep exported screenshots or videos out of the repository unless a separate release task explicitly approves binary artifacts.

## Safety Redaction Checklist

- No tokens, cookies, private keys, signed URLs, auth headers, session IDs, or API keys.
- No `.env` values or strings containing `SECRET`, `KEY`, `TOKEN`, `PASSWORD`, or similar credentials.
- No private repository contents, customer data, proprietary prompts, private issue titles, internal URLs, or unreleased roadmap details.
- No Codex App binaries, OpenAI binaries, `app.asar`, extracted `webview/`, private session databases, or generated renderer cache.
- No implication that this project is official, affiliated with OpenAI, endorsed by OpenAI, or endorsed by any third party.
- No PENSO logo or altered PENSO brand mark in launch screenshots or static assets.
- Confirm public wording is license-consistent: the repository and source launch assets are Apache-2.0 licensed, provided as-is, and subject to the license in [`LICENSE.md`](../LICENSE.md).
