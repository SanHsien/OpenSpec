---
"@fission-ai/openspec": patch
---

Upgrade `glob` to 14 and pin `minimatch` to 11.0.1 or newer, which fixes GHSA-g3hv-75wg-m249 (minimatch DoS). Artifact output patterns still reject every unsafe brace alternative, such as `{safe,../outside}/**/*.md`, before any directory is read.
