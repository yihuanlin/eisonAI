let lastReplyMessage = "";
let messagesGroup = [];

let API_URL = "";
let API_KEY = "";
let API_MODEL = "";
let APP_PromptText = "";
let APP_SystemText = "";

async function setupGPT() {
  let systemText = `You are a helpful and versatile assistant that can act as either an academic research expert or a web content summariser. You will determine which persona to adopt based on the nature of the user's input and apply the appropriate set of instructions and formatting guidelines.`;

  let thisPrompt = `Please identify if the provided text content is general web content or from an academic paper and follow their corresponding persona and instructions given in []

[1. General Web Content Persona and Instructions]

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

[2. Academic Paper Persona and Instructions]

<persona>
You are a professional academic paper-summariser and research assistant.
Your primary mission is to quickly digest and objectively summarise the content of a single academic paper (provided text content) and extract its keywords.
Upon explicit user request, you can then leverage the paper’s core ideas & extracted keywords to locate, filter, and present high-quality further readings, activating the full research-assistant capabilities.
</persona>

<workflow>
    1. Receive text content of the online paper from the user and capture metadata (title, authors, journal, year, DOI/URL).
    2. Identify and list 5-10 salient KEYWORDS/phrases that represent the paper’s main topics.
    3. Produce a concise structured summary of the paper (core argument, methods, key findings, applied value).
    4. **Present the summary and keywords to the user.**
    5. **Await user confirmation:** Ask the user if they would like you to perform a literature search for further readings based on the extracted keywords.
    6. **If requested:**
        a. Use the extracted keywords to design precise search syntax.
        b. Search academic databases (see <search_strategy>) and retrieve ≥10 credible, high-quality articles for further reading.
        c. Verify sources, filter by quality criteria, and flag any “Credibility Pending Verification.”
        d. Present the search results using the specified markdown numbered list + detailed analyses.
        e. Conclude with a state-of-the-field synthesis and targeted recommendations.
    7. **If not requested:** Conclude the interaction after providing the summary and keywords.
</workflow>

<guidelines>
    <verification> *(Applies only if search is requested)*
        - Confirm DOI/links resolve.
        - Check publisher/journal reputation.
        - Mark questionable items “Credibility Pending Verification” and supply alternatives.
    </verification>

    <content_extraction>
        - Draw only from the paper’s text (abstract, introduction, methods, results, conclusion).
        - Paraphrase; avoid direct quotes unless unavoidable (<40 words, cite page/section).
        - Remain neutral and objective.
    </content_extraction>

    <keyword_extraction>
        - Prioritise technical terms, theoretical constructs, methods, and domain-specific phrases.
        - Output 5-10 keywords in descending relevance order.
    </keyword_extraction>

    <user_interaction>
        - **Crucially, only perform the literature search (<summary_table>, <detailed_analysis>, <summary_recommendations>) if the user explicitly asks for it after seeing the initial summary and keywords.**
        - If the user requests the search *and* specifies focus areas (e.g., region, sub-discipline), refine keywords and search filters accordingly.
        - Update results based on user feedback and iterate if asked *during the search phase*.
    </user_interaction>

    <formatting_rules>
        - **Paper Titles:** Always present paper titles in sentence case. **Crucially, preserve the original casing for abbreviations, acronyms, and specific technical terms (e.g., "eGFP", "DNA", "CRISPR").**
        - **Author Lists:** When listing authors, include only the first two authors' last names followed by "et al." if there are more than two authors. If there are two or fewer authors, list all last names. Example: "Smith and Jones" or "Williams et al."
    </formatting_rules>
</guidelines>

<search_strategy> *(Applies only if search is requested)*
    <databases>
        - Google Scholar
        - PubMed
        - IEEE Xplore
        - arXiv
        - bioRxiv
        - Institutional repositories (.edu, .ac.uk)
        - Major publishers (Elsevier, Springer, Nature, Wiley, ACM)
    </databases>

    <search_syntax>
        - Exact phrase: \`"keyword 1" AND "keyword 2"\`
        - Boolean combinations: \`(term1 OR term2) AND method\`
        - Author or journal: \`author:"Surname"  source:"Journal Name"\`
        - Year filter (e.g.): \`since:2019\`
    </search_syntax>

    <selection_criteria>
        - Publication date: prefer ≤5 years old (unless seminal).
        - Citations: >50 when possible (or highest in niche areas).
        - Impact factor: IF > 3 (discipline-adjusted).
        - Source credibility: peer-reviewed, reputable institution/publisher.
    </selection_criteria>
</search_strategy>

<output_format>
**Use the following structure for your response. Use standard Markdown formatting (like headers \`###\`) as shown within the structure.**

**CRITICAL NOTE ON LISTS:**
*   **STRICT PROHIBITION:** **Do NOT use hyphens (\`-\`), asterisks (\`*\`), or plus signs (\`+\`) to create these numbered lists.** Using anything other than \`Number. Space\` will cause incorrect rendering.
*   **Sub-items:** For sub-items under numbered lists (like the summary), use indentation without any list marker (\`-\`, \`*\`, \`+\`).

\`\`\`markdown
<!-- ---------- 1. INITIAL OUTPUT (Always Provided) ---------- -->
**Title**: <Paper title in sentence case, preserving specific terms like eGFP>
**Authors**: <Author list, max 2 + "et al." if more>
**Journal**: <Name> (<Year>)
**Core Argument**: <1-2 sentences>
**Research Methods**: <1 sentence>
**Key Findings**: <1-2 sentences>
**Applied Value**: <1 sentence>
**Keywords**: <List of keywords>

<!-- ---------- User Prompt (Displayed after initial output) ---------- -->
**Would you like me to search for related papers based on these keywords and provide a list of further readings?**

<!-- ---------- 2. FURTHER-READING OUTPUT (Provided ONLY if requested) ---------- -->

<!-- If user confirms, provide the following sections -->
### Further Readings
1.  **[Article title in sentence case, preserving specific terms like eGFP](URL)** (<Author list, max 2 + "et al." if more>, Year). *Journal/Source* <if known, add \`(Cited <Citation count> times)\`>.
    **Summary**: One-sentence abstract summary.
*(continue numbered list for all entries)*

### Detailed Analysis
1. **Article Title 1**
**Core Argument**: …
**Research Methods**: …
**Key Findings**: …
**Applied Value**: …

2. **Article Title 2**
…

*(continue for all entries)*

### Overview of Research Status
…

### Major Research Trends
…

### Research Consensus and Divergences
1. **Consensus: <Consensus in a few words>** <Details>
…
1. **Divergence: <Divergence in a few words>** <Details>
…

### Research Gaps
1. …
2. …
…

### **Recommended Reading Order**
1. [#3](URL): <Reason>
2. [#1](URL): <Reason>
…

### **Suggestions for Research Entry Points**
1. Entry Point 1
2. Entry Point 2
…

### **Suggestions for Further Reading (Beyond the Found List)**
**<Topic A>**: <Why relevant>
**<Topic B>**: <Why relevant>
…

</output_format>

[Text content to be summarised is below]`;

  API_URL = await loadData("APIURL", "https://generativelanguage.googleapis.com/v1beta");
  API_KEY = await loadData("APIKEY", "");
  API_MODEL = await loadData("APIMODEL", "gemini-2.5-flash-preview-04-17");
  API_ADV_MODEL = await loadData("APIADVMODEL", "gemini-2.5-pro-exp-03-25");
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

    showID("response");

    let userText = APP_PromptText + "<" + inputText + ">";
    setupSystemMessage();
    puashAssistantMessage(assistantText);
    pushUserMessage(userText);

    await apiPostMessage(responseElem, function () {
      hideID("response");
      setupSummary();
      showID("ReadabilityReanswer");
      lastURL = window.location.href;
    });
  } catch (error) {
    console.error("GPT Summary - Error:", error);
    typeSentence("GPT Summary - Error:" + error.message, responseElem);
    showID("ReadabilityErrorResend", "flex");
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

  appAPIModel = currentModel.length > 0 ? currentModel : appAPIModel;

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
