// background.js
console.log("Summariser background script loading");

const api = (typeof browser !== 'undefined') ? browser : chrome;
let currentFocusMode = "Normal"; // Default assumption
let currentFocusFunction = "activateNormalMode";
let monitoredTabs = new Map();
let nativeAppPort = null; // Persistent connection for potentially faster comms

// --- Native Communication ---

// Function to connect/reconnect to native app
function connectNativeApp() {
    const nativeAppId = "com.yhl.summariser.Extension"; // Ensure this matches exactly
    console.log(`Attempting to connect to native app: ${nativeAppId}`);
    try {
        nativeAppPort = api.runtime.connectNative(nativeAppId);
        console.log("Native port connected successfully.");

        nativeAppPort.onMessage.addListener((message) => {
            console.log("Received message from native app via port:", JSON.stringify(message));
            handleNativeMessage(message);
        });

        nativeAppPort.onDisconnect.addListener(() => {
            console.error("Native port disconnected.", api.runtime.lastError ? api.runtime.lastError.message : "No error details.");
            nativeAppPort = null;
            // Optional: Implement retry logic with backoff
            // setTimeout(connectNativeApp, 5000); // Example: retry after 5 seconds
        });

        // Request initial focus mode immediately after connecting
        requestCurrentFocusMode();

    } catch (error) {
        console.error(`Error connecting to native app ${nativeAppId}:`, error);
        nativeAppPort = null;
    }
}

// Function to send message via port, falls back to sendNativeMessage
function sendToNativeApp(message) {
    if (nativeAppPort) {
        try {
            console.log("Sending message via native port:", JSON.stringify(message));
            nativeAppPort.postMessage(message);
            return true; // Indicate message sent via port
        } catch (error) {
            console.error("Error sending message via native port:", error);
            // Port might be broken, try disconnecting and sending via sendNativeMessage
            if (nativeAppPort) nativeAppPort.disconnect();
            nativeAppPort = null;
            // Fall through to sendNativeMessage
        }
    }

    // Fallback to sendNativeMessage if port is not connected or failed
    console.log("Sending message via sendNativeMessage (fallback):", JSON.stringify(message));
    api.runtime.sendNativeMessage(
        "com.yhl.summariser.Extension",
        message,
        (response) => {
            if (api.runtime.lastError) {
                console.error("sendNativeMessage error:", api.runtime.lastError.message);
                // Handle error, maybe update UI or state
            } else {
                console.log("Received response from sendNativeMessage:", JSON.stringify(response));
                // Handle the response if necessary (though focus updates often come via listener)
                handleNativeMessage(response); // Process response as if it came from listener
            }
        }
    );
    return false; // Indicate message sent via sendNativeMessage
}


// Central handler for messages coming *from* the native app (via port or sendNativeMessage response)
function handleNativeMessage(message) {
    console.log("Handling native message:", JSON.stringify(message));

    // Check for focus change messages (could be pushed or response to getCurrentFocusMode)
     // Flexible checking for different message structures
    let mode = null;
    let functionName = null;

    if (message.name === "focusChanged" && message.userInfo) { // Format from SFSafariApplication.dispatchMessage
        mode = message.userInfo.mode;
        functionName = message.userInfo.functionName;
         console.log(`Parsed focusChanged (dispatchMessage format): mode=${mode}, function=${functionName}`);
    } else if (message.message && message.message.focusMode) { // Format from older sendNativeMessage response structure?
         mode = message.message.focusMode;
         functionName = message.message.focusFunction;
         console.log(`Parsed focusChanged (nested message format): mode=${mode}, function=${functionName}`);
    } else if (message.focusMode) { // Format from direct sendNativeMessage response
        mode = message.focusMode;
        functionName = message.focusFunction;
         console.log(`Parsed focusChanged (direct properties format): mode=${mode}, function=${functionName}`);
    }


    if (mode && functionName) {
        if (mode !== currentFocusMode) {
            console.log(`Focus changed detected: ${currentFocusMode} -> ${mode}, function: ${functionName}`);
            currentFocusMode = mode;
            currentFocusFunction = functionName;
            broadcastFocusMode(); // Notify relevant tabs
        } else {
             console.log(`Focus mode confirmation received: ${mode} (no change)`);
        }
    } else {
        console.log("Native message did not contain recognized focus mode information.");
    }
}

// Request the current focus mode from the native app
function requestCurrentFocusMode() {
    console.log("Requesting current focus mode from native app...");
    sendToNativeApp({ action: "getCurrentFocusMode" });
}


// --- Browser Event Listeners ---

// Listen for messages from content scripts
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`Background received message from ${sender.tab ? 'tab ' + sender.tab.id : 'extension'}:`, JSON.stringify(message));

    if (message.action === "contentScriptLoaded" && sender.tab) {
        console.log(`Content script loaded in tab ${sender.tab.id} (${sender.tab.url})`);
        // Immediately respond to content script that we received the message
        // We'll send the focus mode separately AFTER confirming the tab URL
        sendResponse({ received: true });

        // Check if this is a yhl.ac.cn page AFTER sending initial response
        if (sender.tab.url && sender.tab.url.includes('yhl.ac.cn')) {
            console.log(`Monitoring yhl.ac.cn tab: ${sender.tab.id}. Sending current focus: ${currentFocusMode}`);
            monitoredTabs.set(sender.tab.id, sender.tab.url);

            // Send the *currently stored* focus mode immediately
            api.tabs.sendMessage(sender.tab.id, {
                action: "applyFocusMode",
                focusMode: currentFocusMode,
                focusFunction: currentFocusFunction
            }).catch(err => {
                 // Handle potential error if tab closed before message sent
                 console.error(`Error sending initial focus mode to tab ${sender.tab.id}:`, err.message);
                 monitoredTabs.delete(sender.tab.id);
             });
        }
        return true; // Indicate async response potential (though we sent sync above, best practice)
    }

    // Handle other potential messages if needed
    // sendResponse({ received: false, error: "Unknown action" }); // Example for unhandled
    // return false; // No async response needed if not handled
});


// Track tab updates (redundant if contentScriptLoaded works reliably, but good fallback)
api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only act if loading is complete and URL is present
    if (changeInfo.status === 'complete' && tab.url) {
        if (tab.url.includes('yhl.ac.cn')) {
            // Check if we aren't already monitoring (e.g., if content script message failed/was slow)
             if (!monitoredTabs.has(tabId)) {
                 console.log(`yhl.ac.cn page loaded (detected via onUpdated) in tab ${tabId}. Sending current focus: ${currentFocusMode}`);
                 monitoredTabs.set(tabId, tab.url);
                 api.tabs.sendMessage(tabId, {
                     action: "applyFocusMode",
                     focusMode: currentFocusMode,
                     focusFunction: currentFocusFunction
                 }).catch(err => {
                     console.error(`Error sending focus mode via onUpdated to tab ${tabId}:`, err.message);
                     monitoredTabs.delete(tabId);
                 });
            }
        } else {
            // If URL changes away from yhl.ac.cn, stop monitoring
            if (monitoredTabs.has(tabId)) {
                console.log(`Tab ${tabId} navigated away from yhl.ac.cn. Removing from monitored tabs.`);
                monitoredTabs.delete(tabId);
            }
        }
    }
});

// Clean up when tabs are closed
api.tabs.onRemoved.addListener((tabId) => {
    if (monitoredTabs.has(tabId)) {
        console.log(`Removing monitored tab due to closure: ${tabId}`);
        monitoredTabs.delete(tabId);
    }
});

// --- Helper Functions ---

// Send focus mode to all currently monitored tabs
function broadcastFocusMode() {
    console.log(`Broadcasting focus mode '${currentFocusMode}' ('${currentFocusFunction}') to ${monitoredTabs.size} monitored tabs.`);
    monitoredTabs.forEach((url, tabId) => {
        api.tabs.sendMessage(tabId, {
            action: "applyFocusMode",
            focusMode: currentFocusMode,
            focusFunction: currentFocusFunction
        }).catch(err => {
            console.warn(`Error sending focus update to tab ${tabId}. It might be closed. Removing. Error:`, err.message);
            monitoredTabs.delete(tabId); // Clean up if tab closed before message sent
        });
    });
}

// Helper function (duplicate from original, ensure consistency)
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

// --- Initialization ---
connectNativeApp(); // Try connecting immediately
console.log("Background script initialization complete. Initial focus mode fetch requested.");
