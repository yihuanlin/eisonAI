# Content.js 技術文檔

## 檔案概述

這是一個瀏覽器擴展的核心內容腳本（Content Script），主要負責處理網頁內容的讀取、摘要生成以及使用者介面的互動。

## 核心常量

```javascript
const MAX_TOKEN = 8000;  // 最大 token 限制
```

## 主要功能模組

### 1. 消息處理系統

通過 `browser.runtime.onMessage` 監聽來自擴展其他部分的消息：

- `runSummary`: 執行內容摘要
- `setMode`: 設置顯示模式
- `getDebugText`: 獲取調試文本

### 2. 初始化系統

- `ready()`: 頁面載入完成後的初始化函數
- `setupGPT()`: 設置 GPT 相關配置
- `insertHtml()`: 插入必要的 UI 元素

### 3. UI 組件

包含兩個主要的 HTML 模板：
- `htmlReadabilityBarCode`: 浮動按鈕 UI
- `htmlReadabilityBoxFrameCode`: 對話框主體 UI

### 4. 事件處理

主要事件監聽器包括：
- 浮動按鈕點擊
- 關閉按鈕
- 背景遮罩點擊
- 發送按鈕
- 重新回答按鈕
- 錯誤重試按鈕
- 輸入框事件

### 5. 核心功能

#### 摘要生成
```javascript
function runSummary() {
  // 顯示介面
  // 處理文章摘要
  processArticleSummary(elements);
}
```

#### 訊息處理
```javascript
function insertMessage(message, userReply) {
  // 創建並插入訊息元素
  // 處理使用者回覆
}
```

#### 文章處理
```javascript
async function processArticleSummary(elements) {
  // 使用 Readability 解析文章
  // 處理文章內容
  // 調用 GPT 生成摘要
}
```

## 模式控制

支援兩種顯示模式：
- `modeMiniIcon`: 顯示最小化圖標
- `modeHidden`: 隱藏所有 UI 元素

## 技術特點

1. 使用 Readability.js 進行網頁內容解析
2. 實現了打字機效果的訊息顯示
3. 支援鍵盤快捷操作（Enter 發送）
4. 響應式 UI 設計
5. 模塊化的事件處理系統

## 依賴項

- browser API
- Readability.js
- GPT 相關配置（外部依賴）

## 注意事項

1. 文章處理時會克隆 DOM 以避免修改原始內容
2. 使用 MAX_TOKEN 限制處理的文本長度
3. 實現了消息去重和狀態管理
4. UI 元素採用動態插入方式，避免與頁面現有元素衝突