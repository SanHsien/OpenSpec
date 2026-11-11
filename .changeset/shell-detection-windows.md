---
"@fission-ai/openspec": patch
---

### Bug Fixes

- `openspec completion` recognises Windows shell paths such as Git Bash's `SHELL=/bin/bash.exe`.
- On Windows `openspec completion install` no longer guesses PowerShell from the machine-level `PSModulePath` (cmd.exe has it too, so cmd.exe users had their PowerShell profile rewritten); without `$SHELL` it asks for an explicit shell argument.
