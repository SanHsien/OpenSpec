<p align="center">
  <picture>
    <source srcset="assets/openspec_bg.png">
    <img src="assets/openspec_bg.png" alt="OpenSpec logo">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/SanHsien/OpenSpec/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/SanHsien/OpenSpec/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://www.npmjs.com/package/@fission-ai/openspec"><img alt="npm version" src="https://img.shields.io/npm/v/@fission-ai/openspec?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" /></a>
  <a href="README.en.md"><img alt="English README" src="https://img.shields.io/badge/Language-English-green.svg?style=flat-square" /></a>
</p>

<h3 align="center">為 AI 編程助手打造的規範驅動開發 (SDD) 體系</h3>

> **這是 `SanHsien` 維護的 OpenSpec 維護型 Fork。**
> 採 **Windows-first** 原生開發與工程硬化方針。原始英文文件請見 [README.en.md](README.en.md)，維護細節與邊界說明請見 [FORK.md](FORK.md)。

---

## 核心理念

```text
→ 流暢彈性，非僵化死板 (fluid not rigid)
→ 敏捷迭代，非瀑布流程 (iterative not waterfall)
→ 直覺易用，非複雜繁瑣 (easy not complex)
→ 專為既有專案 (Brownfield) 與全新專案 (Greenfield) 打造
→ 從小專案無縫擴展至企業級系統
```

## 運作流程範例

OpenSpec 透過清晰的產出物（Artifacts）引導 AI 代理，讓你在真正寫入程式碼前，先看清完整的規格與實作計畫：

```text
你:   /opsx:explore
AI:   您想探索什麼構想？
你:   我想加入深色模式，但希望做得乾淨且無多餘依賴。
AI:   我檢查了專案目前的樣式架構...
      最精簡的做法是：CSS 變數 + 輕量主題 Context，並支援系統色彩偏好偵測。
      需要為此構想建立提案嗎？
你:   好，開始吧。

你:   /opsx:propose add-dark-mode
AI:   已建立 openspec/changes/add-dark-mode/
      ✓ proposal.md — 為什麼做此變更、包含哪些調整
      ✓ specs/       — 需求規範與具體場景 (Gherkin/Markdown)
      ✓ design.md    — 技術架構與設計決策
      ✓ tasks.md     — 具體實作待辦清單
      準備好開始實作！

你:   /opsx:apply
AI:   正在依序完成任務...
      ✓ 1.1 建立主題 Context Provider
      ✓ 1.2 建立切換開關元件
      ✓ 2.1 定義 CSS 變數
      ✓ 2.2 串接 localStorage 狀態保存
      全部任務完成！

你:   /opsx:archive
AI:   已歸檔至 openspec/changes/archive/2026-add-dark-mode/
      規格已同步更新，隨時可開始下一個功能。
```

### 規格的樣貌

規格採用純文字 Markdown，無複雜語法：

```markdown
## ADDED Requirements

### Requirement: 主題切換
應用程式 SHALL 允許使用者在淺色與深色主題間切換，預設依循系統偏好。

#### Scenario: 使用者切換至深色模式
- **WHEN** 使用者點擊主題切換開關
- **THEN** 應用程式切換為深色模式並持久化儲存設定
```

---

## 快速開始

### 1. 安裝與初始化

在專案目錄下執行：

```powershell
# 透過 npm 全域安裝或 npx 執行
npx @fission-ai/openspec init
```

### 2. 支援的 AI 工具

OpenSpec 支援主流 AI 工具之 Slash Commands 與 Workflows：
- **Claude Code**
- **Cursor**
- **Codex**
- **Windsurf**
- **Devin**
- **Kimi Code / Amazon Q / Qwen**

---

## 本 Fork 維護特色

1. **Windows 11 原生優化**：提供純 PowerShell 開發門禁（`tools/dev_check.ps1`），持續硬化 Windows 原生路徑與相容性。
2. **多語言體系**：繁體中文主說明與官方英文雙軌對齊。
3. **嚴格上游防禦**：建立機械防線（`.cursor/rules/no-upstream-pr.mdc`），所有 PR/push 僅指向 `SanHsien/OpenSpec`。
4. **透明追蹤基線**：提供 `tools/check_upstream_updates.py` 與 `tools/upstream_baseline.json`，精確記錄審查水位。

相關文件導引：
- [FORK.md](FORK.md)：Fork 原因、架構邊界與同步方針
- [NOTICE.md](NOTICE.md)：版權歸屬與維護聲明
- [AGENTS.md](AGENTS.md)：AI 代理協作真相源
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)：Windows 本機開發指南
- [docs/DECISIONS.md](docs/DECISIONS.md)：架構決策紀錄 (ADR)
- [docs/UPSTREAM.md](docs/UPSTREAM.md)：上游基線與審查記錄
- [REVIEW.md](REVIEW.md)：全庫架構與跨平台快照

---

## 授權條款

本專案採用 [MIT License](LICENSE)。原始專案版權由 OpenSpec Contributors 所有。