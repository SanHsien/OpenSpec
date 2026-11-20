---
"@fission-ai/openspec": patch
---

### Bug Fixes

- `openspec update` reports up to date again after it kept a command file you edited. A kept file (edited, symlink, unverifiable) is no longer counted as profile/delivery drift, so update stops re-running config sync, re-printing the same warning, and rewriting that tool's skills on every run.
- A config sync (no version change, no `--force`) no longer overwrites a `SKILL.md` you edited; it keeps the file and names it. Version upgrades and `--force` still regenerate every skill.
- The bulk-archive workflow checks each change's archive target before syncing any of its main specs, again right before that change's sync, and once more right before the move, so an existing `YYYY-MM-DD-<name>` folder no longer leaves main specs rewritten with the change unarchived (same class as upstream issue #2276).
- Every command that shows a spinner (status, instructions, new change, templates, init, update, schema, completion) no longer hangs on a terminal that reports zero columns; the spinner falls back to plain lines, as `validate` already did.
