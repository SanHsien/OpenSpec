---
"@fission-ai/openspec": patch
---

### Bug Fixes

- `openspec completion` recognises Windows shell paths such as Git Bash's `SHELL=/bin/bash.exe`.
- On Windows `openspec completion install` no longer guesses PowerShell from the machine-level `PSModulePath` (cmd.exe has it too, so cmd.exe users had their PowerShell profile rewritten); without `$SHELL` it asks for an explicit shell argument.
- `openspec update`/`init` remember a SHA-256 of every command file they write (`openspec/.generated-commands.json`), so an unedited file from an older template is still removed when delivery drops commands; files OpenSpec cannot vouch for are kept with a warning that says so. A file saved between the check and the delete is kept, and a path that escapes the project no longer aborts the whole batch.
