# 開發指南 (Development Guide)

本文件說明如何在 Windows 11 原生環境下開發與驗證 `SanHsien/OpenSpec`。

## 環境需求

- **作業系統**：Windows 11 原生（PowerShell 7+ 或 Windows PowerShell 5.1）
- **Node.js**：>= 20.19.0
- **pnpm**：>= 10.0.0
- **Python**：>= 3.10（用於維護工具與連結檢查，標準函式庫即可）
- **Git & GitHub CLI (`gh`)**：最新穩定版，且已完成驗證

## 快速上手

```powershell
# 1. 複製儲存庫
git clone https://github.com/SanHsien/OpenSpec.git
cd openspec

# 2. 執行一鍵環境初始化
pwsh -NoProfile -File tools\bootstrap_dev.ps1

# 3. 執行本地門禁驗證
pwsh -NoProfile -File tools\dev_check.ps1
```

## 日常指令

### 專案構建

```powershell
# 執行 TypeScript 編譯與打包
pnpm run build

# 僅做 TypeScript 型別檢查
pnpm exec tsc --noEmit
```

### 測試執行

```powershell
# 執行維護契約測試
pnpm exec vitest run test/fork-hygiene.test.ts

# 執行全套單元測試
pnpm test
```

### 門禁與檢查

```powershell
# 檢查 Markdown 相對連結有效性
python tools/check_links.py

# 檢查上游更新水位
python tools/check_upstream_updates.py --strict

# 檢查依賴新鮮度
python tools/check_dependency_freshness.py
```

## 提交規範

1. 提交前務必確認 `pwsh -NoProfile -File tools\dev_check.ps1` 全綠。
2. 提交訊息採用 Conventional Commits（例如 `feat: ...`、`fix: ...`、`docs: ...`）。
3. 所有推送一律指向 `origin/main`。