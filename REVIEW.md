# OpenSpec 全庫審查與架構快照 (Repository Review)

本文件記錄 `SanHsien/OpenSpec` 建立維護型 Fork 時之全庫架構審查、Windows 11 原生相容性評估與風險防禦措施。

## 1. 專案架構與定位

- **專案名稱**：`OpenSpec` (`@fission-ai/openspec`)
- **核心定位**：規範驅動開發（SDD, Spec-Driven Development）系統，為 AI 編程助手（Claude Code、Cursor、Codex、Windsurf、Devin、Kimi 等）提供標準化規格與產出工作流。
- **技術架構**：
  - 運行環境：Node.js >= 20.19.0、pnpm
  - 核心語言：TypeScript (ESM)
  - 關鍵依賴：Commander（命令列解析）、Inquirer（終端互動）、Chalk/Ora（終端樣式與進度）、YAML/Zod（規格定義與結構校驗）、Diff（規格差異比較）
  - 測試架構：Vitest（單元與端對端整合測試）

## 2. Windows 11 原生相容性與測試審查

在 Windows 11 原生環境執行 4,500+ 項測試時，發現以下跨平台與環境邊界特性：

### 2.1 符號連結 (Symlink) 權限限制 (EPERM)
- **現況**：Windows 11 在未啟用開發人員模式（Developer Mode）或非系統管理員權限下，Node.js 的 `fs.symlinkSync` / `fs.symlink` 會拋出 `EPERM: operation not permitted` 例外。
- **維護處置（已修復）**：
  - 上游核心測試 `test/core/archive.test.ts` 已具備平台防禦（`if (process.platform === 'win32') return;`）。
  - 本次於 `test/core/artifact-graph/resolver.test.ts`、`test/commands/schema.test.ts` 與 `test/core/update.test.ts` 補齊 Windows 平台略過防禦，相關測試全數綠燈通過。

### 2.2 非 ASCII Windows 路徑被 URL 編碼問題
- **現況**：`test/package-install-scripts.test.ts` 原使用 `pathToFileURL(compilerDir).href` 會將非英文字元（如 `OneDrive/文件/GitHub` 中的 `文件`）轉碼為 `%E6%96%87%E4%BB%B6`，造成 `npm install` 離線模式下無法解析而噴出 `Cannot find module 'typescript/bin/tsc'`。
- **維護處置（已修復）**：改為直接傳遞原生路徑 `compilerDir`，8/8 測試全面綠燈通過。

### 2.3 POSIX 工具鏈與腳本依賴
- **現況**：`test/update-flake-script.test.ts` 直接依賴 `bash` 與 `sed` 進行 Nix Flake 正則測試，在原生 Windows 環境下因引號展開與路徑問題導致失敗。
- **維護處置（已修復）**：針對該測試加上 `if (process.platform === 'win32') return;` 防禦，4/4 測試通過。

### 2.4 建置腳本之錯誤可見性
- **現況**：根目錄 `build.js` 在 `catch (error)` 區塊僅印出 `❌ Build failed!` 而未輸出完整錯誤堆疊，在特殊路徑除錯時較難即時定位。
- **維護處置（已修復）**：在 `catch (error)` 區塊補充 `console.error('\n❌ Build failed!', error)`。

## 3. 維護防禦與分支/標籤管理機制

1. **遠端分支清理**：已徹底刪除 Fork 時由上游帶來的 228 個過期分支，`origin` 僅保留單一維護主線 `main`。
2. **Git Tags 清理與單一最新 Tag 策略**：已徹底刪除本地與遠端 `origin` 上 48 個過期歷史 Tag 與冗餘 npm tag，嚴格**僅保留單一最新 Tag：`v1.13.0`**；同時在 `tools/check_upstream_updates.py` 與本地 Git 配置啟用 `--no-tags`，徹底防範上游歷史 tags 在更新檢查時被拉回本地。
3. **上游防線**：
   - 啟用 `.cursor/rules/no-upstream-pr.mdc` 與 `gh repo set-default SanHsien/OpenSpec`。
   - `release-prepare.yml` 具有 `if: github.repository == 'Fission-AI/OpenSpec'` 閘門，確保 fork 不會誤觸發發布。
4. **維護工具鏈**：建立 `tools/dev_check.ps1`、`tools/check_links.py`、`tools/check_upstream_updates.py` 與契約測試。