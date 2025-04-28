// FocusStatusMonitor.swift (Modified)
import Foundation
import os.log

class FocusStatusMonitor {
    private let logger = Logger(subsystem: "com.yhl.summariser.Extension", category: "FocusMonitor")
    private let sharedDefaults = UserDefaults(suiteName: "group.com.yhl.summariser") // ** USE YOUR APP GROUP ID **
    private let defaultsKey = "currentSystemFocusMode"
    private var lastKnownMode: String = "Normal" // Keep track to notify only on change

    // Timer to periodically check the shared defaults
    private var checkTimer: Timer?

    init() {
        logger.info("FocusStatusMonitor initializing.")
        // Initial read
        self.lastKnownMode = readFocusModeFromDefaults()
        logger.info("Initial focus mode read from shared defaults: \(self.lastKnownMode)")

        // Start a timer to periodically check for changes written by the main app
        // Adjust interval as needed (e.g., 5 seconds)
        checkTimer = Timer.scheduledTimer(timeInterval: 5.0, target: self, selector: #selector(checkForFocusUpdate), userInfo: nil, repeats: true)
        // Ensure timer runs on main loop if needed for specific modes
         RunLoop.main.add(checkTimer!, forMode: .common)

         // Note: Also consider observing UserDefaults KVO if reliable across processes,
         // but timer is often simpler for App Group defaults.
    }

    deinit {
        checkTimer?.invalidate()
        logger.info("FocusStatusMonitor deinitialized.")
    }

    // Method called by the timer
    @objc private func checkForFocusUpdate() {
        let currentMode = readFocusModeFromDefaults()
        if currentMode != self.lastKnownMode {
            logger.info("Detected focus mode change via shared defaults: \(self.lastKnownMode) -> \(currentMode)")
            self.lastKnownMode = currentMode
            notifyExtensionHandler(mode: currentMode) // Notify SafariWebExtensionHandler
        }
         // else { logger.debug("No focus change detected in shared defaults.") } // Optional debug logging
    }

    // Reads the value from shared UserDefaults
    private func readFocusModeFromDefaults() -> String {
        guard let defaults = sharedDefaults else {
            logger.error("Cannot access shared defaults.")
            return "Normal" // Fallback
        }
        // Read the string, provide "Normal" as default if key doesn't exist
        return defaults.string(forKey: defaultsKey) ?? "Normal"
    }

    // Public getter now reads directly from the source (or last known if timer is used)
    func getCurrentFocusMode() -> String {
         let mode = readFocusModeFromDefaults() // Always get the latest from defaults on request
         logger.info("Returning current focus mode from shared defaults: \(mode)")
         return mode
         // Or return self.lastKnownMode if you only want timer-driven updates reported
         // logger.info("Returning last known focus mode: \(self.lastKnownMode)")
         // return self.lastKnownMode
    }

    // This function is now primarily for *notifying* the handler, not setting state
    private func notifyExtensionHandler(mode: String) {
        logger.info("Posting FocusStatusDidChange notification for mode: \(mode)")
        NotificationCenter.default.post(
            name: .FocusStatusDidChange, // Use defined name
            object: self,
            userInfo: ["mode": mode]
        )
    }

    // You might not need updateFocusMode anymore if JS doesn't need to *set* the mode
    // Or keep it if you want JS to be able to *write* back to defaults (less common)
    // func updateFocusMode(_ mode: String) { ... write to sharedDefaults ... }


    // Helper function remains the same
    func getFunctionNameForMode(_ mode: String) -> String {
        let functionName: String
        switch mode {
         case "Do Not Disturb": functionName = "activateDoNotDisturb"
         case "Work":           functionName = "activateWorkMode"
         case "Personal":       functionName = "activatePersonalMode"
         case "Sleep":          functionName = "activateSleepMode"
         case "Focused":        functionName = "activateFocusedMode"
         default:               functionName = "activateNormalMode"
         }
         return functionName
    }
}

// Define the notification name clearly (keep this)
extension Notification.Name {
    static let FocusStatusDidChange = Notification.Name("FocusStatusDidChange")
}
