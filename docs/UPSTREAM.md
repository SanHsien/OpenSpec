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

## 最近一次審查

- **日期**：2026-10-30
- **Commit 水位**：`6d04a1b58dedc95729d34e4f223d9d483aae210a`
- **PR 水位**：`#2172`
- **Issue 水位**：`#2173`
- **處置**：逐筆結論記於 `docs/DECISIONS.md`（2026-10-26 節）。採用 vitest／vite／launch-editor 安全升級、Actions SHA 更新，以及 #2108、#2120、#2086、#2104、#2131、#2133、#2127、issue #2145 的修正做法；#2083／#2114／#2119 因缺陷在本 fork 不存在而跳過；symlink、update 重構、standalone binaries、beta skills 等產品面延後並寫明重訪條件。
- **補審（2026-10-28）**：上游 PR #2158–#2161 逐筆結論記於 `docs/DECISIONS.md`（2026-10-28 節）。#2158 跳過（本 fork 的 vite 7.3.7 不受該 GHSA 影響）、#2159 延後（Node 20 下限屬維護者決定）、#2160／#2161 不適用（standalone 安裝器與上游網域的 Worker 路由，本 fork 沒有）；同時對已採用的 #2131／#2133／#2127 因 head 漂移補上 5 個回歸測試。
- **補審（2026-10-30）**：PR #2168–#2172 與 issue #2163–#2167、#2173 全部逐筆 defer，理由、head／狀態與重看條件見 [裁決記錄](DECISIONS.md#2026-10-30補審上游-5-筆-pr-與-6-筆-issue)。commit 水位不變，沒有採用產品變更。PR 以 baseline 的 `monitored` 追蹤 head／狀態漂移；issue 依 [ROADMAP](../ROADMAP.md) 的後續項目於每週審查時人工重看。closed 的 #2169／#2164 不等於本 fork 沒有寫入防護缺口。

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
