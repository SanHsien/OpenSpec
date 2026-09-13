# GEMINI.md

本專案是 `SanHsien/OpenSpec`，fork 自 `Fission-AI/OpenSpec`（MIT License）。
為 Gemini / Antigravity 與相關代理提供之維護指引。

## 代理核心規範

1. **環境假設**：Windows 11 原生（不是 WSL）。路徑、換行、編碼以 Windows PowerShell 為標準。
2. **對外邊界**：PR、push、release 一律指向 `SanHsien/OpenSpec`。嚴禁向 `Fission-AI/OpenSpec` 提交任何 PR、推送或 Release。
3. **回報標準**：回報「完成／修好／測試通過」之前，必須實際執行驗證並提供指令輸出，杜絕未經執行的虛構回報。
4. **維護門禁**：提交前必須執行 `pwsh -NoProfile -File tools\dev_check.ps1` 確保綠燈。
5. **語言慣例**：所有回覆與維護文件使用繁體中文；術語與 API 維持英文。

## 常用指令

```powershell
# 安裝依賴
pnpm install

# 構建專案
pnpm run build

# 執行本地門禁
pwsh -NoProfile -File tools\dev_check.ps1
```