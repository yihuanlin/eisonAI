import Foundation
import os.log
import SafariServices

class FocusStatusMonitor {
    private let logger = Logger(subsystem: "com.yhl.summariser.Extension", category: "FocusMonitor")
    private var currentFocusMode: String = "Normal"
    
    // Initialize with the default focus mode
    init(initialMode: String = "Normal") {
        self.currentFocusMode = initialMode
    }
    
    // Update current focus mode and notify listeners
    func updateFocusMode(_ mode: String) {
        self.currentFocusMode = mode
        notifyExtension()
    }
    
    // Get current focus mode
    func getCurrentFocusMode() -> String {
        return currentFocusMode
    }
    
    // Notify extension about focus mode change
    private func notifyExtension() {
        logger.info("Focus mode changed to: \(self.currentFocusMode)")
        
        // Post notification for the extension handler
        NotificationCenter.default.post(
            name: NSNotification.Name("FocusStatusDidChange"),
            object: self,
            userInfo: ["mode": self.currentFocusMode]
        )
        
        // Notify Safari extension on macOS
        #if os(macOS)
        SFSafariApplication.getActiveWindow { window in
            window?.getActiveTab { tab in
                tab?.getActivePage { page in
                    let functionName = self.getFunctionNameForMode(self.currentFocusMode)
                    page?.dispatchMessageToScript(
                        withName: "focusChanged",
                        userInfo: [
                            "mode": self.currentFocusMode,
                            "functionName": functionName
                        ]
                    )
                }
            }
        }
        #endif
    }
    
    // Helper method to get function name for a focus mode
    private func getFunctionNameForMode(_ mode: String) -> String {
        switch mode {
        case "Do Not Disturb": return "activateDoNotDisturb"
        case "Work": return "activateWorkMode"
        case "Personal": return "activatePersonalMode"
        case "Sleep": return "activateSleepMode"
        case "Focused": return "activateFocusedMode"
        default: return "activateNormalMode"
        }
    }
}
