# 架構決策記錄 (Architecture Decisions)

本文件記錄 `SanHsien/OpenSpec` 維護型 Fork 的重要架構決策與基線審查記錄。

## 2026-09-12：建立維護型 Fork 與初始基線審查

- **背景**：需要一套穩定、具備 Windows 11 原生相容性、雙語說明與嚴密安全防線的 OpenSpec 規範驅動開發體系。
- **決策**：
  1. Fork 自 `Fission-AI/OpenSpec`（Commit `9d4e5974e5c0d9a09b9c6c1e1eb0975e80ec4461`，版本 `v1.13.0`）。
  2. 建立最高硬閘門：設定 `gh repo set-default SanHsien/OpenSpec` 並配置 `.cursor/rules/no-upstream-pr.mdc`，杜絕任何意外部署或 PR 送往上游。
  3. 全面清理 `origin` 上 228 個殘留過期分支，保持單一維護主線 `main`。
  4. 確立公開入口為繁體中文 `README.md`，英文鏡像保留於 `README.en.md`。
  5. 鎖定審查基線水位：
     - 上游 commit 水位：`9d4e5974e5c0d9a09b9c6c1e1eb0975e80ec4461`
     - 上游 PR 水位：`#1852`
     - 上游 Issue 水位：`#1853`
  6. 建立維護門禁：`tools/dev_check.ps1`、`tools/check_links.py`、`tools/check_upstream_updates.py`、`tools/check_dependency_freshness.py` 與 `test/fork-hygiene.test.ts`。

## 2026-09-12：清理過期 Git Tags、修復 Windows 原生相容性缺陷、上游 PR 評估

1. **清理過期歷史 Tags 與單一最新 Tag 策略**：
   - 原由上游帶入 48 個過期 tags（`v0.1.0`～`v1.12.0` 等）與 npm 冗餘 tag（`@fission-ai/openspec@1.13.0`）。
   - 本地與遠端 `origin` 均統一清理，嚴格**僅保留唯一一個最新 Tag：`v1.13.0`**。
   - 在 `tools/check_upstream_updates.py` 之 `git fetch` 加上 `--no-tags`，並設定 `remote.upstream.tagOpt = --no-tags`，杜絕上游歷史 tags 在檢查時自動被拉回本地。
2. **修復 Windows 11 原生相容性缺陷（測試全部綠燈）**：
   - `test/package-install-scripts.test.ts`：修正非 ASCII Windows 路徑被 `pathToFileURL` 轉碼為 `%E6%96%87%E4%BB%B6` 導致 npm install 解析失敗之問題，改用原生路徑傳遞。
   - 補齊 Symlink 跨平台跳過防禦：`test/core/artifact-graph/resolver.test.ts`、`test/commands/schema.test.ts`、`test/core/update.test.ts`。比照上游既有測試加入 `if (process.platform === 'win32') return;`，防止非 Admin / 非 Developer Mode 下之 `EPERM` 崩潰。
   - `test/update-flake-script.test.ts`：針對非原生 POSIX 之 Nix flake 測試在 Windows 原生環境下 bash/sed 調用失敗問題加入 win32 跳過防禦。
   - `build.js`：在 catch 區塊中輸出完整錯誤堆疊物件。
3. **上游 PR/Issue 評估與引進處置**：
   - **PR #1835** (`clay-good`: security & hostile-repo hardening)：改動極大（+2013, -584），目前上游尚未合併且作者仍在修改邊界情況。決策：列入長期安全性觀察追蹤清單，暫不盲目 cherry-pick，待上游成熟並通過全量審查後再行評估。
   - **PR #1840 / Issue #1836**（update-change draft 步驟微調）：上游 Review 進行中，不具破壞性或緊急修復需求，待上游合入後隨新版本同步。
   - **PR #1829 / Issue #1827**（bulk-archive 目標檢查）：尚處於設計討論中，維持目前穩定實作。
## 2026-09-21：上游同步 Triage（Commit/PR/Issue 三軸水位推進）

- **背景**：`tools/check_upstream_updates.py --strict` 回報自 2026-09-12 基線以來上游新增 39 個 commit、41 個 PR、37 個 issue，皆逐筆 triage。本次僅做決策記錄與水位推進，**不合併任何上游程式碼**（回貢/移植需維護者在對話中明確同意，依 FORK.md 判準）。
- **分類原則**：
  - `windows` = 與本 fork「Windows-first」維護宗旨直接相關（EPERM/CRLF/bashrc 等），列為優先候選但本次仍不動 `src/`。
  - `security` = 延續 2026-09-12 對 PR #1835 安全性 hardening 的長期觀察清單。
  - `chore` = 相依性/CI/release 版務，交由 `tools/check_dependency_freshness.py` 獨立追蹤。
  - `docs` = 上游文件用語調整，不影響繁中主檔。
  - `feat` = 新功能提案，需維護者評估。
  - `fix` = 一般性上游缺陷修復，未涉及本 fork 專屬骨架。

### Commits（逐筆，`reviewed_through` 推進至 `bae58cf`）

| Commit | 分類 | 決策 |
| --- | --- | --- |
| `b928165` | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| `09984b8` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `09a999b` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `8b99c07` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `7de2404` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `3b8e5b6` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `e571b5b` | security | 暫不採用，待維護者決定（安全性 hardening，延續 2026-09-12 決策的長期觀察清單，待上游穩定或維護者明確同意後再評估移植） |
| `6e62b1d` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `767d63c` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `4b5c07a` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `46ff91f` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `db560ae` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `e01ed07` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `5d22145` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `208b5b5` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `9f8dec5` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `2ef6fbd` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `388d344` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `72bf760` | windows | 暫不採用，待維護者決定（Windows 相容性直接相關，建議下次授權移植時優先評估；本次僅 triage 與 baseline 推進，不動 src/） |
| `8146be5` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `4c369e0` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `92fb72d` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `8fc65b7` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `fede536` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `6a87a51` | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| `a5bf5c6` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `7090e16` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `086c93b` | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| `626269e` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `605d9e7` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `e67ac47` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `62106f4` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `11a9691` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `9827762` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `5f5914e` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `3312af4` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `eb03b9e` | security | 暫不採用，待維護者決定（安全性 hardening，延續 2026-09-12 決策的長期觀察清單，待上游穩定或維護者明確同意後再評估移植） |
| `634c557` | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| `bae58cf` | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |

共 39 筆 commit，全數 triage 完畢。

### Pull Requests（逐筆，`reviewed_pr_through` 推進至 `#1936`）

| PR | 分類 | 決策 |
| --- | --- | --- |
| #1856 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1858 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1860 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1862 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1864 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1866 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1868 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1870 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1872 | windows | 暫不採用，待維護者決定（Windows 相容性直接相關，建議下次授權移植時優先評估；本次僅 triage 與 baseline 推進，不動 src/） |
| #1874 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1876 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1878 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1880 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1882 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1884 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1885 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1889 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1894 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1896 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1898 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1900 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1901 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1902 | security | 暫不採用，待維護者決定（安全性 hardening，延續 2026-09-12 決策的長期觀察清單，待上游穩定或維護者明確同意後再評估移植） |
| #1903 | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1905 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1906 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1912 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1914 | feat | 暫不採用，待維護者決定（新功能提案，非缺陷修復，需要維護者評估是否引入） |
| #1919 | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1921 | feat | 暫不採用，待維護者決定（新功能提案，非缺陷修復，需要維護者評估是否引入） |
| #1922 | feat | 暫不採用，待維護者決定（新功能提案，非缺陷修復，需要維護者評估是否引入） |
| #1923 | feat | 暫不採用，待維護者決定（新功能提案，非缺陷修復，需要維護者評估是否引入） |
| #1925 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1926 | windows | 暫不採用，待維護者決定（Windows 相容性直接相關，建議下次授權移植時優先評估；本次僅 triage 與 baseline 推進，不動 src/） |
| #1928 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1929 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1930 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1931 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1932 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1934 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1936 | windows | 暫不採用，待維護者決定（Windows 相容性直接相關，建議下次授權移植時優先評估；本次僅 triage 與 baseline 推進，不動 src/） |

共 41 筆 PR，全數 triage 完畢。

### Issues（逐筆，`reviewed_issue_through` 推進至 `#1935`）

| Issue | 分類 | 決策 |
| --- | --- | --- |
| #1854 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1855 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1857 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1859 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1861 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1863 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1865 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1867 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1869 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1871 | windows | 暫不採用，待維護者決定（Windows 相容性直接相關，建議下次授權移植時優先評估） |
| #1873 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1875 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1877 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1879 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1881 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1883 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1887 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1890 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1891 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1892 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1893 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1895 | windows | 暫不採用，待維護者決定（Windows 相容性直接相關，建議下次授權移植時優先評估） |
| #1897 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1899 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1904 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1907 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1908 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1909 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1910 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1913 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1915 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1917 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1918 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1920 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1924 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1927 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1935 | windows | 暫不採用，待維護者決定（Windows 相容性直接相關，建議下次授權移植時優先評估） |

共 37 筆 issue，全數 triage 完畢。

- **水位推進**：`tools/upstream_baseline.json` 更新為 `reviewed_through=bae58cf61479986431bb798acbe5a688a591c18c`（2026-09-17）、`reviewed_pr_through=1936`、`reviewed_issue_through=1935`。

## 2026-09-27：上游同步 Triage（Commit/PR/Issue 三軸水位推進）與 CodeQL 工作流程配置

- **背景**：接手處理 CodeQL workflow 配置防範超時，並處理 `tools/check_upstream_updates.py --strict` 檢出的 32 個 commit、27 個 PR、22 個 issue。本次僅做決策記錄與水位推進，**不合併任何上游程式碼**（依 FORK.md 與 AGENTS.md 邊界規範）。
- **CodeQL 配置決策**：
  - 建立 `.github/workflows/codeql.yml`，針對 `javascript-typescript` 語言進行靜態安全掃描。
  - 設定 `runs-on: ubuntu-latest`、`timeout-minutes: 15`，並使用 `build-mode: none` 略過冗餘編譯與 autobuild 步驟，徹底防範執行逾時。
  - 指定 `queries: security-extended` 與 cron 排程（每週一 06:41 UTC）。
- **分類原則**：
  - `windows` = 與本 fork「Windows-first」維護宗旨直接相關（EPERM/CRLF/測試逾時等），列為優先候選但本次仍不動 `src/`。
  - `chore` = 相依性/CI/release 版務，交由 `tools/check_dependency_freshness.py` 獨立追蹤。
  - `docs` = 上游文件用語調整，不影響繁中主檔。
  - `feat` = 新功能提案，需維護者評估。
  - `fix` = 一般性上游缺陷修復，未涉及本 fork 專屬骨架。

### Commits（逐筆，`reviewed_through` 推進至 `79b6aa9`）

| Commit | 分類 | 決策 |
| --- | --- | --- |
| `518e1a0` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `02fade2` | chore | 不適用（上游 CI 工作流相依更新，本 fork 獨立維護 CI 與工作流） |
| `a64303f` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `0dde57b` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `416599a` | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| `91f2925` | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| `c681df7` | docs | 不適用（上游 Homebrew 安裝文件，不影響本 fork 繁中主檔） |
| `e09916e` | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| `d3d7707` | windows | 暫不採用，待維護者決定（Windows archive lock 相關，建議下次授權移植時優先評估；本次僅記錄 triage，不動 src/） |
| `a5ceea3` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `5b55263` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `fe429a1` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `1d2f8f2` | docs | 不適用（上游社群文件調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| `2a8500a` | chore | 不適用（上游 website 相依性更新，本 fork 相依性另行獨立追蹤） |
| `fe81461` | chore | 不適用（上游相依性更新，本 fork 相依性由 tools/check_dependency_freshness.py 獨立追蹤） |
| `0b5ce44` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `fd56e12` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `02d8c24` | docs | 不適用（上游疑難排解文件，不影響本 fork 繁中主檔） |
| `1515edb` | docs | 不適用（上游社群文件調整，不影響本 fork 繁中主檔） |
| `f179ed4` | chore | 不適用（上游相依性更新，本 fork 相依性由 tools/check_dependency_freshness.py 獨立追蹤） |
| `8826c0c` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `1d35e90` | windows | 暫不採用，待維護者決定（Windows CRLF 換行保留相關，建議下次授權移植時優先評估；本次僅記錄 triage，不動 src/） |
| `ed5d386` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `72fbe4c` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `f2812f6` | windows | 暫不採用，待維護者決定（Windows EPERM 略過暫存拷貝相關，建議下次授權移植時優先評估；本次僅記錄 triage，不動 src/） |
| `fb1b876` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `d6bdef6` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `072de6b` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `3364146` | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `7ac58dc` | chore | 不適用（上游 changeset 版務紀錄） |
| `db23097` | chore | 不適用（上游 version packages 發版紀錄） |
| `79b6aa9` | windows | 暫不採用，待維護者決定（Windows 子進程測試 10s 逾時調整；本 fork 測試皆正常通過，本次僅記錄 triage） |

共 32 筆 commit，全數 triage 完畢。

### Pull Requests（逐筆，`reviewed_pr_through` 推進至 `#1987`）

| PR | 分類 | 決策 |
| --- | --- | --- |
| #1937 | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1938 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1939 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1940 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1941 | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1943 | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1944 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1945 | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1946 | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1953 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 獨立維護） |
| #1954 | chore | 不適用（上游相依性更新，本 fork 相依性由 tools/check_dependency_freshness.py 獨立追蹤） |
| #1955 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1956 | docs | 不適用（上游文件提議，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1958 | windows | 暫不採用，待維護者決定（Windows 相容性直接相關，建議下次授權移植時優先評估；本次僅 triage 與 baseline 推進，不動 src/） |
| #1961 | feat | 暫不採用，待維護者決定（新工具支援提案，非缺陷修復，需要維護者評估是否引入） |
| #1962 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1963 | docs | 不適用（上游文件提議，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1964 | chore | 不適用（上游 changeset 版務紀錄） |
| #1969 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1972 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1974 | docs | 不適用（上游社群工具文件調整，不影響本 fork 繁中主檔） |
| #1977 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1978 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1979 | docs | 不適用（上游文件提議，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1981 | windows | 暫不採用，待維護者決定（Windows 相容性直接相關，調整測試逾時，建議下次授權移植時評估；本次僅記錄 triage，不動 src/） |
| #1984 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1987 | fix | 暫不採用，待維護者決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |

共 27 筆 PR，全數 triage 完畢。

### Issues（逐筆，`reviewed_issue_through` 推進至 `#1986`）

| Issue | 分類 | 決策 |
| --- | --- | --- |
| #1942 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1947 | docs | 不適用（上游文件需求，不影響本 fork 繁中主檔） |
| #1948 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1949 | windows | 暫不採用，待維護者決定（Windows 相容性直接相關，建議下次授權移植時優先評估） |
| #1950 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1951 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1952 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1959 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1960 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1965 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1966 | docs | 不適用（上游文件建議，不影響本 fork 繁中主檔） |
| #1967 | docs | 不適用（上游架構討論，不影響本 fork 繁中主檔） |
| #1968 | feat | 暫不採用，待維護者決定（功能探索/提案，需要維護者評估是否引入） |
| #1971 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1973 | chore | 不適用（上游測試性回饋 Issue，無實質內容） |
| #1975 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1976 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1980 | feat | 暫不採用，待維護者決定（功能探索/提案，需要維護者評估是否引入） |
| #1982 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1983 | feat | 暫不採用，待維護者決定（功能請求/提案，需要維護者評估是否引入） |
| #1985 | docs | 不適用（上游設計探討，不影響本 fork 繁中主檔） |
| #1986 | fix | 暫不採用，待維護者決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |

共 22 筆 issue，全數 triage 完畢。

- **水位推進**：`tools/upstream_baseline.json` 更新為 `reviewed_through=79b6aa9c98f1e36795b2bc4ef2a8f770c6d3a777`（2026-09-27）、`reviewed_pr_through=1987`、`reviewed_issue_through=1986`。

## 2026-09-28：合併 PR #2（升級 Vitest 4 與安全修復）與上游最新 Triage

- **背景**：維護者授權合併 PR #2（`security/vitest-4`），並清理遠端多餘分支，最終只留 `main`。同時檢出上游新進 2 筆 PR（#1990, #1991）與 2 筆 Issue（#1988, #1989）並完成 triage。
- **PR #2 合併決策**：
  - 升級 `vitest` 與 `@vitest/ui` 至 `^4.1.11`，修復 Dependabot 漏洞警告（#1、#3、#4）。
  - 修復 `test/commands/completion.test.ts` 以相容 Vitest 4 constructor mock 規格。
  - 在 `pnpm-workspace.yaml` override `fflate >= 0.8.3`，並更新 `flake.nix` pnpmDeps hash。
  - 關閉已被 PR #2 取代之 PR #1（`dependabot/npm_and_yarn/vitest-4.1.11`）。

### Pull Requests（逐筆，`reviewed_pr_through` 推進至 `#1991`）

| PR | 分類 | 決策 |
| --- | --- | --- |
| #1990 | chore | 不適用（上游 dev 相依性更新，本 fork 獨立追蹤） |
| #1991 | chore | 不適用（上游 website 相依性更新，本 fork 獨立追蹤） |

### Issues（逐筆，`reviewed_issue_through` 推進至 `#1989`）

| Issue | 分類 | 決策 |
| --- | --- | --- |
| #1988 | feat | 跟隨上游（功能提案，上游採納並發行後依 release 帶入） |
| #1989 | feat | 跟隨上游（功能提案，上游採納並發行後依 release 帶入） |

- **水位推進**：`tools/upstream_baseline.json` 更新為 `reviewed_through=79b6aa9c98f1e36795b2bc4ef2a8f770c6d3a777`（2026-09-28）、`reviewed_pr_through=1991`、`reviewed_issue_through=1989`。

### 上游分流補記（2026-09-28 驗收時）

| 項目 | 類型 | 判定 |
|---|---|---|
| PR #1992 feat(config): connect roots in monorepos | feat | 跟隨上游（OPEN，+1118/-62 的大型功能，合併並發行後依 release 帶入） |
| PR #1994 fix(apply): include task source locations | fix | 跟隨上游（OPEN，#1993 的修正，合併後隨 release 帶入） |
| PR #1995 fix(config): clarify project context guidance | fix/docs | 跟隨上游（OPEN，設定引導調整，合併後隨 release 帶入） |
| PR #1996 docs(config): focus project guidance on durable constraints | docs | 跟隨上游（OPEN，設定文件說明聚焦，合併後隨 release 帶入） |
| Issue #1993 Apply workflow cannot map aggregated tasks back to custom-schema files | bug | 跟隨上游（由 #1994 處理） |

`reviewed_pr_through` 推進至 `#1996`，`reviewed_issue_through` 推進至 `#1993`。

## 2026-09-29：採用上游 #2004

- `d4e1c77e` fix(cleanup): clarify legacy file deletion warning — **採用**（cherry-pick）。刪除舊檔前的提示改為「整個刪除、請先備份」，不再宣稱沒有使用者內容；只改提示字串與測試。
- `reviewed_through` 推進至 `d4e1c77e`。

| 項目 | 判定 |
| --- | --- |
| PR #1997 fix(propose): guide capability naming | 跟隨上游（OPEN，合併後隨 commit 帶入） |
| PR #1998 docs(archive): document retention options | 跟隨上游（OPEN） |
| PR #1999 fix(init): guide project.md migration | 跟隨上游（OPEN） |
| PR #2001 feat(cli): report version and update metadata | 跟隨上游（OPEN，+877 的功能，合併後再評估） |
| PR #2002 docs(schemas): document Superpowers community bridge | 跟隨上游（OPEN） |
| PR #2003 docs(root): propose custom OpenSpec directory | 跟隨上游（OPEN，提案文件） |
| PR #2004 fix(cleanup): clarify legacy file deletion warning | 已採用（見上） |
| PR #2005 chore(release): version packages | 不適用（本 fork 不發行 npm） |
| Issue #2000 Feedback: test | 不適用（測試用回饋，無內容） |
| Issue #2006 archive `--yes` skips the incomplete-task stop | 跟隨上游（行為缺陷回報，等上游修正帶入） |

`reviewed_pr_through` 推進至 `#2005`，`reviewed_issue_through` 推進至 `#2006`。

## 2026-10-08：上游安全修復與同步 Triage

本次逐筆審查 `d4e1c77e..9111a765` 的 54 個 commit、PR #2009–#2061 與 Issue #2008–#2059。安全修復只採用必要範圍：網站升級至 Next 16.3.8 並鎖定受 advisory 影響的 transitive 套件；根目錄以 `glob@13` 取代 `fast-glob`，移除無修補的 `braces@3` 鏈。未合併任何上游 commit。

### Commits

| Commit | 判定 |
| --- | --- |
| `0ff63db` archive 同步成功才封存 | 延後：archive 行為變更，非本次安全範圍。 |
| `fffe3d3` view 長名稱進度條 | 延後：UI 行為修正，非本次範圍。 |
| `e7a9512` apply 顯示 task 來源 | 延後：工作流輸出變更，非本次範圍。 |
| `42671df` config 規則錯誤名稱 | 延後：一般設定驗證修正，待獨立回歸。 |
| `1872982` requirement 長度提示 | 延後：schema 用語變更，待完整上游同步。 |
| `e70dcc7` propose capability 命名 | 延後：提示詞行為變更。 |
| `baad449` config context 說明 | 略過：上游文件，fork 文件另維護。 |
| `9a40b58` archive retention 文件 | 略過：上游文件，fork 文件另維護。 |
| `28f8643` MySpec 社群文件 | 略過：上游社群項目。 |
| `bda8556` init project.md migration | 延後：init 行為變更，待獨立回歸。 |
| `d28fb49` show JSON 名稱 | 延後：CLI 輸出契約變更。 |
| `9557b43` init external stores | 延後：store 行為變更。 |
| `5fe5859` spec 文件校正 | 略過：上游文件，fork 文件另維護。 |
| `88692b3` change metadata 警告 | 延後：設定行為變更。 |
| `817cdb6` Bob 工具名稱 | 延後：工具目錄變更。 |
| `f7d426a` dev dependencies | 延後：非安全 dev 依賴，交給 freshness 週期。 |
| `486cfeb` website dependency group | 部分採用：只採安全所需 Next 16.3.8；其餘 Fumadocs 更新延後。 |
| `3c3e6e3` GigaCode 工具 | 略過：新增功能。 |
| `5a360c2` VEAI skills | 略過：新增工具功能。 |
| `070de01` Amp skills | 略過：新增工具功能。 |
| `c21d897` view workflow status | 延後：新 CLI 功能。 |
| `297092c` DeepSeek Harness | 略過：新增工具功能。 |
| `3de7c72` AtomCode | 略過：新增工具功能。 |
| `56528ea` CLI version metadata | 延後：CLI 功能擴充。 |
| `ee3ca38` review 文件 | 略過：上游文件。 |
| `de4141f` Superpowers 文件 | 略過：上游文件。 |
| `e923d05` issue forms/PR template | 延後：fork 維護流程另行評估。 |
| `405d8b5` docs-lab CODEOWNERS | 略過：上游維護設定。 |
| `7728194` archive sync fallback | 延後：archive 行為變更。 |
| `ded99e2` archive list/view | 延後：新 CLI 功能。 |
| `f197804` Nix overlay | 略過：非 Windows-first 發行功能。 |
| `a7f08b8` GSD skills | 略過：新增工具功能。 |
| `d1642cb` EasyCode | 略過：新增工具功能。 |
| `781c7f9` Warp skills | 略過：新增工具功能。 |
| `e232080` Grok skills | 略過：新增工具功能。 |
| `c879d13` Code Studio | 略過：新增工具功能。 |
| `cf2859a` store edit roots | 延後：store 行為變更。 |
| `cd4f9e4` zsh uninstall | 略過：POSIX shell 專屬。 |
| `81c2f9f` 1.14.0 changeset | 略過：上游 release 記錄。 |
| `94ca9c1` 1.14.0 release | 略過：本 fork 不發行上游 npm 套件。 |
| `3a34ea3` website brace/fast-uri pins | 採用：以較新安全 pins 實作並延伸修復其他 advisory。 |
| `7056a58` tasks/archive readiness | 延後：工作流行為變更。 |
| `ba0f508` archive retirement errors | 延後：archive 行為變更。 |
| `760584b` strict requirement length | 延後：驗證行為變更。 |
| `bfa670e` lazy CLI loading | 延後：效能架構變更。 |
| `2500d6d` view archived changes | 延後：CLI 顯示行為變更。 |
| `852a073` specs write sequence | 延後：工作流寫入行為變更。 |
| `43d23cc` verify custom artifacts | 延後：verify 行為變更。 |
| `0654cfb` website dependency group | 部分採用：Next 16.3.8 與安全 lock 解決；其餘非安全版本延後。 |
| `112fea5` smol-toml dev bump | 採用：完整 audit 證實 1.7.1 受 GHSA-r4xh-jqrq-34v2 影響，升至 1.9.0。 |
| `69cf0a9` host-dependent tests | 延後：需獨立評估跨環境測試影響。 |
| `7358306` 1.14.1 changeset | 略過：上游 release 記錄。 |
| `87c3595` 1.14.1 release | 略過：本 fork 不發行上游 npm 套件。 |
| `9111a76` audit ignore braces | 拒絕：ignore 不能消除 runtime 風險；已移除依賴鏈。 |

### Pull requests

| PR | 判定 |
| --- | --- |
| #2009 descendant libraries | 延後：新多 library 行為。 |
| #2012 multi-library 文件 | 略過：對應新功能文件。 |
| #2014 store edit roots | 延後：同 `cf2859a`。 |
| #2016 zsh uninstall | 略過：POSIX shell 專屬。 |
| #2018 1.14.0 changeset | 略過：上游 release 記錄。 |
| #2019 website security pins | 採用：網站 advisory pins 已納入。 |
| #2020 strict requirement length | 延後：驗證行為變更。 |
| #2024 release packages | 略過：本 fork 不發行上游 npm 套件。 |
| #2025 lazy CLI loading | 延後：效能架構變更。 |
| #2028 verify artifact paths | 延後：verify 行為變更。 |
| #2029 scenario-reference 文件 | 略過：設計提案文件。 |
| #2031 archived dashboard | 延後：CLI 顯示行為變更。 |
| #2035 MySpec 社群文件 | 略過：上游社群項目。 |
| #2037 specs write sequence | 延後：工作流寫入行為變更。 |
| #2039 host-dependent tests | 延後：需獨立評估跨環境測試。 |
| #2040 smol-toml Dependabot | 採用：完整 audit 證實 1.7.1 受 GHSA-r4xh-jqrq-34v2 影響，升至 1.9.0。 |
| #2041 website dependency group | 部分採用：Next 安全更新；其餘版本延後。 |
| #2042 smol-toml bump | 採用：完整 audit 證實 1.7.1 受 GHSA-r4xh-jqrq-34v2 影響，升至 1.9.0。 |
| #2044 approved-issue 規範 | 略過：上游貢獻流程。 |
| #2046 SkillGild 社群文件 | 略過：上游社群項目。 |
| #2047 1.14.1 changeset | 略過：上游 release 記錄。 |
| #2048 audit ignore braces | 拒絕：已以移除 `fast-glob` 鏈取代。 |
| #2052 symlink archive | 延後：archive 行為變更。 |
| #2054 archive delta warning | 延後：archive 行為變更。 |
| #2061 brace-depth guard | 拒絕：guard 之外仍保留危險依賴；改以依賴替換。 |

### Issues

| Issue | 判定 |
| --- | --- |
| #2008 descendant libraries | 延後：新多 library 設計。 |
| #2011 split local libraries | 延後：新多 library 設計。 |
| #2013 store edit roots | 延後：store 行為變更。 |
| #2015 zsh leading blank lines | 略過：POSIX shell 專屬。 |
| #2017 archive specodelic formats | 延後：archive 格式設計。 |
| #2021 propose read specs | 延後：工作流設計決策。 |
| #2022 Agent Skills migration | 略過：上游產品方向。 |
| #2023 Agent Skill 文件 | 略過：上游文件。 |
| #2026 remaining CLI perf | 延後：效能架構變更。 |
| #2027 verify custom artifacts | 延後：verify 行為變更。 |
| #2030 human progress command | 延後：新 CLI 功能。 |
| #2032 agent approval context | 延後：工作流設計決策。 |
| #2033 archive deterministic merge | 延後：archive 設計決策。 |
| #2034 large specs planning | 延後：工作流 UX 設計。 |
| #2036 Markdown JSON metadata | 略過：新增格式功能。 |
| #2038 local test dependence | 延後：需獨立評估跨環境測試。 |
| #2043 skill trigger | 略過：上游 agent 整合行為。 |
| #2050 symlinked changes | 延後：archive 行為變更。 |
| #2051 unpatched braces | 採用：以 `glob@13` 移除 vulnerable `braces@3`。 |
| #2053 archive drops delta text | 延後：archive 行為變更。 |
| #2055 install without Node | 略過：發行模型變更。 |
| #2056 stable design anchors | 延後：規格格式設計。 |
| #2057 update-change exploration | 延後：工作流設計決策。 |
| #2058 workflow handoffs | 延後：工作流設計決策。 |
| #2059 legacy docs links | 略過：上游文件佈局。 |

水位已推進至 `9111a7654d7800391459431fff4eaf66e33a3d2e`、PR `#2061`、Issue `#2059`；再次執行 strict checker 為此記錄的驗收條件。


### 2026-10-09 安全修正補充：先驗證 brace alternatives

- `Glob` constructor 的 path 最佳化會消去 `dir/..`；展開階段先以保留分隔字元的單一 component 取得每個原始 alternative，禁止 absolute 與明確 `..` segment，再進行 confinement prewalk 與 matching。
- brace 深度上限 16、alternative 數量上限 10,000；先驗證全部 alternatives，任何失敗不進入 directory matching。Windows junction 與遞迴 linked directory 同樣需先驗證 canonical confinement。
- 保留原 `*`、`?`、`[` glob 分類；只有 brace 或 `@(...)`／`+(...)`／`!(...)` 的值仍是 literal path。移除分類階段的重複 slicing。
- 回歸測試透過 glob 公開 filesystem adapter 記錄 `readdirSync`，證明 outbound brace alternative 在任何目錄 matching 前遭拒，且 external junction target 不被讀取。


### 2026-10-09 新上游 PR #2062 / #2063 審查

兩筆 PR 皆以 `9111a7654d7800391459431fff4eaf66e33a3d2e` 為 base，本次查詢皆為 OPEN、非 draft、尚未合併；已取得實際完整 diff 與 head SHA，不以 CI 成功取代採用判定。

| PR / head | 實際變更 | 判定與理由 |
| --- | --- | --- |
| [#2062](https://github.com/Fission-AI/OpenSpec/pull/2062) / `0be43e4dd7d341ee73f8ece5d99b46b279b3811e` | 改寫 `README.md` 文件連結至 openspec.dev、縮減 Docs 清單、移除 new-workflow tip；`docs/README.md` 新增 legacy 警告；既有 explore 測試僅改註解。 | **延後**：這是公開文件導引重整，非安全修正。本 fork 的 README 為繁中主檔，英文鏡像與本地維護文件需一併校對；不能直接覆蓋或把本 fork 的整個 docs 樹宣告過期。待獨立文件同步時逐頁檢查外部導引與本地文件責任。此 head 的 Windows/Linux/macOS、型別、lint、audit、CodeQL 等 checks 成功，僅作上游相容性資訊，未採用 diff。 |
| [#2063](https://github.com/Fission-AI/OpenSpec/pull/2063) / `4f47ad409761cbd00d826635e63b5a9b79974eb8` | 新增 `^x-[a-z0-9][a-z0-9_-]*$` extension-key 分類；unknown-key 診斷排除相符 keys，提示如何使用 x-；修改 metadata 測試、concepts 文件與 minor changeset。 | **延後**：會改變 validate/instructions/archive 的 metadata 警告契約，屬新產品功能。本 fork 的 `src/utils/change-metadata.ts` 尚無此 diff 依賴的 `listUnknownChangeMetadataKeys`／`formatUnknownChangeMetadataKeysMessage` API；須先評估並審查其前置診斷行為，而非單獨 cherry-pick。此 head 目前僅見 Cloud PR Scan NEUTRAL，未觀測到 Test／Type Check 等完整 CI 證據；PR 作者所述本機結果不視為本 fork 驗收。 |

PR 水位推進至 `#2063` 只代表以上兩筆已完成審查；Commit 水位與 Issue 水位維持既有值，未合併任何上游產品／文件 diff。驗收僅重跑先前失敗的 strict upstream checker，保留安全修正來源 hash 與既有 4506-pass 測試證據。


### 2026-10-09 安全修正補充：尾端 globstar confinement

- `**`、`specs/**` 與展開後以 `**` 結尾的 brace alternative 仍會遞迴讀取目錄；因此尾端 `**` 必須保留在 confinement prewalk 的 directory segments，不能按一般 basename 排除。
- 新增 Windows 原生 junction 回歸：三種模式先獨立斷言 external target／linked path 未被 `readdirSync`，再檢查 confinement 拒絕，避免 post-match 錯誤掩蓋先行外部掃描。另驗證三種 confined 模式仍正常解析檔案。
- 修正前新增回歸為 3 fail／3 pass；修正後執行 outputs、artifact-graph 與 TypeScript 聚焦驗證。既有 4506-pass 全套結果屬先前來源，未對此修正重跑全套，不將其宣稱為新來源的完整 gate。


### 2026-10-09 CI 補正：Nix lockfile hash 與 PR #2064

- CI run `37932882804`／Nix job `113827727074` checkout `8acfdfa54ae5b20996ff70c89c7743f0f6e9af3d`。其 updater 對 `pnpmDeps` 計算 `sha256-oia8RpoBDChVLxcmZDBSsCBzBfeVuJNpcUy/GzcbCi8=` 並成功 build，再因 tracked `flake.nix` 的舊值未同步而 fail。本地 package、workspace 與 root lockfile blob 與該 CI SHA 完全相同，只更新 `pnpmDeps.hash`；不降低 Nix gate 或修改其他 derivation。
- [PR #2064](https://github.com/Fission-AI/OpenSpec/pull/2064) 為 OPEN、非 draft，base `9111a7654d7800391459431fff4eaf66e33a3d2e`、head `f816cdeec1a91fa0189ca2e8e8693db359e1ae0d`；已讀完整 diff。新增 `isTabCompletionRun` 讓 `__complete` 略過 telemetry／completion-tip hooks，將 ora 移到 install/uninstall 的 dynamic import，將 schema resolver 自 artifact-graph barrel 改為需要時載入；新增 module-load／hook classification 測試與 patch changeset。
- **判定：延後**。本 fork CLI 仍採 eager telemetry／commands imports，先前 `bfa670e` lazy CLI 與 #2026 CLI perf 已延後；此 PR 是同一啟動效能架構的後續，單獨摘取不能套用其 48-module 成果或保證 hook／first-run notice 行為。它不是本次依賴與 confinement 安全修正所需功能。上游此 head 的跨平台 Test、Nix、lint/type、audit checks 成功；作者提供 macOS timing，均不代替本 fork Windows 驗收。
- **重訪條件**：使用者啟動獨立 CLI 啟動／completion 效能工作，或本 fork 決定採用 deferred lazy CLI 前置架構時連同 #2064 重審；需 Windows 原生 module-load／timing、`__complete` 三種類型輸出一致、telemetry notice／flush 與 completion install/uninstall hook 回歸。
- PR 水位推進至 `#2064` 只代表已審查，Commit／Issue 水位不變；未合併 PR 產品 source。只重驗 links、fork hygiene 與 strict upstream checker，安全與 metadata 程式／測試 hash 保持不變。
