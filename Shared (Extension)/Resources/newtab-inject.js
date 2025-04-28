// newtab-inject.js - Safari compatible content script for the new tab page
// This script injects code into the new tab page without modifying its HTML

// 1. Intercept and prevent service worker registration
(function() {
    // Store original serviceWorker.register function
    const originalRegister = navigator.serviceWorker && navigator.serviceWorker.register;
    
    // If serviceWorker exists, override register method
    if (navigator.serviceWorker) {
        navigator.serviceWorker.register = function() {
            console.log("Service Worker registration prevented by extension");
            // Return a resolved promise to prevent errors
            return Promise.resolve(null);
        };
        
        // Also attempt to unregister any existing workers
        setTimeout(() => {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.unregister();
                    console.log("Unregistered service worker");
                }
            }).catch(err => {
                console.error("Error unregistering service workers:", err);
            });
        }, 500);
    }
})();

// 2. Inject focus mode functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create an empty span element to indicate focus mode
    const focusIndicator = document.createElement('span');
    focusIndicator.id = 'focus-indicator';
    focusIndicator.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px; z-index: 10000; opacity: 0.7;';
    focusIndicator.textContent = 'Normal Mode';
    document.body.appendChild(focusIndicator);
    
    // Add CSS for different focus modes
    const style = document.createElement('style');
    style.textContent = `
        body.mode-normal {}
        body.mode-dnd { filter: grayscale(0.3); }
        body.mode-work { filter: sepia(0.2); }
        body.mode-personal { filter: hue-rotate(10deg); }
        body.mode-sleep { filter: brightness(0.7) sepia(0.2); }
        body.mode-focused { filter: contrast(1.1); }
    `;
    document.head.appendChild(style);
    
    // Define focus mode functions in global scope
    window.activateNormalMode = function() {
        document.getElementById('focus-indicator').textContent = 'Normal Mode';
        document.body.className = document.body.className.replace(/mode-\w+/g, '') + ' mode-normal';
    };
    
    window.activateDoNotDisturb = function() {
        document.getElementById('focus-indicator').textContent = 'Do Not Disturb';
        document.body.className = document.body.className.replace(/mode-\w+/g, '') + ' mode-dnd';
    };
    
    window.activateWorkMode = function() {
        document.getElementById('focus-indicator').textContent = 'Work Mode';
        document.body.className = document.body.className.replace(/mode-\w+/g, '') + ' mode-work';
    };
    
    window.activatePersonalMode = function() {
        document.getElementById('focus-indicator').textContent = 'Personal Mode';
        document.body.className = document.body.className.replace(/mode-\w+/g, '') + ' mode-personal';
    };
    
    window.activateSleepMode = function() {
        document.getElementById('focus-indicator').textContent = 'Sleep Mode';
        document.body.className = document.body.className.replace(/mode-\w+/g, '') + ' mode-sleep';
    };
    
    window.activateFocusedMode = function() {
        document.getElementById('focus-indicator').textContent = 'Focused Mode';
        document.body.className = document.body.className.replace(/mode-\w+/g, '') + ' mode-focused';
    };
    
    // Set up messaging with the background script - use browser namespace for Safari compatibility
    const runtime = window.browser ? browser.runtime : chrome.runtime;
    
    runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'applyFocusMode') {
            const fn = window[message.focusFunction];
            if (typeof fn === 'function') {
                try {
                    fn();
                    console.log(`Applied focus mode: ${message.focusMode}`);
                } catch(e) {
                    console.error("Error executing focus function:", e);
                }
            } else {
                console.error(`Focus function ${message.focusFunction} not found`);
            }
        }
    });
    
    // Request current focus mode
    runtime.sendMessage({action: 'getFocusMode'}, (response) => {
        if (response && response.focusFunction) {
            const fn = window[response.focusFunction];
            if (typeof fn === 'function') {
                fn();
            }
        }
    });
});
