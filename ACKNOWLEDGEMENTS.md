# Acknowledgements

Codex WebApp is an unofficial companion package for OpenAI Codex
`remote-control`. It is not affiliated with or endorsed by OpenAI.

## OpenAI Codex

This project is built around the direction opened by OpenAI Codex App Server
and `codex remote-control`.

- OpenAI Codex: https://github.com/openai/codex
- Codex App Server documentation:
  https://github.com/openai/codex/tree/main/codex-rs/app-server

## Code Provenance

Codex WebApp ships its own local browser surface, install checks, safety guard,
and smoke-test workflow. It is intended as a clean public package for Codex App
users who want a local-first browser entry point.

## Related Work

The 0xcaff/codex-web project helped clarify the value of keeping the browser
surface close to the installed Codex renderer instead of rebuilding a separate
chat UI. Codex WebApp does not vendor, bundle, or depend on that project at
runtime.
