# 上游追蹤與同步指南 (Upstream Tracking Guide)

本文件說明如何安全追蹤與審查 `Fission-AI/OpenSpec` 上游專案的演進。

## Remote 配置

本儲存庫應具備兩個 Git remote：

```powershell
origin    https://github.com/SanHsien/OpenSpec.git (fetch & push)
upstream  https://github.com/Fission-AI/OpenSpec.git (fetch & push)
```

> **注意**：絕不可向 `upstream` 執行 `git push`。

## 追蹤檢查流程

本 fork 採三軸水位追蹤：Commit、Pull Request、Issue。

1. **抓取上游最新變更**：
   ```powershell
   git fetch upstream main
   ```

2. **執行上游追蹤檢查器**：
   ```powershell
   python tools/check_upstream_updates.py --strict
   ```

3. **產出審查報告**：
   若有新項目，檢查器將產出 `upstream-review-report.md`，列出高於目前水位的 Commit、PR 與 Issue。

4. **審查與決策**：
   - 逐筆確認是否影響 Windows 原生環境或本 fork 專屬維護骨架。
   - 經測試驗證後，於 `docs/DECISIONS.md` 記錄採用或跳過之理由。
   - 更新 `tools/upstream_baseline.json` 中的水位數字。

## 基線檔案結構 (`tools/upstream_baseline.json`)

```json
{
  "repo": "https://github.com/Fission-AI/OpenSpec.git",
  "branch": "main",
  "reviewed_through": "9d4e5974e5c0d9a09b9c6c1e1eb0975e80ec4461",
  "reviewed_date": "2026-09-12",
  "reviewed_pr_through": 1852,
  "reviewed_issue_through": 1853
}
```