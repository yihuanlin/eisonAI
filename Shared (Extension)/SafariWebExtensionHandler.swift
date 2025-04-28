import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    // Use FocusStatusMonitor instead of the NewTabHandler
    private let focusMonitor = FocusStatusMonitor()
    private let logger = Logger(subsystem: "com.yhl.summariser.Extension", category: "ExtensionHandler")
    
    override init() {
        super.init()
        
        // Register for focus mode change notifications
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleFocusModeChange(_:)),
            name: NSNotification.Name("FocusStatusDidChange"),
            object: nil
        )
        
        logger.info("SafariWebExtensionHandler initialized and listening for focus changes")
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let profile: UUID?
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

        // Prepare response message
        var responseMessage: [String: Any] = ["received": true]
        
        if let messageDict = message as? [String: Any] {
            if let action = messageDict["action"] as? String {
                switch action {
                // Update focus mode from system
                case "updateFocusMode":
                    if let mode = messageDict["mode"] as? String {
                        focusMonitor.updateFocusMode(mode)
                        responseMessage["success"] = true
                        responseMessage["focusMode"] = mode
                        responseMessage["focusFunction"] = getFunctionNameForMode(mode)
                        logger.info("Focus mode updated to: \(mode)")
                    } else {
                        responseMessage["success"] = false
                        responseMessage["error"] = "No mode provided"
                    }
                    
                // Request current focus mode
                case "getCurrentFocusMode":
                    let currentMode = focusMonitor.getCurrentFocusMode()
                    responseMessage["success"] = true
                    responseMessage["focusMode"] = currentMode
                    responseMessage["focusFunction"] = getFunctionNameForMode(currentMode)
                    logger.info("Returning current focus mode: \(currentMode)")
                    
                default:
                    logger.info("Unknown action: \(action)")
                    responseMessage["success"] = false
                    responseMessage["error"] = "Unknown action"
                }
            } else {
                logger.info("No action specified in message")
                responseMessage["success"] = false
                responseMessage["error"] = "No action specified"
            }
        } else {
            logger.info("Message is not a dictionary")
            responseMessage["success"] = false
            responseMessage["error"] = "Invalid message format"
        }

        // Create and send response
        let response = NSExtensionItem()
        
        if #available(iOS 17.0, macOS 14.0, *) {
            response.userInfo = [ SFExtensionMessageKey: responseMessage ]
        } else {
            response.userInfo = [ "message": responseMessage ]
        }

        context.completeRequest(returningItems: [ response ], completionHandler: nil)
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
    
    @objc private func handleFocusModeChange(_ notification: Notification) {
        if let mode = notification.userInfo?["mode"] as? String {
            logger.info("Focus mode changed notification received: \(mode)")
            
            #if os(macOS)
            // Try multiple message formats for better compatibility
            let functionName = getFunctionNameForMode(mode)
            
            // Format 1: Standard message format
            SFSafariApplication.dispatchMessage(
                withName: "focusChanged",
                toExtensionWithIdentifier: "com.yhl.summariser.Extension",
                userInfo: [
                    "mode": mode,
                    "functionName": functionName
                ]
            )
            
            // Format 2: Try action-based format that background.js might expect
            SFSafariApplication.getActiveWindow { window in
                window?.getActiveTab { tab in
                    tab?.getActivePage { page in
                        page?.dispatchMessageToScript(
                            withName: "message",
                            userInfo: [
                                "action": "focusChanged",
                                "focusMode": mode,
                                "focusFunction": functionName
                            ]
                        )
                    }
                }
            }
            
            logger.info("Dispatched focus change to background script using multiple formats: \(mode)")
            #endif
        }
    }
}
