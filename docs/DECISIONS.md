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

- **背景**：`tools/check_upstream_updates.py --strict` 回報自 2026-09-12 基線以來上游新增 39 個 commit、41 個 PR、37 個 issue，皆逐筆 triage。本次僅做決策記錄與水位推進，**不合併任何上游程式碼**（回貢/移植需主人在對話中明確同意，依 FORK.md 判準）。
- **分類原則**：
  - `windows` = 與本 fork「Windows-first」維護宗旨直接相關（EPERM/CRLF/bashrc 等），列為優先候選但本次仍不動 `src/`。
  - `security` = 延續 2026-09-12 對 PR #1835 安全性 hardening 的長期觀察清單。
  - `chore` = 相依性/CI/release 版務，交由 `tools/check_dependency_freshness.py` 獨立追蹤。
  - `docs` = 上游文件用語調整，不影響繁中主檔。
  - `feat` = 新功能提案，需主人評估。
  - `fix` = 一般性上游缺陷修復，未涉及本 fork 專屬骨架。

### Commits（逐筆，`reviewed_through` 推進至 `bae58cf`）

| Commit | 分類 | 決策 |
| --- | --- | --- |
| `b928165` | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| `09984b8` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `09a999b` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `8b99c07` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `7de2404` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `3b8e5b6` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `e571b5b` | security | 暫不採用，待主人決定（安全性 hardening，延續 2026-09-12 決策的長期觀察清單，待上游穩定或主人明確同意後再評估移植） |
| `6e62b1d` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `767d63c` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `4b5c07a` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `46ff91f` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `db560ae` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `e01ed07` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `5d22145` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `208b5b5` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `9f8dec5` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `2ef6fbd` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `388d344` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `72bf760` | windows | 暫不採用，待主人決定（Windows 相容性直接相關，建議下次授權移植時優先評估；本次僅 triage 與 baseline 推進，不動 src/） |
| `8146be5` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `4c369e0` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `92fb72d` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `8fc65b7` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `fede536` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `6a87a51` | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| `a5bf5c6` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `7090e16` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `086c93b` | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| `626269e` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `605d9e7` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `e67ac47` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `62106f4` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `11a9691` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `9827762` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `5f5914e` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `3312af4` | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| `eb03b9e` | security | 暫不採用，待主人決定（安全性 hardening，延續 2026-09-12 決策的長期觀察清單，待上游穩定或主人明確同意後再評估移植） |
| `634c557` | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| `bae58cf` | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |

共 39 筆 commit，全數 triage 完畢。

### Pull Requests（逐筆，`reviewed_pr_through` 推進至 `#1936`）

| PR | 分類 | 決策 |
| --- | --- | --- |
| #1856 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1858 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1860 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1862 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1864 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1866 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1868 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1870 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1872 | windows | 暫不採用，待主人決定（Windows 相容性直接相關，建議下次授權移植時優先評估；本次僅 triage 與 baseline 推進，不動 src/） |
| #1874 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1876 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1878 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1880 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1882 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1884 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1885 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1889 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1894 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1896 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1898 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1900 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1901 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1902 | security | 暫不採用，待主人決定（安全性 hardening，延續 2026-09-12 決策的長期觀察清單，待上游穩定或主人明確同意後再評估移植） |
| #1903 | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1905 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1906 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1912 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1914 | feat | 暫不採用，待主人決定（新功能提案，非缺陷修復，需要主人評估是否引入） |
| #1919 | docs | 不適用（上游文件用語調整，不影響本 fork 繁中主檔或 Windows 維護骨架） |
| #1921 | feat | 暫不採用，待主人決定（新功能提案，非缺陷修復，需要主人評估是否引入） |
| #1922 | feat | 暫不採用，待主人決定（新功能提案，非缺陷修復，需要主人評估是否引入） |
| #1923 | feat | 暫不採用，待主人決定（新功能提案，非缺陷修復，需要主人評估是否引入） |
| #1925 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1926 | windows | 暫不採用，待主人決定（Windows 相容性直接相關，建議下次授權移植時優先評估；本次僅 triage 與 baseline 推進，不動 src/） |
| #1928 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1929 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1930 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1931 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1932 | chore | 不適用（上游相依性/CI/release 版務紀錄，本 fork 相依性另由 tools/check_dependency_freshness.py 獨立追蹤，不逐筆跟進 lockfile bump） |
| #1934 | fix | 暫不採用，待主人決定（一般性上游 bug fix，未涉及本 fork 專屬文件或 Windows 維護骨架，本次僅記錄 triage，不合併程式碼） |
| #1936 | windows | 暫不採用，待主人決定（Windows 相容性直接相關，建議下次授權移植時優先評估；本次僅 triage 與 baseline 推進，不動 src/） |

共 41 筆 PR，全數 triage 完畢。

### Issues（逐筆，`reviewed_issue_through` 推進至 `#1935`）

| Issue | 分類 | 決策 |
| --- | --- | --- |
| #1854 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1855 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1857 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1859 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1861 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1863 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1865 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1867 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1869 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1871 | windows | 暫不採用，待主人決定（Windows 相容性直接相關，建議下次授權移植時優先評估） |
| #1873 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1875 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1877 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1879 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1881 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1883 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1887 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1890 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1891 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1892 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1893 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1895 | windows | 暫不採用，待主人決定（Windows 相容性直接相關，建議下次授權移植時優先評估） |
| #1897 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1899 | feat | 暫不採用，待主人決定（功能請求/提案，需要主人評估是否引入） |
| #1904 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1907 | feat | 暫不採用，待主人決定（功能請求/提案，需要主人評估是否引入） |
| #1908 | feat | 暫不採用，待主人決定（功能請求/提案，需要主人評估是否引入） |
| #1909 | feat | 暫不採用，待主人決定（功能請求/提案，需要主人評估是否引入） |
| #1910 | feat | 暫不採用，待主人決定（功能請求/提案，需要主人評估是否引入） |
| #1913 | feat | 暫不採用，待主人決定（功能請求/提案，需要主人評估是否引入） |
| #1915 | feat | 暫不採用，待主人決定（功能請求/提案，需要主人評估是否引入） |
| #1917 | feat | 暫不採用，待主人決定（功能請求/提案，需要主人評估是否引入） |
| #1918 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1920 | fix | 暫不採用，待主人決定（回報上游既有缺陷，未涉及本 fork 專屬骨架，未合併任何程式碼修正） |
| #1924 | feat | 暫不採用，待主人決定（功能請求/提案，需要主人評估是否引入） |
| #1927 | feat | 暫不採用，待主人決定（功能請求/提案，需要主人評估是否引入） |
| #1935 | windows | 暫不採用，待主人決定（Windows 相容性直接相關，建議下次授權移植時優先評估） |

共 37 筆 issue，全數 triage 完畢。

- **水位推進**：`tools/upstream_baseline.json` 更新為 `reviewed_through=bae58cf61479986431bb798acbe5a688a591c18c`（2026-09-17）、`reviewed_pr_through=1936`、`reviewed_issue_through=1935`。
