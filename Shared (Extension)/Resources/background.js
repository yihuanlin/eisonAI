// background.js
console.log("Summariser background script loaded");

const api = (typeof browser !== 'undefined') ? browser : chrome;
let currentFocusMode = "Normal";
let currentFocusFunction = "activateNormalMode";
let monitoredTabs = new Map();

// Listen for focus mode changes from Swift code - UPDATED to handle all message formats
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received message:", JSON.stringify(message));
    
    // Handle focus changes with more flexible message detection
    if (message.name === "focusChanged" ||
        (message.message && message.message.mode) ||
        message.mode ||
        (message.action === "focusChanged")) {
        
        // Extract focus mode info using more flexible approach
        let mode, functionName;
        
        if (message.name === "focusChanged" && message.message) {
            // Format from dispatchMessage
            mode = message.message.mode;
            functionName = message.message.functionName;
        } else if (message.message && message.message.mode) {
            // Nested message format
            mode = message.message.mode;
            functionName = message.message.functionName;
        } else if (message.mode) {
            // Direct properties
            mode = message.mode;
            functionName = message.functionName || getFunctionNameForMode(mode);
        } else if (message.action === "focusChanged") {
            // Action-based format
            mode = message.focusMode;
            functionName = message.focusFunction || getFunctionNameForMode(mode);
        }
        
        if (mode) {
            console.log(`Focus changed to: ${mode}, function: ${functionName}`);
            currentFocusMode = mode;
            currentFocusFunction = functionName || getFunctionNameForMode(mode);
            
            // Notify all monitored tabs
            broadcastFocusMode();
        }
        
        sendResponse({received: true});
        return true;
    }
    
    // Handle content script loading
    if (message.action === "contentScriptLoaded" && sender.tab) {
        console.log(`Content script loaded in tab ${sender.tab.id} (${sender.tab.url})`);
        
        // Check if this is a yhl.ac.cn page
        if (sender.tab.url && sender.tab.url.includes('yhl.ac.cn')) {
            console.log(`Monitoring yhl.ac.cn tab: ${sender.tab.id}`);
            monitoredTabs.set(sender.tab.id, sender.tab.url);
            
            // Send current focus mode
            api.tabs.sendMessage(sender.tab.id, {
                action: "applyFocusMode",
                focusMode: currentFocusMode,
                focusFunction: currentFocusFunction
            });
        }
        
        sendResponse({received: true});
        return true;
    }
    
    // Default response
    sendResponse({received: true});
    return true;  // Important for async response handling
});

// Track tab updates to monitor yhl.ac.cn pages
api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (tab.url.includes('yhl.ac.cn')) {
            console.log(`yhl.ac.cn page loaded in tab ${tabId}`);
            monitoredTabs.set(tabId, tab.url);
        }
    }
});

// Clean up when tabs are closed
api.tabs.onRemoved.addListener((tabId) => {
    if (monitoredTabs.has(tabId)) {
        console.log(`Removing monitored tab: ${tabId}`);
        monitoredTabs.delete(tabId);
    }
});

// Send focus mode to all monitored tabs
function broadcastFocusMode() {
    console.log(`Broadcasting focus mode ${currentFocusMode} to ${monitoredTabs.size} tabs`);
    
    monitoredTabs.forEach((url, tabId) => {
        api.tabs.sendMessage(tabId, {
            action: "applyFocusMode",
            focusMode: currentFocusMode,
            focusFunction: currentFocusFunction
        }).catch(err => {
            console.log(`Error sending to tab ${tabId}, removing from monitored tabs:`, err);
            monitoredTabs.delete(tabId);
        });
    });
}

// Request initial focus mode from native app
api.runtime.sendNativeMessage(
    "com.yhl.summariser.Extension",  // Updated to match Swift code
    { action: "getCurrentFocusMode" },
    response => {
        console.log("Response from native app:", response);
        if (response && response.focusMode) {
            currentFocusMode = response.focusMode;
            currentFocusFunction = response.focusFunction ||
                getFunctionNameForMode(currentFocusMode);
            console.log(`Initial focus mode: ${currentFocusMode}`);
        }
    }
);

// Helper function to get function name if not provided
function getFunctionNameForMode(mode) {
    switch (mode) {
        case "Do Not Disturb": return "activateDoNotDisturb";
        case "Work": return "activateWorkMode";
        case "Personal": return "activatePersonalMode";
        case "Sleep": return "activateSleepMode";
        case "Focused": return "activateFocusedMode";
        default: return "activateNormalMode";
    }
}

console.log("Background script initialization complete");
