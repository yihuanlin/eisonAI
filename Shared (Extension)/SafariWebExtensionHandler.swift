// SafariWebExtensionHandler.swift

import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    // Assuming FocusStatusMonitor is correctly defined (reading from UserDefaults)
    private let focusMonitor = FocusStatusMonitor()
    private let logger = Logger(subsystem: "com.yhl.summariser.Extension", category: "ExtensionHandler")

    override init() {
        super.init()
        // Observe the notification posted by FocusStatusMonitor (when it detects changes in UserDefaults)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleFocusModeChange(_:)),
            name: .FocusStatusDidChange, // Use the defined notification name
            object: nil // Observe notifications from any object posting this name
        )
        logger.info("SafariWebExtensionHandler initialized and observing FocusStatusDidChange.")
    }

    deinit {
        // Always unregister observers
        NotificationCenter.default.removeObserver(self, name: .FocusStatusDidChange, object: nil)
        logger.info("SafariWebExtensionHandler deinitialized.")
    }

    // Handle requests FROM the background script
    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let profile: UUID?
        // ... (profile and message extraction code remains the same)
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }

        let message: Any?
        if #available(iOS 17.0, macOS 14.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }


        logger.info("Received message from background script: \(String(describing: message)) (profile: \(profile?.uuidString ?? "none"))")

        var responseMessage: [String: Any] = ["received": true] // Base response

        // Safely cast message and action
        if let messageDict = message as? [String: Any], let action = messageDict["action"] as? String {
            logger.info("Processing action: \(action)")
            switch action {
            case "getCurrentFocusMode":
                // Get the mode directly from the monitor (which reads from UserDefaults)
                let currentMode = focusMonitor.getCurrentFocusMode()
                // Use the helper function from the focusMonitor instance
                let functionName = focusMonitor.getFunctionNameForMode(currentMode)
                responseMessage["success"] = true
                responseMessage["focusMode"] = currentMode
                responseMessage["focusFunction"] = functionName
                logger.info("Responding to getCurrentFocusMode with: \(currentMode) (\(functionName))")

            // **** REMOVED THE "updateFocusMode" CASE ****
            // case "updateFocusMode":
            //     // THIS BLOCK IS REMOVED because FocusStatusMonitor no longer has updateFocusMode
            //     // The state is now driven by the main app writing to UserDefaults.
            //     // ... (code that caused the error was here) ...

            default:
                responseMessage["success"] = false
                responseMessage["error"] = "Unknown action: \(action)"
                logger.warning("Received unknown action: \(action)")
            }
        } else {
            responseMessage["success"] = false
            responseMessage["error"] = "Invalid message format or missing action"
            logger.error("Received invalid message format or missing action: \(String(describing: message))")
        }

        // Send the response back to the background script
        let response = NSExtensionItem()
        // ... (response sending code remains the same)
        if #available(iOS 17.0, macOS 14.0, *) {
            response.userInfo = [ SFExtensionMessageKey: responseMessage ]
        } else {
            response.userInfo = [ "message": responseMessage ]
        }
        context.completeRequest(returningItems: [response], completionHandler: nil)
        logger.info("Completed request processing for action: \((message as? [String: Any])?["action"] as? String ?? "unknown").")
    }

    // Handle notifications ABOUT focus mode changes (triggered by FocusStatusMonitor's timer)
    @objc private func handleFocusModeChange(_ notification: Notification) {
        // ... (this function remains largely the same, dispatching the detected change)
        guard let mode = notification.userInfo?["mode"] as? String else {
            logger.warning("Received FocusStatusDidChange notification with missing/invalid mode information.")
            return
        }

        logger.info("Received FocusStatusDidChange notification: \(mode). Dispatching to background script.")
        let functionName = focusMonitor.getFunctionNameForMode(mode)

        #if os(macOS)
        let messageName = "focusChanged"
        let userInfoPayload: [String: Any] = [
            "mode": mode,
            "functionName": functionName
        ]

        SFSafariApplication.dispatchMessage(
            withName: messageName,
            toExtensionWithIdentifier: "com.yhl.summariser.Extension", // ** VERIFY YOUR BUNDLE ID **
            userInfo: userInfoPayload
        ) { error in
            if let error = error {
                self.logger.error("Error dispatching '\(messageName)' message to background script: \(error.localizedDescription)")
            } else {
                self.logger.info("Successfully dispatched '\(messageName)' message for mode: \(mode)")
            }
        }
        #else
        logger.info("Focus change detected on iOS: \(mode). (Dispatch logic primarily for macOS)")
        #endif
    }
}
