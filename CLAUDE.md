# CLAUDE.md

本專案是 `SanHsien/OpenSpec`，fork 自 `Fission-AI/OpenSpec`（MIT License）。
規範驅動開發（SDD）AI 編程助手體系之 Windows-first 維護線。

## 常用指令

```powershell
# 安裝依賴
pnpm install

# 編譯與構建
pnpm run build

# 執行測試
pnpm test

# 執行單一測試
pnpm exec vitest run test/fork-hygiene.test.ts

# 執行 Windows 一鍵本機門禁
pwsh -NoProfile -File tools\dev_check.ps1
```

## 開發守則

1. **對外邊界**：PR、push、release 一律指向 `SanHsien/OpenSpec`，嚴禁向 `Fission-AI/OpenSpec` 開 PR 或 push。
2. **作業系統**：主要運行於 Windows 11 原生環境（PowerShell），路徑以 Windows 規範處理。
3. **文件原則**：繁體中文為主；若修改英文說明，同步維持 `README.en.md`。
4. **驗收門禁**：修改完成後，必須實際執行 `tools\dev_check.ps1` 並確認 100% 通過。