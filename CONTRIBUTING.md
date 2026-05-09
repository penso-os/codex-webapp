# Contributing

Thanks for helping make Codex remote-control easier to use.

This project aims to be unusually kind to first-time users: clear errors,
copy-pasteable commands, mobile-friendly UI, and conservative security
defaults.

## Good First Contributions

- Improve the `doctor` output for a confusing install state.
- Add tests for Codex CLI version parsing.
- Improve mobile layout without adding visual noise.
- Document a real failure mode and the fix.
- Improve the browser smoke test so users can verify the console actually
  renders on their machine.
- Add safer defaults for local or trusted-network operation.

## Ground Rules

- Do not imply OpenAI endorsement.
- Do not add telemetry without explicit opt-in.
- Do not expose raw app-server endpoints publicly by default.
- Do not add commercial upgrade UI, hidden private hooks, or paid-feature
  conditionals to the public module.
- Do not log secrets, prompts, repository contents, cookies, tokens, or session
  IDs.
- Keep private operations features out of the public module.

## Pull Request Checklist

- README or help text updated when behavior changes.
- Security boundary preserved.
- `npm run doctor` or the equivalent local command exercised.
- Browser smoke exercised when UI behavior changes.
- UI changes checked on a mobile-width viewport.
- New dependencies justified in the PR body.
