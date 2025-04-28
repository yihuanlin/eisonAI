import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    // Add an instance of our handler
    private let newTabHandler = NewTabFocusHandler()
    
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

        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)",
               String(describing: message), profile?.uuidString ?? "none")

        // Handle messages related to new tab and focus
        var responseMessage: [String: Any] = ["echo": message ?? ""]
        
        if let messageDict = message as? [String: Any] {
            if let action = messageDict["action"] as? String {
                switch action {
                // Request for new tab HTML URL
                case "getNewTabInfo":
                    // Get path directly - no need for optional binding
                    let htmlPath = newTabHandler.getNewTabURL()
                    
                    // Simply use the path as is - no file:// prefix
                    responseMessage["newTabURL"] = htmlPath
                    responseMessage["focusMode"] = newTabHandler.getCurrentFocusMode()
                    responseMessage["focusFunction"] = newTabHandler.getFunctionNameForMode(
                        newTabHandler.getCurrentFocusMode())
                    
                // Update focus mode from system
                case "updateFocusMode":
                    if let mode = messageDict["mode"] as? String {
                        newTabHandler.updateFocusMode(mode)
                        responseMessage["focusMode"] = mode
                        responseMessage["focusFunction"] = newTabHandler.getFunctionNameForMode(mode)
                    }
                    
                // Request current focus mode
                case "getCurrentFocusMode":
                    let currentMode = newTabHandler.getCurrentFocusMode()
                    responseMessage["focusMode"] = currentMode
                    responseMessage["focusFunction"] = newTabHandler.getFunctionNameForMode(currentMode)
                    
                default:
                    // Handle other messages or pass to summarizer if needed
                    break
                }
            }
        }

        let response = NSExtensionItem()
        
        if #available(iOS 17.0, macOS 14.0, *) {
            response.userInfo = [ SFExtensionMessageKey: responseMessage ]
        } else {
            response.userInfo = [ "message": responseMessage ]
        }

        context.completeRequest(returningItems: [ response ], completionHandler: nil)
    }
}
