# 貢獻指南 (Contributing)

感謝您對本維護型 Fork 的關注。本專案為 `SanHsien/OpenSpec`，針對 Windows 11 原生環境、繁體中文文件體系與持續工程硬化進行維護。

## 核心規則：對外只打本 Fork

- 所有 Pull Request、Issue、Commit 與 Release 均**僅針對 `SanHsien/OpenSpec`**。
- **嚴禁向原作者上游 (`Fission-AI/OpenSpec`) 提交任何非經明確授權之變更或 PR**。
- 請確認本機設定：
  ```powershell
  gh repo set-default SanHsien/OpenSpec
  ```

## 本地開發與驗證

1. 環境需求：Node.js >= 20.19.0、pnpm >= 10.0.0、Python 3.10+。
2. 安裝依賴：
   ```powershell
   pwsh -NoProfile -File tools\bootstrap_dev.ps1
   ```
3. 提交變更前必須通過一鍵本地門禁：
   ```powershell
   pwsh -NoProfile -File tools\dev_check.ps1
   ```
4. 提交訊息請依循 Conventional Commits 格式（例如 `feat: ...`, `fix: ...`, `docs: ...`）。
