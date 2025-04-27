const MAX_TOKEN = 8000;
let lastURL = "";
let APP_MODE = "";
let currentModel = "";
let articleText = "";

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    }
  })();
}

function insertHtml() {
  var readabilityBar = document.querySelector("#ReadabilityBar");

  if (readabilityBar) {
    return;
  }

  var htmlReadabilityBarCode = `<div id="ReadabilityBar" style="display: none;" >
  <div id="viewBar">
    <a href="javascript:void(0)" id="ReadabilityButton">
      <img src="${browser.runtime.getURL('images/icon.png')}" width="30" height="30" alt="Toolbar Icon">
    </a>
  </div>
</div>`;

  var htmlReadabilityBoxFrameCode = `<div id="ReadabilityBlurBackgroundBox" class="readabilityBlurBackgroundBox"></div>
<div class="readabilityBlurBox"></div>
<div id="ReadabilityBoxFrame">
    <div id="ReadabilityBox" class="ReadabilityFont">

        <div id="ReadabilityKeyboard" class="ReadabilityStyle morePadding">
            <div class="readabilityInput fixMorePadding">
                <textarea id="ReadabilityTextarea" placeholder="Reply (Enter for Send)" rows="1"
                    class="readabilityInsideStyle"></textarea>

                <div id="ReadabilityClose" class="readabilityCursorPointer readabilityInsideStyle">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" data-noir-inline-color="">
                        </path>
                        <path d="M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" data-noir-inline-color="">
                        </path>
                    </svg>
                </div>

                <div id="ReadabilitySend" class="readabilityCursorPointer readabilityInsideStyle" style="display: none">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-linecap="round"
                        stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 14 21 3"></path>
                        <path d="m21 3-6.5 18a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1L21 3Z"></path>
                    </svg>
                </div>

                <div id="ReadabilityErrorResend"
                    class="readabilityCursorPointer readabilityInsideStyle readabilityError" style="display: none;">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-linecap="round"
                        stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"></path>
                        <path d="M12 8h.01"></path>
                        <path d="M11 12h1v4h1"></path>
                    </svg>

                    <span>Retry</span>
                </div>
            </div>
        </div>

        <div id="ReadabilityMessageGroup">
            <div id="ReadabilityFrame" class="ReadabilityStyle morePadding">
                <div id="response" class="typing"></div>
                <div id="receipt"></div>
            </div>

            <div id="ReadabilityMessageButtons">
                <div id="ReadabilityReanswer" class="readabilityMessageButton ReadabilityStyle">
                    Reanswer
                </div>
                <div id="ReadabilitySwitchModel" class="readabilityMessageButton ReadabilityStyle">
                    Switch Model
                </div>
                <div id="ReadabilitySettings" class="readabilityMessageButton ReadabilityStyle">
                    <a href="${browser.runtime.getURL('settings.html')}" target="_blank">
                        Settings
                    </a>
                </div>
            </div>

        </div>

        <div id="ReadabilityUserinfo" class="ReadabilityStyle morePadding">
            <div class="safariExtensionUserInfo">
                <p class="safariExtensionTitle" id="ReadabilityTitle">Title</p>
                <p class="safariExtensionHost readabilityTips" id="ReadabilityHost">
                    www
                </p>
            </div>
        </div>

        <div style="padding-top: 150px;"></div>

    </div>
</div>`;
  document.body.insertAdjacentHTML(
    "beforeend",
    htmlReadabilityBarCode + htmlReadabilityBoxFrameCode
  );

  document
    .querySelector("#ReadabilityButton")
    .addEventListener("click", runSummary);

  document
    .querySelector("#ReadabilityClose")
    .addEventListener("click", hideView);

  document
    .querySelector("#ReadabilityBlurBackgroundBox")
    .addEventListener("click", hideView);

  document
    .querySelector("#ReadabilitySend")
    .addEventListener("click", sendReply);

  document
    .querySelector("#ReadabilityReanswer")
    .addEventListener("click", reanswer);

  document
    .querySelector("#ReadabilitySwitchModel")
    .addEventListener("click", () => {
      currentModel = currentModel === API_ADV_MODEL ? API_MODEL : API_ADV_MODEL;
      document.querySelector(
        "#ReadabilityHost"
      ).innerHTML = `${window.location.host} | ${currentModel}`;
    });

  document
    .querySelector("#ReadabilityErrorResend")
    .addEventListener("click", resend);

  document
    .querySelector("#ReadabilityFrame")
    .addEventListener("click", () => {
      const responseElem = document.querySelector("#response");
      if (responseElem && responseElem.innerText) {
        navigator.clipboard.writeText(responseElem.innerText)
          .then(() => {
            const frame = document.querySelector("#ReadabilityFrame");
            const originalBackgroundColor = frame.style.backgroundColor;
            frame.style.transition = "background-color 0.1s";

            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const highlightColor = isDarkMode ? "rgba(14, 36, 60, 0.85)" : "rgba(144, 202, 249, 0.85)";

            frame.style.backgroundColor = highlightColor;
            setTimeout(() => {
              frame.style.backgroundColor = originalBackgroundColor;
              setTimeout(() => frame.style.transition = "", 100);
            }, 200);
          })
          .catch(err => console.error("Failed to copy text: ", err));
      }
    });

  document
    .querySelector("#ReadabilityMessageGroup")
    .addEventListener("click", (event) => {
      const replyElement = event.target.closest(".readabilityReply");
      if (replyElement) {
        const text = replyElement.innerText;
        navigator.clipboard.writeText(text)
          .then(() => {
            const originalBackgroundColor = replyElement.style.backgroundColor;
            replyElement.style.transition = "background-color 0.1s";

            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const highlightColor = isDarkMode ? "rgba(14, 36, 60, 0.85)" : "rgba(144, 202, 249, 0.85)";

            replyElement.style.backgroundColor = highlightColor;
            setTimeout(() => {
              replyElement.style.backgroundColor = originalBackgroundColor;
              setTimeout(() => replyElement.style.transition = "", 100);
            }, 200);
          })
          .catch(err => console.error("Failed to copy text: ", err));
      }
    });

  document
    .querySelector("#ReadabilityUserinfo")
    .addEventListener("click", function () {
      if (articleText && articleText.trim() !== "") {
        navigator.clipboard.writeText(articleText)
          .then(() => {
            const userInfo = document.querySelector("#ReadabilityUserinfo");
            const originalBackgroundColor = userInfo.style.backgroundColor;
            userInfo.style.transition = "background-color 0.1s";

            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const highlightColor = isDarkMode ? "rgba(14, 36, 60, 0.85)" : "rgba(144, 202, 249, 0.85)";

            userInfo.style.backgroundColor = highlightColor;
            setTimeout(() => {
              userInfo.style.backgroundColor = originalBackgroundColor;
              setTimeout(() => userInfo.style.transition = "", 100);
            }, 200);
          })
          .catch(err => console.error("Failed to copy article text: ", err));
      }
    });

  document
    .addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        hideView();
      }
    });

  hideID("ReadabilityReanswer");

  const textArea = document.getElementById("ReadabilityTextarea");
  textArea.addEventListener("input", () => {
    let ln = textArea.value.length;
    if (ln != 0) {
      hideClose();
    } else {
      showClose();
    }
  });

  textArea.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // 防止換行
      sendReply();
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
  var parentDiv = document.getElementById("ReadabilityMessageGroup");

  // 创建新的 div 元素
  var newDiv = document.createElement("div");
  var timestamp = Date.now(); // 获取当前时间戳
  newDiv.id = "ReplyMessage" + timestamp;

  if (userReply) {
    newDiv.className =
      "ReadabilityStyle morePadding readabilityReply readabilityUserReply";
  } else {
    newDiv.className = "ReadabilityStyle morePadding readabilityReply";
  }

  newDiv.innerText = message;

  parentDiv.appendChild(newDiv);

  document.getElementById("ReadabilityTextarea").value = "";
  showClose();
}

function sendReply() {
  let textValue = document.getElementById("ReadabilityTextarea").value;

  if (textValue.length <= 0) {
    return;
  }

  insertMessage(textValue, true);
  setTimeout(() => {
    insertMessage("", false);
    sendReplytext(textValue);
  }, 500);
}

function showClose() {
  document.querySelector("#ReadabilityClose").style.display = "flex";
  document.querySelector("#ReadabilitySend").style.display = "none";
}

function hideClose() {
  document.querySelector("#ReadabilityClose").style.display = "none";
  document.querySelector("#ReadabilitySend").style.display = "flex";
}

function hideView() {
  document.body.style.overflow = "auto";
  const boxFrame = document.querySelector("#ReadabilityBoxFrame");
  const blurBackground = document.querySelector("#ReadabilityBlurBackgroundBox");
  const blurBox = document.querySelector(".readabilityBlurBox");

  boxFrame.style.opacity = '0';
  boxFrame.style.transition = 'opacity 0.3s';
  blurBackground.style.opacity = '0';
  blurBackground.style.transition = 'opacity 0.3s';
  blurBox.style.opacity = '0';
  blurBox.style.transition = 'opacity 0.3s';

  setTimeout(() => {
    boxFrame.style.display = "none";
    boxFrame.style.opacity = '1';
    boxFrame.style.transition = '';
    blurBackground.style.display = "none";
    blurBackground.style.opacity = '1';
    blurBackground.style.transition = '';
    blurBox.style.display = "none";
    blurBox.style.opacity = '1';
    blurBox.style.transition = '';
  }, 300);
  if (APP_MODE == "modeMiniIcon") {
    showID("ReadabilityBar", "flex");
  }
}

function runSummary() {
  document.querySelector("#ReadabilityBlurBackgroundBox").style.display = "block";
  document.querySelector(".readabilityBlurBox").style.display = "block";
  document.querySelector("#ReadabilityBoxFrame").style.display = "flex";
  document.querySelector("#ReadabilityBar").style.display = "none";
  document.body.style.overflow = "hidden";
  callGPT();
}

function resetGPT() {
  messagesGroup = [];
}

function callGPT() {
  let article = new Readability(document.cloneNode(true), {}).parse();

  if (!article) {
    console.log("Content: No article content found");
    return;
  }

  // reset
  if (lastURL != window.location.href) {
    resetGPT();
  }

  if (messagesGroup.length > 0) {
    console.log("Content: Messages group not empty, skipping");
    return;
  }

  document.querySelector("#response").innerHTML = "";
  articleText = postProcessText(article.textContent);

  document.querySelector("#receipt").innerHTML = "";
  document.querySelector("#ReadabilityTitle").innerHTML = article.title;
  document.querySelector(
    "#ReadabilityHost"
  ).innerHTML = `${window.location.host} | ${API_MODEL}`;

  callGPTSummary(articleText);
}
