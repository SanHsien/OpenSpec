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
- Retiring a capability no longer refuses a requirement statement or scenario line that starts with a tag-like word such as `<args>`; real HTML blocks are still named and refused (upstream #2266, issue #2211).
- A main spec created by archive has a blank line after `## Purpose`, so it passes Prettier and markdownlint MD022 as written (upstream #2267, issue #2260).
- Retirement now refuses a tag alone on its line (such as `<escrow-note>`) wherever it sits, including after a thematic break, a quote, an indented code line or a bullet that already ended its paragraph; the first port of upstream #2266 read those as continuing the sentence above and deleted them with the spec (upstream #2266 as merged).
- The update hint names `brew upgrade openspec` for a copy inside a Homebrew `Cellar/openspec` keg and points a `/nix/store` copy back to Nix, instead of telling either to run `npm install -g`; neither is offered a self-upgrade (upstream #2264, issue #2186).
- The archive workflow checks the archive target before any main spec is synced, again before a selected sync writes, and once more right before the move, so an existing `YYYY-MM-DD-<name>` folder no longer leaves main specs rewritten with the change unarchived (upstream #2277, issue #2276).
