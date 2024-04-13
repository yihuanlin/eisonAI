let lastReplyMessage = "";
let messagesGroup = [];

let API_URL = "";
let API_KEY = "";
let API_MODEL = "";
let APP_PromptText = "";
let APP_SystemText = "";

async function setupGPT() {
  let systemText = `你是幫助用戶理解網頁內容的專家。`;

  let thisPrompt = `為最後提供的文字內容進行按要求的總結。如果是其他語言，請翻譯到繁體中文。
請嚴格按照下面的格式進行輸出，在格式以外的地方，不需要多餘的文本內容。

這裡是格式指導：
總結：
簡短的一句話概括內容，此單獨佔用一行，記得輸出換行符號；
要點：
對文字內容提出多個要點內容，並每一個要點都附加一個裝飾用的 emoji，每一個要點佔用一行，注意記得輸出換行符號；

下面為需要總結的文字內容：`;

  API_URL = await loadData("APIURL", "");
  API_KEY = await loadData("APIKEY", "");
  API_MODEL = await loadData("APIMODEL", "gpt-3.5-turbo");
  APP_PromptText = await loadData("APPPromptText", thisPrompt);
  APP_SystemText = await loadData("APPSystemText", systemText);

  if (API_URL == "") {
    return false;
  } else {
    return true;
  }
}

async function sendReplytext(text) {
  pushUserMessage(text);
  let elem = getMaxTimestampElem();

  await apiPostMessage(elem, function () {
    markdownMessage(elem);
  });
}

function resend() {
  (async () => {
    let elem = getMaxTimestampElem();

    if (elem == null) {
      reanswer();
    } else {
      await apiPostMessage(elem, function () {
        markdownMessage(elem);
      });
    }
  })();
}

function getMaxTimestampElem() {
  var elements = document.querySelectorAll('[id^="ReplyMessage"]');
  var maxTimestamp = -Infinity;
  var maxTimestampDiv = null;

  Array.from(elements).forEach(function (element) {
    var id = element.id;
    var timestamp = parseInt(id.replace("ReplyMessage", ""));
    if (timestamp > maxTimestamp) {
      maxTimestamp = timestamp;
      maxTimestampDiv = element;
    }
  });

  return maxTimestampDiv;
}

function puashAssistantMessage(text) {
  if (text.length <= 0) {
    return;
  }

  const messageWithRole = {
    role: "assistant",
    content: text,
  };

  messagesGroup.push(messageWithRole);
}

function pushUserMessage(text) {
  if (text.length <= 0) {
    return;
  }

  const messageWithRole = {
    role: "user",
    content: text,
  };

  console.log("UserMessage / length", text.length);

  messagesGroup.push(messageWithRole);
}

function setupSystemMessage() {
  let systemText = APP_SystemText;
  const systemMessage = {
    role: "system",
    content: systemText,
  };
  if (systemText.length > 0) {
    messagesGroup.push(systemMessage);
  }
}

// GPT 總結
async function callGPTSummary(inputText) {
  //Cache DOM elements to avoid unnecessary DOM traversals

  let responseElem = document.getElementById("response");
  lastReplyMessage = "";

  let assistantText = "";

  callLoading();
  showID("response");

  let userText = APP_PromptText + "<" + inputText + ">";

  if (userText.length <= 0) {
    typeSentence("userText Empty", responseElem);
    return;
  }

  if (inputText) {
    setupSystemMessage();
    puashAssistantMessage(assistantText);
    pushUserMessage(userText);

    try {
      await apiPostMessage(responseElem, function () {
        // GPT Done
        hideID("response");
        hideLoading();
        setupSummary();

        showID("ReadabilityReanswer");

        uiFocus(document.getElementById("ReadabilityFrame"));

        lastURL = window.location.href;
      });
    } catch (error) {
      typeSentence("API Error:" + error, responseElem);
    }
  } else {
    typeSentence("構建 User Message 失敗，請重新載入網頁後再試", responseElem);
  }
}

async function apiPostMessage(
  responseElem,
  callback,
  appAPIUrl,
  appAPIKey,
  appAPIModel
) {
  if (appAPIUrl === undefined) {
    appAPIUrl = API_URL;
  }

  if (appAPIKey === undefined) {
    appAPIKey = API_KEY;
  }

  if (appAPIModel === undefined) {
    appAPIModel = API_MODEL;
  }

  lastReplyMessage = ""; //reset LastMessage

  toggleClass(responseElem, "ReadabilityMessageTyping");

  try {
    hideID("ReadabilityErrorResend");

    let fetchURL = `${appAPIUrl}/chat/completions`;

    const response = await fetch(fetchURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + appAPIKey,
      },
      body: JSON.stringify({
        stream: true,
        model: appAPIModel,
        messages: messagesGroup,
        temperature: 0.1,
      }),
    });

    const reader = response.body
      ?.pipeThrough(new TextDecoderStream())
      .getReader();

    if (!reader) {
      typeSentence("pipeThrough getReader is nil", responseElem);
      return;
    }

    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { value, done } = await reader.read();
      if (done) break;
      let dataDone = false;
      const arr = value.split("\n");

      arr.forEach((data) => {
        if (data.length === 0) return; // ignore empty message
        if (data.startsWith(":")) return; // ignore sse comment message

        if (!data.startsWith("data")) {
          try {
            let errorJSON = JSON.parse(data);
            typeSentence("\nError: " + errorJSON.error.message, responseElem);

            showID("ReadabilityErrorResend", "flex");
            return;
          } catch (error) {}
        }

        if (data === "data: [DONE]") {
          dataDone = true;
          return;
        }

        let choice = JSON.parse(data.substring(6)).choices[0];
        let token = choice.delta.content;

        if (choice.finish_reason == "stop") {
          token = token;
          dataDone = true;
        }

        typeSentence(token, responseElem);
      });

      if (dataDone) {
        console.log("#dataDone", dataDone);
        puashAssistantMessage(lastReplyMessage);

        // 在适当的时候调用回调函数
        if (callback && typeof callback === "function") {
          callback();
        }
        break;
      }
    }

    if (!response.ok) {
      showID("ReadabilityErrorResend", "flex");
      typeSentence("Status: " + response.status, responseElem);
    }
  } catch (error) {
    showID("ReadabilityErrorResend", "flex");
    typeSentence("Error: " + error.message, responseElem);
  } finally {
    removeClass(responseElem, "ReadabilityMessageTyping");
  }
}

function markdownMessage(elementReference) {
  elementReference.innerHTML = marked.parse(postProcessText(lastReplyMessage));
}

function typeSentence(sentence, elementReference) {
  lastReplyMessage += sentence;
  elementReference.innerText = lastReplyMessage;

  return;
}

function setupSummary() {
  let resultText = document.getElementById("response").innerHTML;

  document.getElementById("response").innerHTML = "";
  document.getElementById("receiptTitle").innerHTML = removeBR(
    extractSummary(resultText)
  );
  document.getElementById("receipt").innerHTML = formatMarkdown(
    marked.parse(postProcessText(excludeSummary(resultText)))
  );
}

function removeBR(text) {
  return text.trim().replaceAll("<br>", "");
}

function extractSummary(text) {
  const regex = /總結：([\s\S]+?)要點：/;
  const match = text.match(regex);
  if (match && match.length >= 2) {
    return match[1];
  }
  return "";
}

function excludeSummary(text) {
  const regex = /總結：([\s\S]+?)要點：/;
  const excludedText = text.replace(regex, "");
  return excludedText;
}

function formatMarkdown(inputString) {
  return inputString.replace(/^(<p><br>)/, "<p>").replace(/<br><br>/g, "<br>");
}

function callLoading() {
  document.querySelector("#ReadabilityLoading").style.display = "flex";
  document.querySelector("#ReadabilityLoading").classList.remove("fadeOut");
  document.querySelector("#ReadabilityLoading").classList.add("fadeIn");
}

function hideLoading() {
  document.querySelector("#ReadabilityLoading").classList.remove("fadeIn");
  document.querySelector("#ReadabilityLoading").classList.add("fadeOut");

  setTimeout(() => {
    document.querySelector("#ReadabilityLoading").style.display = "none";
  }, 800);
}

function hideID(idName) {
  try {
    document.querySelector("#" + idName).style.display = "none";
  } catch (error) {}
}

function showID(idName, display) {
  if (display === undefined) {
    display = "block";
  }
  try {
    document.querySelector("#" + idName).style.display = display;
  } catch (error) {}
}

function uiFocus(responseElem, delayMS) {
  if (delayMS === undefined) {
    delayMS = 1600;
  }

  responseElem.classList.add("readabilityDone");
  setTimeout(() => {
    responseElem.classList.remove("readabilityDone");
  }, delayMS);
}

function toggleClass(element, className) {
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  } else {
    element.classList.add(className);
  }
}

function removeClass(element, className) {
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  }
}

function removeReadabilityReplies() {
  var elements = document.getElementsByClassName("readabilityReply");

  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }
}

function postProcessText(text) {
  return text
    .trim()
    .replaceAll("  ", "")
    .replaceAll("\t", "")
    .replaceAll("\n\n", "")
    .replaceAll(",,", "")
    .replaceAll("undefined", "");
}

// 儲存資料
async function saveData(key, data) {
  try {
    const obj = {};
    obj[key] = data;
    await browser.storage.local.set(obj);
    console.log(key + " ... save");
  } catch (error) {
    console.log(error);
  }
}

// 讀取資料
async function loadData(key, defaultValue) {
  try {
    const result = await browser.storage.local.get(key);
    const data = result[key];

    if (data === undefined) {
      if (defaultValue === undefined) {
        return "";
      } else {
        return defaultValue;
      }
    }

    return data;
  } catch (error) {
    console.log(error);
    return "";
  }
}

async function isURLReachable(url) {
  try {
    const response = await fetch(url, { method: "POST" });
    if (response.ok) {
      return { reachable: true };
    } else {
      return { reachable: false, error: `HTTP Error ${response.status}` };
    }
  } catch (error) {
    return { reachable: false, error: "Error occurred" };
  }
}
