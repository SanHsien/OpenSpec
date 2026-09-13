# NOTICE

OpenSpec
Copyright (c) 2024 OpenSpec Contributors

This product includes software developed by the OpenSpec project
(https://github.com/Fission-AI/OpenSpec), licensed under the MIT License.

---

本儲存庫為 `SanHsien` 維護之 OpenSpec 維護型 Fork（Maintenance Fork）。
原始專案：https://github.com/Fission-AI/OpenSpec
維護專案：https://github.com/SanHsien/OpenSpec

## 維護性變更摘要

1. **Windows 11 原生環境適配**：建立專屬 Windows 開發門禁、路徑與檔案系統相容性測試。
2. **多語言與文件體系**：提供繁體中文主入口說明（`README.md`），原始英文保留於 `README.en.md`。
3. **維護骨架與自動化**：
   - 增加 `FORK.md`、`AGENTS.md`、`CLAUDE.md`、`GEMINI.md`、`REVIEW.md`。
   - 增加 `docs/DEVELOPMENT.md`、`docs/DECISIONS.md`、`docs/UPSTREAM.md`。
   - 增加 `tools/dev_check.ps1`、`tools/bootstrap_dev.ps1`、`tools/check_links.py`、`tools/check_upstream_updates.py`、`tools/check_dependency_freshness.py`、`tools/upstream_baseline.json`。
   - 增加 `test/fork-hygiene.test.ts` 契約測試。
   - 增加 `.cursor/rules/no-upstream-pr.mdc` 防止誤發上游 PR 之機械防線。
4. **工作流硬化**：所有對外工作流程均限制於本儲存庫範圍內，避免未經授權之跨儲存庫觸發。