browser.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "checkFocusMode") {
        return new Promise((resolve) => {
            browser.runtime.sendNativeMessage("com.yhl.summeriser.Extension", {
                command: "checkFocusMode"
            }).then(response => {
                resolve({ focusMode: response.focusMode });
            }).catch(error => {
                console.error("Native messaging error:", error);
                resolve({ error: error.toString() });
            });
        });
    }
    return false;
});
