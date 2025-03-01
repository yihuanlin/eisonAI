const MAX_TOKEN = 8000;
let lastURL = "";
let APP_MODE = "";

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content / Received Message: ", request);

  switch (request) {
    case "runSummary":
      runSummary();
      sendResponse({ callback: "runSummary-ok" });
      break;
    case "setMode":
      ReadabilityBarMode();
      sendResponse({ callback: "setMode-ok" });
      break;
    case "getDebugText":
      getDebugText();
      sendResponse({ callback: "coreContentText-ok" });
      break;
    default:
      // Handle unexpected requests if needed
      break;
  }
});

if (document.readyState !== "loading") {
  ready();
} else {
  document.addEventListener("DOMContentLoaded", function () {
    ready();
  });
}

function sendMessage(obj) {
  browser.runtime.sendMessage(obj);
}

function getDebugText() {
  let article = new Readability(document.cloneNode(true), {}).parse();

  sendMessage({
    message: "debugText",
    body: article.textContent,
  });
}

//

function ready() {
  (async () => {
    let bool = await setupGPT();

    if (bool) {
      insertHtml();
      console.log("Eison init:", API_URL, API_KEY, API_MODEL);
    }
  })();
}

function insertHtml() {
  var readabilityBar = document.querySelector("#ReadabilityBar");

  if (readabilityBar) {
    return;
  }

  var htmlReadabilityBarCode = `
  <div id="ReadabilityBar" style="display: none;">
  <div class="readability-ui-float-button">
      <div class="readability-ui-float-button-icon" id="ReadabilityButton">
      <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
          d="M0 6.66667C0 2.98477 2.98477 0 6.66667 0H11.1111C14.793 0 17.7778 2.98477 17.7778 6.66667V11.1111C17.7778 14.793 14.793 17.7778 11.1111 17.7778H1.66667C0.746192 17.7778 0 17.0316 0 16.1111V6.66667Z"
          fill="#FFD86D" />
      <circle cx="8.88888" cy="7.22225" r="2.77778" stroke="currentColor" stroke-width="1.11111" />
      <circle cx="16.6666" cy="7.22225" r="2.77778" stroke="currentColor" stroke-width="1.11111" />
      <path d="M9.44446 6.94458V8.05569" stroke="currentColor" stroke-width="1.11111" stroke-linecap="round" />
      <path d="M13.4722 6.66675H12.2222" stroke="currentColor" stroke-width="1.11111" stroke-linecap="round" />
      <path d="M16.1111 6.94458V8.05569" stroke="currentColor" stroke-width="1.11111" stroke-linecap="round" />
      <path d="M10.5555 12.959V12.959C12.1488 13.2533 13.7949 12.9934 15.22 12.2224V12.2224"
          stroke="currentColor" stroke-width="1.11111" stroke-linecap="round" />
      </svg>
      </div>
  </div>
  </div>
  `;

  var htmlReadabilityBoxFrameCode = `
<div id="ReadabilityBoxFrame">
<div class="readability-ui-blur"></div>
<div id="ReadabilityBlurBackgroundBox" class="readability-ui-blur-background"></div>
<div id="ReadabilityBox" class="readability-ui-container" >

<div id="ReadabilityKeyboard" class="readability-ui-card readability-ui-padding">
<div class="readability-ui-input-group readability-ui-fix-padding">
   <div id="ReadabilityTextarea" class="readability-ui-input" contenteditable="true" data-placeholder="Reply (Enter for Send)"></div>

   <div id="ReadabilityClose" class="readability-ui-button readability-ui-icon">
       <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
           <path d="M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" data-noir-inline-color="">
           </path>
           <path d="M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" data-noir-inline-color="">
           </path>
       </svg>
   </div>

   <div id="ReadabilitySend" class="readability-ui-button readability-ui-icon" style="display: none">
       <svg width="16" height="16" fill="none" stroke="currentColor" stroke-linecap="round"
           stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"
           xmlns="http://www.w3.org/2000/svg">
           <path d="M10 14 21 3"></path>
           <path d="m21 3-6.5 18a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1L21 3Z"></path>
       </svg>
   </div>

   <div id="ReadabilityErrorResend" class="readability-ui-button readability-ui-icon readability-ui-error"
   style="display: none;">
   <svg width="16" height="16" fill="none" stroke="currentColor" stroke-linecap="round"
       stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24"
       xmlns="http://www.w3.org/2000/svg">
       <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"></path>
       <path d="M12 8h.01"></path>
       <path d="M11 12h1v4h1"></path>
   </svg>

   <div class="readability-ui-text">Retry</div>
   </div>
</div>
</div>
<!-- ReadabilityKeyboard / End  -->

<div id="ReadabilityMessageGroup">
<div id="ReadabilityFrame" class="readability-ui-card readability-ui-padding">
   <div id="ReadabilityLoading" class="readability-ui-loading">
       <div class="readability-ui-text">Eison · 愛省流君</div>
   </div>
   <div id="response" class="readability-ui-text typing"></div>
   <div id="receiptTitle" class="readability-ui-text"></div>
   <div id="receipt" class="readability-ui-text"></div>
</div>

<div id="ReadabilityMessageButtons">
<div id="ReadabilityReanswer" class="readability-ui-button readability-ui-card">
   <div class="readability-ui-text">Reanswer</div>
</div>
</div>
<!-- ReadabilityMessageButtons / End -->

</div>
<!-- ReadabilityMessageGroup / End  -->

<div id="ReadabilityUserinfo" class="readability-ui-card readability-ui-padding">
<div class="readability-ui-userinfo">
   <div class="readability-ui-title" id="ReadabilityTitle">Title</div>
   <div class="readability-ui-subtitle" id="ReadabilityHost">
       www
   </div>
</div>
</div>
<!-- ReadabilityUserinfo / End  -->

<div class="readability-ui-spacer"></div>

</div>
<!-- ReadabilityBox / End  -->
</div>
`;

  document.body.insertAdjacentHTML(
    "beforeend",
    htmlReadabilityBarCode + htmlReadabilityBoxFrameCode
  );

  // 使用類選擇器綁定事件
  const elements = {
    button: document.querySelector(".readability-ui-float-button-icon"),
    close: document.querySelector("#ReadabilityClose"),
    background: document.querySelector("#ReadabilityBlurBackgroundBox"),
    send: document.querySelector("#ReadabilitySend"),
    reanswer: document.querySelector("#ReadabilityReanswer"),
    errorResend: document.querySelector("#ReadabilityErrorResend"),
    input: document.querySelector("#ReadabilityTextarea")
  };

  // 事件監聽
  elements.button.addEventListener("click", runSummary);
  elements.close.addEventListener("click", hideView);
  elements.background.addEventListener("click", hideView);
  elements.send.addEventListener("click", sendReply);
  elements.reanswer.addEventListener("click", reanswer);
  elements.errorResend.addEventListener("click", resend);

  hideID("ReadabilityReanswer");

  // 輸入框處理
  elements.input.addEventListener("input", () => {
    const hasContent = elements.input.textContent.trim().length > 0;
    if (hasContent) {
      hideClose();
    } else {
      showClose();
    }
  });

  elements.input.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const content = this.textContent.trim();
      if (content) {
        this.textContent = "";
        sendReply(content);
      }
    }
  });

  ReadabilityBarMode();
}

function ReadabilityBarMode() {
  (async () => {
    APP_MODE = await loadData("AppMODE", "modeMiniIcon");

    if (APP_MODE == "modeMiniIcon") {
      showID("ReadabilityBar");
    }

    if (APP_MODE == "modeHidden") {
      hideID("ReadabilityBar");
    }
  })();
}

function reanswer() {
  removeReadabilityReplies();
  resetGPT();
  runSummary();
}

// userReply:Bool
function insertMessage(message, userReply) {
  const parentDiv = document.getElementById("ReadabilityMessageGroup");
  const timestamp = Date.now();
  
  const messageDiv = document.createElement("div");
  messageDiv.id = `ReplyMessage${timestamp}`;
  messageDiv.className = `readability-ui-card readability-ui-message ${
    userReply ? "readability-ui-message-user" : ""
  }`;
  
  const textDiv = document.createElement("div");
  textDiv.className = "readability-ui-text";
  textDiv.textContent = message;
  
  messageDiv.appendChild(textDiv);
  parentDiv.appendChild(messageDiv);
  
  // 重置輸入框
  const input = document.querySelector("#ReadabilityTextarea");
  input.textContent = "";
  input.focus();
  showClose();
}

function sendReply(content) {
  const textContent = content || document.querySelector("#ReadabilityTextarea").textContent.trim();
  
  if (!textContent) {
    return;
  }

  insertMessage(textContent, true);
  
  // 添加打字動畫效果
  setTimeout(() => {
    insertMessage("", false);
    sendReplytext(textContent);
  }, 500);
}

function updateControlVisibility(showSend = false) {
  const controls = {
    close: document.querySelector("#ReadabilityClose"),
    send: document.querySelector("#ReadabilitySend")
  };
  
  controls.close.style.display = showSend ? "none" : "flex";
  controls.send.style.display = showSend ? "flex" : "none";
}

function showClose() {
  updateControlVisibility(false);
}

function hideClose() {
  updateControlVisibility(true);
}

function hideView() {
  document.body.style.overflow = "auto";
  document.querySelector("#ReadabilityBoxFrame").style.display = "none";
  
  if (APP_MODE === "modeMiniIcon") {
    showID("ReadabilityBar", "flex");
  }
}

function runSummary() {
  const elements = {
    frame: document.querySelector("#ReadabilityBoxFrame"),
    bar: document.querySelector("#ReadabilityBar"),
    response: document.querySelector("#response"),
    receipt: {
      title: document.querySelector("#receiptTitle"),
      content: document.querySelector("#receipt")
    },
    info: {
      title: document.querySelector("#ReadabilityTitle"),
      host: document.querySelector("#ReadabilityHost")
    }
  };

  // 顯示摘要介面
  elements.frame.style.display = "flex";
  elements.frame.classList.add("readability-ui-slide-up");
  elements.bar.style.display = "none";
  document.body.style.overflow = "hidden";

  // 開始處理摘要
  processArticleSummary(elements);
}

function resetGPT() {
  messagesGroup = [];
}

async function processArticleSummary(elements) {
  // 檢查 URL 變化
  if (lastURL !== window.location.href) {
    resetGPT();
  }

  if (messagesGroup.length > 0) {
    return;
  }

  // 解析文章
  const article = new Readability(document.cloneNode(true), {}).parse();
  if (!article) return;

  // 清理並準備介面
  elements.response.textContent = "";
  elements.receipt.title.textContent = "";
  elements.receipt.content.textContent = "";
  elements.info.title.textContent = article.title;
  elements.info.host.textContent = `${window.location.host} / ${API_MODEL}`;

  // 處理文章內容
  const articleText = postProcessText(article.textContent);
  callGPTSummary(articleText);
}
