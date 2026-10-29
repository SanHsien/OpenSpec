# 路線圖

> 本 repo 後續工作的單一真相源。做完一項，就在同一個 commit 刪掉那一列；新工作只加在這裡。
> 現況段的數字是 2026-10-29 依 `main` `02885d2a709d` 查的快照，開工前先重查 GitHub。

## 現況
OpenSpec 提供 AI 開發的規格、提案、實作與歸檔工作流，本線重點是 Windows 原生維護（[README](README.md)、[FORK](FORK.md)）。2026-10-29 `gh` 查詢顯示 CI、CodeQL、Security 與 Upstream Check 最近成功，Dependabot／Code scanning 均為 0；依賴新鮮度與 Node 支援政策仍有待裁決項目（2026-10-29 `gh` 查詢；深掃報告（2026-10-2x）「待維護者決定」；`docs/DECISIONS.md:618`）。

## 近期：可以直接動手
| 項目 | 為什麼 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 逐項裁決依賴新鮮度落後，核對工具與政策是否一致 | 非 strict 月排程成功不代表所有宣告都已審查 | 執行 `python tools/check_dependency_freshness.py --strict`，逐項記相容性或升級理由；該指令列出的每個 OUTDATED 套件，在 docs/DECISIONS.md 各有一條升級或延後裁決（含重看條件）；本工具沒有延後機制，不新增未被讀取的設定檔、不以提高下限消音 | Codex | tools/check_dependency_freshness.py:32-55；.github/workflows/dependency-freshness.yml；深掃報告（2026-10-2x）「待維護者決定」 |
| 決定 Node 最低支援版本 | 提高 engines 是破壞性支援政策，不能當普通依賴補丁 | 維護者明確決定是否放棄 Node 20，列出需要保留的安裝族群及遷移條件；未決定前維持 engines | 維護者 | docs/DECISIONS.md:618；上游 PR #2159 |

## 中期：等條件成立再做
| 項目 | 觸發條件 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 落實 Node 支援政策遷移 | 維護者核准，或 runtime 安全修補只支援較新 Node | engines、CI／Security 釘版、安裝文件與 chalk ignore 一致；Windows 安裝、`pnpm test`、型別檢查、lint、build 通過，不帶入未授權發布流程 | Codex | docs/DECISIONS.md:618 |
| 獨立規劃 update 重構與 beta skills | 維護者要處理 update 流程，且完成 fork 行為差異盤點 | 對 update、dry-run、verify、模板輸出建立前後對照，保留 Windows CRLF 與路徑邊界回歸，受影響 CLI 與全套測試通過 | Claude Opus | docs/DECISIONS.md:557、632 |
| 重評 symlink 與 REMOVED／RENAMED 語意 | 維護者明確要支援 symlink 目錄，或決定採用上游 #1962 | 專案外目標仍遭拒，合法目標有測試；verify 的刪除／改名案例按批准規格判級，不放寬 confinement 讓測試過關 | Claude Opus | docs/DECISIONS.md:546、555 |
| 評估是否啟用上游 branch 軸 | 維護者需要追蹤未連到 PR 的上游分支 | 先定義有限篩選與成本上限，試跑確認不重複列已審 PR；不因 branch 數量直接推進水位 | 維護者 | tools/upstream_baseline.json；深掃報告（2026-10-2x）「待維護者決定」 |

## 刻意不做
| 不做什麼 | 理由 | 什麼情況下重新考慮 |
| --- | --- | --- |
| 因舊 Dependabot 動態 run 失敗重做已解除的安全更新 | 現況以 2026-10-29 `gh` 查詢與目前告警狀態為準 | `gh api repos/SanHsien/OpenSpec/dependabot/alerts?state=open` 回報新告警或目前安裝實際失敗 |
| 散佈 standalone binaries、發布 npm 或部署上游網域 | 發布邊界見 FORK.md；既有功能裁決見 docs/DECISIONS.md:560、618 | 維護者提出自己的發布目標與授權 |
| 自動追進所有上游功能或為 No common ancestor 改寫歷史 | baseline 代表已審，fork 有不同 update 與路徑契約 | 明確功能需求且完成影響評估；歷史變更須另行授權 |

## 維護方式
每週依 [上游流程](docs/UPSTREAM.md) 與 `tools/upstream_baseline.json` 審查 commit／PR／issue；上游紅燈先判斷待審內容，不停用 strict 檢查。
每月檢視依賴新鮮度，安全更新即時重查 `gh api repos/SanHsien/OpenSpec/dependabot/alerts?state=open`；維護變更跑 `pwsh -NoProfile -File tools/dev_check.ps1`，產品變更依 [開發指南](docs/DEVELOPMENT.md) 加跑全套測試。