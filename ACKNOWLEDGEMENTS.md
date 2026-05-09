# Acknowledgements

Codex WebApp is an unofficial companion package for OpenAI
Codex `remote-control`. It is not affiliated with or endorsed by OpenAI.

## OpenAI Codex

This project is built around the direction opened by OpenAI Codex App Server
and `codex remote-control`.

- OpenAI Codex: https://github.com/openai/codex
- Codex App Server documentation:
  https://github.com/openai/codex/tree/main/codex-rs/app-server

## Prior Art And Adjacent Projects

The remote-Codex and mobile-agent ecosystem is moving quickly. The following
projects are useful adjacent references for users and maintainers evaluating the
space:

- codex-web by 0xcaff: https://github.com/0xcaff/codex-web
- RemCodex: https://remcodex.com/
- Taskdex: https://www.taskdex.app/
- Taskdex GitHub: https://github.com/DhruvalGolakiya/taskdex
- Remodex: https://github.com/Emanuele-web04/remodex
- codexUI: https://github.com/friuns2/codexui
- FlyDex: https://flydex.net/
- The Companion: https://docs.thecompanion.sh/
- MobileCLI: https://www.mobilecli.app/
- RemoteVibeCode: https://remotevibecode.com/
- Nitori Codex Webview:
  https://marketplace.visualstudio.com/items?itemName=Kaisei-Yasuzaki.nitori-codex-webview

Listing a project here is acknowledgement of prior art or adjacency, not a
claim that this package includes that project's code.

## codex-web

`0xcaff/codex-web` is a particularly important reference point for this package.
Its README describes a browser frontend for Codex Desktop running on a machine
the user controls, with a deliberately thin wrapper so upstream Codex changes can
be integrated quickly.

Codex WebApp follows that same spirit: stay thin, make the install path humane,
keep the operator's machine in control, and avoid pretending to be an official
OpenAI product.

## Code Provenance

This package is intended as a clean public companion module. Unless a future
file explicitly says otherwise, it does not vendor source code from the projects
listed above.
