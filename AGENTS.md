# AGENTS.md

給 Codex、Claude Code、Cursor、Antigravity 與其他自動化代理在本專案工作時的指引。產品與使用方式先讀 [`README.md`](README.md)；開發與驗收細節見 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)。

## 專案定位

這是 [`Fission-AI/OpenSpec`](https://github.com/Fission-AI/OpenSpec) 的 MIT License fork。
核心價值是為 AI 編程助手提供規範驅動開發（SDD, Spec-Driven Development）的工作流與規格管理體系。

`origin` 是 `SanHsien/OpenSpec`（預設分支 `main`），`upstream` 是 Fission-AI 原始專案（預設分支 `main`）。
保留上游作者、MIT License 與產品程式。本 fork 的維護差異記在 [`FORK.md`](FORK.md) 與 [`docs/DECISIONS.md`](docs/DECISIONS.md)。

主要開發與完整驗收環境是 **Windows 11 + PowerShell**。所有路徑、指令、換行皆照 Windows 原生環境假設，不套用 POSIX 特有假設。

## 硬性邊界

- 不提交使用者輸入檔案、專有文件、API key、token、私鑰或 `.env`。
- 不推送到 `upstream`。上游同步先跑 `python tools/check_upstream_updates.py`，逐筆審查後再 merge / cherry-pick；不盲目覆蓋 fork 文件與 Windows gate。
- 不發佈到 npm 或取代官方發行管道。上游 release 工作流已加上發布範圍保護，請勿移除。
- 不把 fork 包裝成原創產品，不移除上游作者、贊助或官方連結。
- 在 fork 上，**PR／push／release 只打 `SanHsien/OpenSpec`，不打上游**。

## 技術與資料流

- 核心原始碼：`src/`（CLI 模組、核心命令、工作流解析、驗證器、提示詞生成器）。
- 測試套件：`test/`（單元測試、CLI 端對端測試、工作流整合測試）。
- 維護工具：`tools/`（Windows gate、上游檢查、相對連結檢查、依賴新鮮度追蹤）。
- 規格與架構：`schemas/`、`specs/`。

## 開發原則

- 一般變更直接推 `origin/main`，不開功能分支、不開維護 PR。只有在需要他人審查、或改動風險高到值得先讓 CI 在 PR 上跑一輪時，才退回 **branch → PR → CI → merge**。
- 修 bug 先補可重現失敗測試，再做最小修正。
- 使用繁體中文回覆；使用者文件以繁中為主，公開入口同步維護 `README.en.md`。
- 上游更新英文 `README.md` 時：把新內容併進 `README.en.md`，再翻進繁中 `README.md`。
- 提交訊息用 Conventional Commit。Dependabot 或外部 fork 的變更走 PR，讀 diff 並通過 CI 後再合併。
- `REVIEW.md` 是風險快照，不是每個一般 bug 的流水帳。
- 不 force-push `main`，不刪 `upstream` remote。

## 上游處理

1. `git fetch upstream main`
2. `python tools/check_upstream_updates.py --strict`
3. 逐筆判斷是否與繁中 README、Windows gate、發佈閘門或測試衝突。
4. 可同步的提交用 merge；只需要部分修正時 cherry-pick 或最小重做。
5. 跑 `pwsh -NoProfile -File tools\dev_check.ps1`
6. 採用／略過寫進 `docs/DECISIONS.md`，驗證後才推進 `tools/upstream_baseline.json`

Baseline 代表「已審查」，不代表「全部已合併」。

## 依賴新鮮度

執行 `python tools/check_dependency_freshness.py`，比對 `package.json` 宣告與 npm 現行版。
紅燈只有兩種正當出口，兩種都要留下理由：
- **維持宣告**：在宣告處記錄相容性理由。
- **已延後**：在決策記錄中記錄為什麼這次不升。

## 驗證

```powershell
pwsh -NoProfile -File tools\bootstrap_dev.ps1
pwsh -NoProfile -File tools\dev_check.ps1
```

沒有實際跑過 Windows gate，不要宣稱本機開發環境已可用。

## 文件責任

- `README.md` / `README.en.md`：公開產品與 fork 入口。
- `FORK.md`：與上游的關係、差異、同步方式。
- `NOTICE.md`：授權與 attribution。
- `docs/UPSTREAM.md`：upstream remote 與審查清冊。
- `docs/DEVELOPMENT.md`：本機開發與驗收指令。
- `docs/DECISIONS.md`：長期架構取捨。
- `REVIEW.md`：全庫風險快照。
- `CONTRIBUTING.md` / `SECURITY.md`：本 fork 的貢獻與安全回報流程。

## 對外邊界：PR 只打本 fork

- **PR、push、release 一律指向 `SanHsien/OpenSpec`。** 對上游 `Fission-AI/OpenSpec` 開 PR、push 或發 release 需要維護者在當次對話明確同意回貢；「fork 一份」「建開發環境」「比照其他 repo」都不是同意。
- 根因是機制不是粗心：`gh` 在 fork clone 的**預設 repo 就是上游**，裸跑 `gh pr create` 必然打上去。每個 clone 先跑一次 `gh repo set-default SanHsien/OpenSpec`。
- 開 PR 仍明寫 `gh pr create --repo SanHsien/OpenSpec --base <分支> --head <分支>`，並**讀輸出的 URL**，owner 必須是 `SanHsien`。不是就立刻 `gh pr close` 留言道歉說明，再對 origin 重開。