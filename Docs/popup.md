# Popup 介面技術文檔

## 檔案概述

popup.js 和 popup.html 組成了擴展的彈出視窗介面，提供使用者控制面板功能。

## HTML 結構 (popup.html)

### 主要組件

1. 頂部標題欄

```html
<div class="flexLeft">
  <!-- Logo 和狀態指示器 -->
  <div id="StatusIcon" class="statusBox"></div>
  <div id="StatusText">{Status Text}</div>
</div>
```

2. 功能區域

- 網站資訊顯示
- AI 摘要按鈕
- 模式選擇面板
- 設置連結

3. 底部區域

- 版本資訊
- Logo 顯示

### 關鍵 UI 元素

1. AI 摘要按鈕

```html
<div
  id="SendRunSummaryMessage"
  class="mainButton clickListen"
  data-function="sendRunSummaryMessage"
></div>
```

2. 模式選擇框

- Mini icon 模式
- Hidden 模式

```html
<div class="flexCenter gap10">
  <div id="ModeMiniIconBox" class="modeSelectBox">...</div>
  <div id="ModeHiddenBox" class="modeSelectBox">...</div>
</div>
```

### 特殊效果

1. 跳躍動畫

```css
@keyframes jump {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}
```

## JavaScript 功能 (popup.js)

### 核心功能

1. 訊息傳遞

```javascript
function sendMessageToContent(message) {
  browser.tabs.query({ active: true }).then(function (currentTabs) {
    if (currentTabs[0].id >= 0) {
      browser.tabs.sendMessage(currentTabs[0].id, message);
    }
  });
}
```

2. 事件監聽器綁定

```javascript
function addClickListeners() {
  const buttons = document.querySelectorAll(".clickListen");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const functionName = button.getAttribute("data-function");
      // 動態執行對應函數
    });
  });
}
```

### 主要功能模組

1. API 配置管理

```javascript
function saveAPIConfig() {
  (async () => {
    let url = document.querySelector("#APIURL").value;
    let key = document.querySelector("#APIKEY").value;
    let model = document.querySelector("#APIMODEL").value;
    // 保存 API 配置
  })();
}
```

2. 顯示模式控制

```javascript
function selectMode(modeName) {
  saveData("AppMODE", modeName);
  sendMessageToContent("setMode");
}
```

3. 狀態管理

```javascript
function setupStatus() {
  // 檢查 API 配置
  // 測試 API 連接
  // 更新狀態顯示
}
```

### 平台適配

```javascript
function setPlatformClassToBody() {
  if (isIOS()) {
    document.body.classList.add("ios");
  } else if (isMacOS()) {
    document.body.classList.add("macos");
  } else {
    document.body.classList.add("other-platform");
  }
}
```

## 交互流程

1. 初始化

- 加載模式設置
- 設置按鈕監聽器
- 檢查 API 狀態
- 設置平台相關樣式

2. 用戶操作

- 點擊 AI 摘要按鈕
- 切換顯示模式
- 配置 API 設置
- 查看當前狀態

3. 狀態反饋

- API 狀態指示
- 模式選擇反饋
- 錯誤提示

## 技術特點

1. 動態函數調用
2. 異步操作處理
3. 平台自適應
4. 模組化設計
5. 響應式 UI

## 依賴項

- browser API
- contentGPT.js
- popup.css
