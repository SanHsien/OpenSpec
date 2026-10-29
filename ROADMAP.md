# 路線圖

> 本 repo 後續工作的單一真相源。做完一項，就在同一個 commit 刪掉那一列；新工作只加在這裡。
> 現況段的本機與上游審查是 2026-10-30 依 `main`／HEAD `3f260c7fcaa432ecd65e51bfd42ab0895cb045d2` 的快照；GitHub CI／告警數字仍是 2026-10-29 的舊快照，未在本輪重驗。

## 現況
OpenSpec 提供 AI 開發的規格、提案、實作與歸檔工作流，本線重點是 Windows 原生維護（[README](README.md)、[FORK](FORK.md)）。2026-10-30 在 `main`／HEAD `3f260c7fcaa432ecd65e51bfd42ab0895cb045d2` 接續完成 9 個 OUTDATED 套件的延後裁決（依賴 strict 仍 exit 1），並逐筆審完上游 5 筆 PR、6 筆 issue；PR／issue 水位推進至 #2172／#2173，commit 水位不變、behind 0，5 筆延後 PR 另釘 head／狀態監看（見 [裁決記錄](docs/DECISIONS.md#2026-10-30補審上游-5-筆-pr-與-6-筆-issue)）。本輪 Windows gate exit 0（`WINDOWS DEV CHECK GREEN`），沒有產品修正，延期缺陷列於下表；Node 支援政策仍待維護者決定。2026-10-29 的 CI、CodeQL、Security、Upstream Check 成功與告警為 0 僅為歷史快照。

## 近期：可以直接動手
| 項目 | 為什麼 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 修補 sync／archive 的 delta 集合與寫入防護 | #2168 的自訂 id 修正仍未排除 #2173 的 notes.md；#2169 被上游關閉不代表外部寫入安全 | 下一輪 sync 修補先補失敗測試，再同步支援自訂 id、多 artifact 規則與合法 spec.md 集合；在寫入前拒絕 stray file 及外部 symlink／junction，拒絕時不改 main spec、不歸檔；更新 skill／command／生成鏡像及 parity，跑受影響測試與完整 gate | Codex | docs/DECISIONS.md「2026-10-30：補審上游」；PR #2168／#2169、issue #2163／#2164／#2173 |
| 修補 apply 的告警與 blocked artifact 選擇 | CLI 已回傳 warnings 與 missingPrerequisites，共用模板未消費 | 下一輪 apply 修補先補失敗測試；ready／all_done 的告警須先顯示並暫停，修補後刷新；blocked 只選依賴集合中的 ready artifact，集合無候選不寫入；保留 store 與舊 CLI 退路，同步生成鏡像與完整 gate | Codex | docs/DECISIONS.md「2026-10-30：補審上游」；PR #2170／#2171、issue #2165／#2166 |
| 決定 Node 最低支援版本 | 提高 engines 是破壞性支援政策，不能當普通依賴補丁 | 維護者明確決定是否放棄 Node 20，列出需要保留的安裝族群及遷移條件；未決定前維持 engines | 維護者 | docs/DECISIONS.md:618；上游 PR #2159 |

## 中期：等條件成立再做
| 項目 | 觸發條件 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 落實 Node 支援政策遷移 | 維護者核准，或 runtime 安全修補只支援較新 Node | engines、CI／Security 釘版、安裝文件與 chalk ignore 一致；Windows 安裝、`pnpm test`、型別檢查、lint、build 通過，不帶入未授權發布流程 | Codex | docs/DECISIONS.md:618 |
| 獨立規劃 update 重構與 beta skills | 維護者要處理 update 流程，且完成 fork 行為差異盤點 | 對 update、dry-run、verify、模板輸出建立前後對照，保留 Windows CRLF 與路徑邊界回歸，受影響 CLI 與全套測試通過 | Claude Opus | docs/DECISIONS.md:557、632 |
| 重評 symlink 與 REMOVED／RENAMED 語意 | 維護者明確要支援 symlink 目錄，或決定採用上游 #1962 | 專案外目標仍遭拒，合法目標有測試；verify 的刪除／改名案例按批准規格判級，不放寬 confinement 讓測試過關 | Claude Opus | docs/DECISIONS.md:546、555 |
| 重評 ZDOTDIR completion 修補 | 有 ZDOTDIR 使用需求、安排 POSIX 驗收，或 PR #2172 head／狀態變更 | 先定相對 ZDOTDIR 政策，再測絕對／空白／未設定值、安裝與解除安裝往返、舊 home 區塊清理、提示一致及真實 zsh 載入；Windows gate 不代替 POSIX smoke | Codex | docs/DECISIONS.md「2026-10-30：補審上游」；PR #2172 |
| 重評 requirement／scenario／decision 穩定 ID | 維護者決定引入 ID，或採用 #1979／beta skills #2134 前 | 先定 ID 與名稱匹配規格，再測無 ID 向後相容、重複 ID、改名與移除 ID；同步 parser、validate、archive 與文件，不引用未重跑的上游歷史數據當本機證據 | 維護者 | docs/DECISIONS.md「2026-10-30：補審上游」；issue #2167 |
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
