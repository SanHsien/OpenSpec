---
"@fission-ai/openspec": patch
---

Read a task that wraps onto several lines in tasks.md as one task. `openspec instructions apply` used to cut a wrapped task off at its first line break; it now returns the full text, including lines continued with a trailing `\`.

Count task lines written with `+`, `1.`/`1)` list markers or an unrecognised checkbox marker such as `[~]` as unfinished tasks, so `openspec archive` no longer reports "Complete" over them.
