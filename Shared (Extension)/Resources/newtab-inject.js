let currentFocusMode = "Normal";

// Listen for messages from background script
(function() {
  const api = (typeof browser !== 'undefined') ? browser : chrome;
  
  // Let background script know we're loaded
  api.runtime.sendMessage({
    action: "contentScriptLoaded",
    url: window.location.href
  });
  
  // Listen for focus mode changes
  api.runtime.onMessage.addListener((message) => {
    if (message.action === "applyFocusMode") {
      console.log(`Applying focus mode: ${message.focusMode}`);
      currentFocusMode = message.focusMode;
      
      // Call the appropriate function based on the focus mode
      const functionName = message.focusFunction || "activateNormalMode";
      if (typeof window[functionName] === 'function') {
        window[functionName]();
      }
    }
  });
  
  // Define focus mode functions
  window.activateNormalMode = function() {
    console.log("Normal mode activated");
    document.body.classList.remove("mode-dnd", "mode-work", "mode-personal", "mode-sleep", "mode-focused");
    document.body.classList.add("mode-normal");
    // Your normal mode functionality here
  };
  
  window.activateDoNotDisturb = function() {
    console.log("Do Not Disturb mode activated");
    document.body.classList.remove("mode-normal", "mode-work", "mode-personal", "mode-sleep", "mode-focused");
    document.body.classList.add("mode-dnd");
    // Your DND mode functionality here
  };
  
  window.activateWorkMode = function() {
    console.log("Work mode activated");
    document.body.classList.remove("mode-normal", "mode-dnd", "mode-personal", "mode-sleep", "mode-focused");
    document.body.classList.add("mode-work");
    // Your work mode functionality here
  };
  
  window.activatePersonalMode = function() {
    console.log("Personal mode activated");
    document.body.classList.remove("mode-normal", "mode-dnd", "mode-work", "mode-sleep", "mode-focused");
    document.body.classList.add("mode-personal");
    // Your personal mode functionality here
  };
  
  window.activateSleepMode = function() {
    console.log("Sleep mode activated");
    document.body.classList.remove("mode-normal", "mode-dnd", "mode-work", "mode-personal", "mode-focused");
    document.body.classList.add("mode-sleep");
    // Your sleep mode functionality here
  };
  
  window.activateFocusedMode = function() {
    console.log("Focused mode activated");
    document.body.classList.remove("mode-normal", "mode-dnd", "mode-work", "mode-personal", "mode-sleep");
    document.body.classList.add("mode-focused");
    // Your focused mode functionality here
  };
})();
