import Foundation
import os.log

class NewTabFocusHandler {
    // Use the default OS logger
    private let logger = OSLog(subsystem: "com.yhl.summariser.Extensionn", category: "NewTabFocus")
    private var lastKnownFocusMode: String = "Normal"
    
    // Get URL to the custom new tab HTML
    func getNewTabPath() -> String {
        return "home/index.html"
    }
    
    // Alias for getNewTabPath to match expected method name
    func getNewTabURL() -> String {
        return getNewTabPath()
    }
    
    // Get current focus mode
    func getCurrentFocusMode() -> String {
        // Implement logic to get current focus mode from your focus monitor
        // For now returning the cached value
        return lastKnownFocusMode
    }
    
    // Update focus mode based on message from JavaScript
    func updateFocusMode(_ mode: String) {
        lastKnownFocusMode = mode
    }
    
    // Map focus mode to JavaScript function name
    func getFunctionNameForMode(_ mode: String) -> String {
        switch mode {
        case "Do Not Disturb":
            return "activateDoNotDisturb"
        case "Work":
            return "activateWorkMode"
        case "Personal":
            return "activatePersonalMode"
        case "Sleep":
            return "activateSleepMode"
        case "Focused":
            return "activateFocusedMode"
        default:
            return "activateNormalMode"
        }
    }
    
    // Comprehensive info method for JavaScript communication
    func getNewTabInfo() -> [String: String] {
        let currentMode = getCurrentFocusMode()
        return [
            "focusMode": currentMode,
            "focusFunction": getFunctionNameForMode(currentMode),
            "newTabPath": getNewTabPath()
        ]
    }
}
