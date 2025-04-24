let lastReplyMessage = "";
let messagesGroup = [];

let API_URL = "";
let API_KEY = "";
let API_MODEL = "";
let APP_PromptText = "";
let APP_SystemText = "";

async function setupGPT() {
  let systemText = `You are a helpful and versatile assistant that can act as either an academic research expert or a web content summariser. You will determine which persona to adopt based on the nature of the user's input and apply the appropriate set of instructions and formatting guidelines.`;

  let thisPrompt = `If the provided text content is from an academic paper, please use the following persona and instructions. Otherwise, please use the persona and instructions for summarising general web content.

***General Web Content Persona and Instructions:***

<persona>
You are an expert in helping users understand web content.
</persona>

<workflow>
    1. Receive text content from the user.
    2. Determine the language of the text.
    3. If the text is not in Chinese or English, translate it to British English.
    4. Summarise the content according to the specified format.
    5. Extract key points from the content and add decorative emojis.
    6. Present the summary and key points in the specified format.
</workflow>

<guidelines>
    - Summarise the content concisely in a single sentence. 
    - Extract the most important points from the text. 
    - Add a decorative emoji to each key point.
</guidelines>

<output_format>
    - Follow the exact format provided: "Summary: [summary sentence]\nKey points: [key point 1 with emoji]\n[key point 2 with emoji]\n..."
    - Ensure a newline character after the summary line and each key point line.
    - Do not include any additional text outside the specified format.
</output_format>

***Academic Paper Persona and Instructions:***

<persona>
You are a professional academic research assistant, skilled at precisely locating high-quality literature through online search and extracting key information. Your task is to retrieve, filter, and analyze relevant academic literature based on the user's research topic, providing structured research materials.
</persona>

<workflow>
    1. Extract core keywords from the user query.
    2. Design precise search syntax and perform searches in academic databases.
    3. Filter and verify at least 10 high-quality articles.
    4. Present results in the specified format.
    5. Provide in-depth analysis and citation information.
    6. Summarize the state of the research field and offer recommendations.
</workflow>

<guidelines>
    <verification>
        - Check if DOI links are valid.
        - Confirm the academic reputation of the publishing institution.
        - If the credibility of a document is questionable, mark it "Credibility Pending Verification" and provide alternative literature
    </verification>

\`\`\`
<content_extraction>
    - Extract core content based on the original text of the literature, avoiding direct copying.
    - Maintain objectivity, without adding personal opinions.
    - Use neutral language to summarize research findings.
</content_extraction>

<user_interaction>
    - If the user requests research in a specific field/region, adjust the search strategy accordingly.
    - Provide suggestions for future research directions.
    - Optimize search results based on user feedback.
</user_interaction>
\`\`\`

</guidelines>

\<search_strategy> <databases>
\- Google Scholar
\- PubMed
\- IEEE Xplore
\- arXiv
\- University Institutional Repositories (.edu domains)
\- Websites of reputable publishers (Elsevier, Springer, Nature) </databases>
\<search_syntax>
\- Use quotation marks for exact phrase matching: \`"keyword 1" AND "keyword 2"\`
\- Use author/journal restriction: \`author:"Name" OR source:"Journal Nam"\`
\</search_syntax>
\<selection_criteria>
\- Publication Date: Prioritize literature published within the last 5 years.
\- Citation Metrics: Prioritize literature with a high citation count (>50 times).
\- Journal Quality: Prioritize journals with a high impact factor (IF>3.0).
\- Source Credibility: Confirm the source is from a credible academic institution or reputable publisher.
\</selection_criteria>
\</search_strategy>

\<output_format>
\<summary_table>
Use a Markdown table to list basic information for all literature:

\`\`\`
| No. | Article Title | Author(s) | Publication Year | Journal/Source | Citation Count | Abstract Summary |
|-----|---------------|-----------|-----------------|----------------|----------------|------------------|
| 1   | [Title](URL)  | Author(s) | e.g. 2023       | Journal Name   | e.g. 157       | One-sentence summary |
</summary_table>

<detailed_analysis>
    Provide detailed analysis for each article in the order listed in the table:

    1. [Article Title]
      - **Core Argument**: Main research question and theoretical framework (1-2 sentences)
      - **Research Methods**: Primary methods used or data sources (1 sentence)
      - **Key Findings**: Most important research results and conclusions (1-2 sentences)
      - **Applied Value**:  Practical significance of the research (1 sentence)
</detailed_analysis>

<summary_recommendations>
    Provide a summary and recommendations based on all retrieved literature:

    ## Research Field Summary

    **Overview of Research Status**:
    - Provide an overall description of the state of research in this field (2-3 sentences).

    **Major Research Trends**:
    - List 3-5 main research directions and trends.

    **Research Consensus and Divergences**:
    - Identify points of consensus within the academic community (1-2 points).
    - Identify issues that are still debated (1-2 points).

    **Research Gaps**:
    - List 2-3 aspects of this field that have not been fully explored.

    ## Targeted Recommendations

    **Recommended Reading Order**:
    - Recommend the order in which to prioritize reading the articles based on user needs, including their corresponding numbers (with URL hyperlinks) and reasons.

    **Suggestions for Research Entry Points**:
    - Offer 2-3 possible starting points or directions for research.

    **Suggestions for Further Reading**:
    - Recommend 1-2 related research directions not included in the main list.
</summary_recommendations>
\`\`\`

\</output_format>

The text content to be summarised is below:`;

  API_URL = await loadData("APIURL", "https://generativelanguage.googleapis.com/v1beta");
  API_KEY = await loadData("APIKEY", "");
  API_MODEL = await loadData("APIMODEL", "gemini-2.5-flash-preview-04-17");
  APP_PromptText = await loadData("APPPromptText", thisPrompt);
  APP_SystemText = await loadData("APPSystemText", systemText);

  if (API_URL === "") {
    console.error("SetupGPT: Failed - Missing API URL");
    return false;
  }

  return true;
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

// GPT Summary
async function callGPTSummary(inputText) {
  let responseElem = document.getElementById("response");
  lastReplyMessage = "";
  let assistantText = "";

  try {
    if (!inputText || inputText.length <= 0) {
      console.error("GPT Summary - Empty input text");
      typeSentence("GPT Summary - Empty input text", responseElem);
      return;
    }

    callLoading();
    showID("response");

    let userText = APP_PromptText + "<" + inputText + ">";
    setupSystemMessage();
    puashAssistantMessage(assistantText);
    pushUserMessage(userText);

    await apiPostMessage(responseElem, function () {
      hideID("response");
      hideLoading();
      setupSummary();
      showID("ReadabilityReanswer");
      uiFocus(document.getElementById("ReadabilityFrame"));
      lastURL = window.location.href;
    });
  } catch (error) {
    console.error("GPT Summary - Error:", error);
    typeSentence("GPT Summary - Error:" + error.message, responseElem);
    showID("ReadabilityErrorResend", "flex");
  } finally {
    if (!responseElem.innerText) {
      hideLoading();
    }
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

  if (!appAPIUrl) {
    console.error("API Post - Missing API URL");
    typeSentence("API Post - Missing API URL", responseElem);
    showID("ReadabilityErrorResend", "flex");
    return;
  }

  lastReplyMessage = ""; //reset LastMessage

  toggleClass(responseElem, "ReadabilityMessageTyping");

  try {
    hideID("ReadabilityErrorResend");

    // Handle different API endpoints
    let fetchURL = `${appAPIUrl}/chat/completions`;
    let headers = {
      Authorization: "Bearer " + appAPIKey,
      "Content-Type": "application/json"
    };
    let requestBody = {};

    // Check if using Gemini API
    if (appAPIUrl.includes('generativelanguage.googleapis.com')) {
      // Adjust for Gemini API format
      fetchURL = `${appAPIUrl}/models/${appAPIModel}:streamGenerateContent`;
      headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": appAPIKey
      };

      // Convert message format for Gemini
      // Filter out system messages and map roles
      let geminiContents = messagesGroup
        .filter(msg => msg.role !== 'system') // Remove system message
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : msg.role, // Convert assistant to model
          parts: [{ text: msg.content }]
        }));

      // Gemini requires the conversation history to end with a 'user' role message.
      // If the last message is 'model', remove it.
      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === 'model') {
        geminiContents.pop(); // Remove the last message if it's from the model
      }

      // Ensure not sending empty contents after filtering
      if (geminiContents.length === 0) {
        // Add a test user message if contents are empty
        geminiContents.push({
          role: 'user',
          parts: [{ text: 'Hello' }]
        });
        console.log("Added test message to empty Gemini contents");
      }

      // Ensure the last message is from the user (Gemini requirement)
      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === 'model') {
        // Add a dummy user message if the last message is from the model
        geminiContents.push({
          role: 'user',
          parts: [{ text: 'Please continue' }]
        });
        console.log("Added continuation prompt since last message was from model");
      }

      requestBody = {
        contents: geminiContents,
        tools: [{
          google_search: {}
        }],
        generationConfig: {
          temperature: 0.5
        }
      };
    } else {
      // Standard OpenAI/compatible API format
      requestBody = {
        stream: true,
        model: appAPIModel,
        messages: messagesGroup,
        temperature: 0.5,
      };

      // Add plugins if using OpenRouter
      if (appAPIUrl.startsWith('https://openrouter.ai')) {
        requestBody.plugins = [{ "id": "web" }];
      }
    }

    const response = await fetch(fetchURL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    const reader = response.body
      ?.pipeThrough(new TextDecoderStream())
      .getReader();

    if (!reader) {
      typeSentence("pipeThrough getReader is nil", responseElem);
      return;
    }

    let geminiBuffer = ''; // Buffer for accumulating Gemini response data

    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { value, done } = await reader.read();
      if (done) break;
      let dataDone = false;

      // Handle different API formats differently
      if (appAPIUrl.includes('generativelanguage.googleapis.com')) {
        // Gemini streaming format handling
        geminiBuffer += value;

        // Process complete JSON objects in the buffer
        try {
          // Look for complete JSON objects that might be in the buffer
          const jsonObjects = extractJsonObjects(geminiBuffer);

          for (const jsonData of jsonObjects) {
            if (jsonData.candidates && jsonData.candidates[0] && jsonData.candidates[0].content) {
              const content = jsonData.candidates[0].content;

              if (content.parts && content.parts.length > 0) {
                content.parts.forEach(part => {
                  if (part.text) {
                    typeSentence(part.text, responseElem);
                  }
                });
              }

              if (jsonData.candidates[0].finishReason === "STOP") {
                dataDone = true;
              }
            }
          }

          // Clean buffer after processing
          if (jsonObjects.length > 0) {
            const lastJsonEndPos = geminiBuffer.lastIndexOf('}') + 1;
            geminiBuffer = geminiBuffer.substring(lastJsonEndPos);
          }
        } catch (error) {
          console.error("Error processing Gemini streaming response:", error);
        }
      } else {
        // OpenAI-like streaming format (line-based)
        const arr = value.split("\n");

        arr.forEach((data) => {
          if (data.length === 0) return; // ignore empty message
          if (data.startsWith(":")) return; // ignore sse comment message
          if (data.startsWith("id")) return; // 

          if (!data.startsWith("data")) {
            try {
              let errorJSON = JSON.parse(data);
              typeSentence("\nError: " + (errorJSON.error?.message || JSON.stringify(errorJSON)), responseElem);

              showID("ReadabilityErrorResend", "flex");
              return;
            } catch (error) { }
          }

          if (data === "data: [DONE]") {
            dataDone = true;
            return;
          }

          try {
            const jsonData = JSON.parse(data.substring(6));
            let choice = jsonData.choices[0];
            let token = choice.delta?.content;

            if (token !== undefined) {
              typeSentence(token, responseElem);
            }

            if (choice.finish_reason === "stop") {
              dataDone = true;
            }
          } catch (error) {
            console.error("Error parsing OpenAI streaming response:", error);
          }
        });
      }

      if (dataDone) {
        console.log("#dataDone", dataDone);
        puashAssistantMessage(lastReplyMessage);

        // Call callback function when done
        if (callback && typeof callback === "function") {
          callback();
        }
        break;
      }
    }

    // Helper function to extract complete JSON objects from a string
    function extractJsonObjects(str) {
      const results = [];
      let startPos = str.indexOf("{");

      while (startPos !== -1) {
        try {
          // Find a potential complete JSON object
          let openBraces = 0;
          let endPos = startPos;

          for (let i = startPos; i < str.length; i++) {
            if (str[i] === '{') openBraces++;
            else if (str[i] === '}') openBraces--;

            if (openBraces === 0) {
              endPos = i + 1;
              break;
            }
          }

          if (openBraces !== 0) {
            // Incomplete JSON, wait for more data
            break;
          }

          // Extract the JSON string and parse it
          const jsonStr = str.substring(startPos, endPos);
          const jsonObj = JSON.parse(jsonStr);
          results.push(jsonObj);

          // Move to the next potential JSON object
          startPos = str.indexOf("{", endPos);
        } catch (e) {
          // If parsing fails, move to the next opening brace
          startPos = str.indexOf("{", startPos + 1);
        }
      }

      return results;
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
  if (sentence === undefined) return;

  lastReplyMessage += sentence;
  elementReference.innerText = lastReplyMessage;

  return;
}

function setupSummary() {
  let resultText = document.getElementById("response").innerHTML;

  document.getElementById("response").innerHTML = "";
  document.getElementById("receipt").innerHTML = formatMarkdown(
    marked.parse(postProcessText(excludeSummary(resultText)))
  );
}

function removeBR(text) {
  return text.trim().replaceAll("<br>", "");
}

function extractSummary(text) {
  const regex = /Keypoints:([\s\S]+?)Summary:/;
  const match = text.match(regex);
  if (match && match.length >= 2) {
    return match[1];
  }
  return "";
}

function excludeSummary(text) {
  const regex = /Keypoints:([\s\S]+?)Summary:/;
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
  } catch (error) { }
}

function showID(idName, display) {
  if (display === undefined) {
    display = "block";
  }
  try {
    document.querySelector("#" + idName).style.display = display;
  } catch (error) { }
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
