// background.js - background script for Safari extension
let currentFocusMode = "Normal";
let currentFocusFunction = "activateNormalMode";

// Listen for messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle requests for current focus mode from content script
  if (message.action === "getFocusMode") {
    sendResponse({
      focusMode: currentFocusMode,
      focusFunction: currentFocusFunction
    });
    return true;
  }
});

// Handle messages from Swift code (via SafariWebExtensionHandler)
browser.runtime.onMessage.addListener((message) => {
  if (message.name === "focusChanged" && message.message) {
    // Update our stored values
    currentFocusMode = message.message.mode;
    currentFocusFunction = message.message.functionName;
    
    // Forward to all tabs with our new tab page
    browser.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        browser.tabs.sendMessage(tab.id, {
          action: "applyFocusMode",
          focusMode: currentFocusMode,
          focusFunction: currentFocusFunction
        }).catch(() => {
          // Ignore errors for tabs that don't have the content script
        });
      });
    });
  }
});

// Get initial focus mode from native app on startup
browser.runtime.sendNativeMessage({
  action: "getCurrentFocusMode"
}).then(response => {
  if (response && response.focusMode) {
    currentFocusMode = response.focusMode;
    currentFocusFunction = response.focusFunction;
  }
}).catch(error => {
  console.error("Error getting initial focus mode:", error);
});
