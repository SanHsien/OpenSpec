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