# Fork 維護說明

本 repo fork 自 [`Fission-AI/OpenSpec`](https://github.com/Fission-AI/OpenSpec)，
沿用 MIT License 與完整 Git 歷史。

## 為什麼維護 fork

- 保留原作者群持續演進的規範驅動開發（SDD, Spec-Driven Development）核心 CLI 與各 AI 代理工具適配（Claude Code、Cursor、Codex、Windsurf、Devin、Kimi 等）。
- 採 Windows-first 維護：Windows 11 + PowerShell 是主要開發、除錯與完整驗收環境，持續硬化 Windows 原生路徑與端對端相容性。
- 公開入口改以繁體中文為主，英文鏡像放 `README.en.md`。
- 建立可重現的 Windows 開發 gate、維護契約測試，以及逐筆審查的上游追蹤（涵蓋 commit、PR 與 issue 水位）。
- 不發佈第三方 npm 套件取代官方管道，本 fork 專注於高可靠的本機與團隊實踐。

**回貢判準：修的是上游的通用 bug 就送回去；這裡獨創的文件／Windows 維護骨架留在這裡。**
回貢前必須在當次對話取得維護者明確同意；「fork」「建開發環境」「開 PR」都不是同意。

## 與上游的差異

| 項目 | 說明 |
|---|---|
| `README.md` | 繁中主檔；上游英文移到 `README.en.md` |
| `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` | 本 fork 的 AI 維護單一真相源 |
| `NOTICE.md` / `FORK.md` | 來源、授權與同步說明 |
| `tools/dev_check.ps1` | Windows 本機一鍵門禁（格式檢查、依賴檢查、契約測試、Markdown 連結檢查） |
| `tools/bootstrap_dev.ps1` | Windows 本機一鍵環境初始化與驗收 |
| `tools/check_links.py` | 跨文件相對連結與 Markdown 錨點檢查器（零外部依賴） |
| `tools/check_upstream_updates.py` | 比對 upstream 最新 commit、PR 與 Issue 差異 |
| `tools/check_dependency_freshness.py` | 依賴新鮮度與版本追蹤工具 |
| `tools/upstream_baseline.json` | 記錄 fork 當前基線之 commit SHA、日期與分支資訊 |
| `test/fork-hygiene.test.ts` | 契約測試，驗證文件完整性、連結有效性與無上游 PR 規則 |
| `.github/workflows/upstream-check.yml` | 每週對 `upstream/main` 做未審查 commit、PR、issue 水位檢查 |
| `.github/workflows/dependency-freshness.yml` | 每月依賴新鮮度檢查 |
| 產品 Release 工作流閘門 | 上游 `release-prepare.yml` 包含 `if: github.repository == 'Fission-AI/OpenSpec'` 防護，防止誤發 |
| `docs/DECISIONS.md`、`docs/UPSTREAM.md`、`docs/DEVELOPMENT.md` | fork 維護架構、決策與開發文件 |
| `REVIEW.md` | 全庫風險與安全快照 |
| `.cursor/rules/no-upstream-pr.mdc` | Cursor IDE 機械防線（強制鎖定 SanHsien repo，防止誤開上游 PR） |

產品程式碼在 `src/` 底下，以上游為準。

## 分支與 remote

- `origin/main`：SanHsien 維護線，也是唯一長期分支。
- 日常修改在本機跑 gate 後直接推 `origin/main`。
- `upstream/main`：Fission-AI 原始專案，只追蹤、不推送。
- Dependabot 或外部 fork 的變更走 PR，讀 diff 並通過 CI 後再合併。

不要 `git push upstream`。同步方式見 [`docs/UPSTREAM.md`](docs/UPSTREAM.md)。

上游更新英文 `README.md` 時，把新內容併進 `README.en.md`，再把對應段落翻進本 fork 的繁中 `README.md`。

## 換一台電腦怎麼開發

```powershell
git clone https://github.com/SanHsien/OpenSpec.git
cd openspec
# `gh repo clone` 已會加上 `upstream` remote；若沒有：
# git remote add upstream https://github.com/Fission-AI/OpenSpec.git
pwsh -NoProfile -File tools\bootstrap_dev.ps1
```

詳細開發指令與驗收方式見 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)。