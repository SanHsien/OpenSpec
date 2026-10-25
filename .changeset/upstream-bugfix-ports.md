---
"@fission-ai/openspec": patch
---

### Bug Fixes

- `openspec validate` no longer hangs on a zero-width TTY (the spinner is skipped when nothing can be drawn, and `OPEN_SPEC_INTERACTIVE=0` / `CI` disable it too); ora is now loaded only when a spinner is shown.
- `openspec new change` names the schema the change actually gets (from `--schema`, then `config.yaml`, then the default) in its progress line.
- The explore workflow's capture table and example offers are scoped to the default spec-driven schema.
- The propose, ff-change, continue-change and explore workflows keep a concrete path chosen for a glob artifact inside the change directory (symlinks resolved) before anything is written or delegated.
- The markdown parser no longer opens a code fence on a backtick line whose info string contains a backtick (for example a line starting with triple-backtick inline code), which hid every requirement after it.
- The main-spec structure check reads `###Requirement:` (no space) the same way the requirement reader does.
- `openspec validate` exits 1 when `openspec/config.yaml` is not valid YAML instead of passing while every rule in it is ignored.
- `## Purpose ##`, `## Why ##`, `## What Changes ##` and `## Requirements ##` (CommonMark closing run) are read like their unclosed forms.
