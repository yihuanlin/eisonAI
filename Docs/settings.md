# Settings 頁面技術文檔

## 檔案概述

settings.js 和 settings.html 組成了擴展的設置頁面，提供 API 配置和提示詞管理功能。

## HTML 結構 (settings.html)

### 安全性配置

```html
<meta
  http-equiv="Content-Security-Policy"
  content="script-src 'self' 'nonce-ABC123';"
/>
```

### 主要區塊

1. ChatGPT API 配置區

```html
<div class="viewBlock pathBorder contentLeft flexColumn gap10">
  <h5>API URL</h5>
  <input id="APIURL" class="inputStyle flex1" type="text" />
  <h5>API Key</h5>
  <input id="APIKEY" class="inputStyle flex1" type="text" />
  <h5>API Model</h5>
  <input id="APIMODEL" class="inputStyle flex1" type="text" />
</div>
```

2. Prompt 配置區

```html
<div class="viewBlock pathBorder contentLeft flexColumn gap10">
  <h5>System Text</h5>
  <textarea id="SystemText" class="inputStyle flex1"></textarea>
  <h5>Prompt</h5>
  <textarea id="Prompt" class="inputStyle flex1"></textarea>
</div>
```

### 特殊效果

1. 點狀動畫

```css
@keyframes dotFlashingAnimation {
  0% {
    content: ".";
  }
  50% {
    content: "..";
  }
  100% {
    content: "...";
  }
}
```

2. 跳躍動畫

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

### 深色模式支援

```css
@media (prefers-color-scheme: dark) {
  html,
  body {
    background-color: #1f2225;
  }
}
```

## JavaScript 功能 (settings.js)

### 核心功能

1. 數據存儲管理

```javascript
// 儲存資料
async function saveData(key, data) {
  try {
    const obj = {};
    obj[key] = data;
    await browser.storage.local.set(obj);
  } catch (error) {
    console.log(error);
  }
}

// 讀取資料
async function loadData(key, defaultValue) {
  try {
    const result = await browser.storage.local.get(key);
    const data = result[key];
    return data === undefined
      ? defaultValue === undefined
        ? ""
        : defaultValue
      : data;
  } catch (error) {
    console.log(error);
    return "";
  }
}
```

2. API 設置管理

```javascript
async function setupAPISettings() {
  await setupGPT();
  // 填充 API 相關設置
  document.getElementById("APIURL").value = API_URL;
  document.getElementById("APIKEY").value = API_KEY;
  document.getElementById("APIMODEL").value = API_MODEL;
  document.getElementById("Prompt").innerText = APP_PromptText;
  document.getElementById("SystemText").innerText = APP_SystemText;
}
```

3. API 驗證機制

```javascript
function checkAPI() {
    // URL 格式驗證
    if (!API_URL.startsWith("https://")) {
        callbackText.innerText = "Please enter the HTTPS URL";
        return;
    }

    // API 連接測試
    try {
        await apiPostMessage(
            callbackText,
            function () {
                document.getElementById("SaveAPI").removeAttribute("disabled");
            },
            API_URL,
            API_KEY,
            API_MODEL
        );
    } finally {
        document.getElementById("CheckAPI").value = "Check";
        document.getElementById("CheckAPI").disabled = false;
    }
}
```

### 數據交互流程

1. 初始化階段

- 載入已保存的 API 設置
- 設置按鈕事件監聽器
- 填充表單數據

2. API 設置保存流程

- 驗證 API URL 格式
- 測試 API 連接
- 成功後啟用保存按鈕
- 保存設置到本地儲存

3. Prompt 設置保存流程

- 讀取表單數據
- 保存到本地儲存
- 提供視覺反饋

### 安全性考慮

1. CSP (Content Security Policy)

- 限制腳本來源
- 只允許 HTTPS 連接
- 使用 nonce 驗證

2. 輸入驗證

- API URL 格式檢查
- HTTPS 協議要求
- 路徑結構驗證

## 技術特點

1. 非同步操作處理
2. 本地存儲管理
3. 安全性控制
4. 錯誤處理機制
5. UI 反饋系統

## 依賴項

- browser API
- contentGPT.js
- popup.css

## 重要注意事項

1. API 設置時必須使用 HTTPS
2. URL 必須符合特定格式 (https://example.com/v1)
3. 保存按鈕在 API 驗證成功後才會啟用
4. 所有設置都會持久化到本地存儲
5. 支援深色模式自動適配
