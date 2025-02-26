# EisonAI

EisonAI 是一個智能的 Safari 瀏覽器插件，使用先進的大語言模型（LLM）技術來自動總結網頁內容。它能夠智能提取網頁的主要內容，並生成精確的摘要，幫助用戶快速理解網頁要點。

## 功能特點

- **智能內容提取**：使用 Readability 技術自動識別和提取網頁的主要內容
- **AI 智能總結**：使用大語言模型生成網頁內容的精確摘要
- **互動式對話**：支持與 AI 進行多輪對話，深入探討網頁內容
- **優雅的界面**：
  - 迷你浮動按鈕，不影響網頁瀏覽
  - 簡潔的對話框設計
  - 支持明暗主題自適應
- **靈活的顯示模式**：
  - 迷你圖標模式：在頁面角落顯示小圖標
  - 隱藏模式：完全隱藏，通過快捷鍵喚出

![EisonAI 使用界面](assets/images/SCR-20250227-ghmf.jpeg)

## 系統要求

- macOS 12.0 或更高版本（用於 macOS Safari 插件）
- iOS 15.0 或更高版本（用於 iOS Safari 插件）
- Safari 15.0 或更高版本

## 安裝方法

1. 從 App Store 下載 EisonAI
2. 在 Safari 設定中啟用 EisonAI 插件：
   - 打開 Safari 偏好設定
   - 點擊「擴展」標籤
   - 勾選 EisonAI 插件

## 使用方法

1. **開啟總結**：
   - 點擊瀏覽器右下角的 EisonAI 圖標
   - 或使用配置的快捷鍵

2. **查看摘要**：
   - 插件會自動提取頁面內容
   - 使用 AI 生成內容摘要
   - 顯示網頁標題和來源信息

3. **深入對話**：
   - 在對話框中輸入問題
   - 按 Enter 發送
   - 與 AI 進行多輪對話，深入探討內容

4. **重新生成**：
   - 如果對摘要不滿意，可以點擊 "Reanswer" 重新生成
   - 系統會重新分析網頁內容並生成新的摘要

## 開發環境設置

1. 克隆倉庫：
```bash
git clone https://github.com/yourusername/eisonAI.git
cd eisonAI
```

2. 安裝依賴：
```bash
bundle install
```

3. 開啟 Xcode 項目：
```bash
open eisonAI.xcodeproj
```

## 貢獻指南

歡迎貢獻！請查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何參與項目開發。

## 行為準則

本項目遵循 [行為準則](CODE_OF_CONDUCT.md)，請所有參與者遵守。

## 許可證

本項目基於 MIT 許可證開源 - 查看 [LICENSE](LICENSE) 文件了解更多信息。