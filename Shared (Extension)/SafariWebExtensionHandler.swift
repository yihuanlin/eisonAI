//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by 黃佁媛 on 2024/4/10.
//

import SafariServices
import os.log
import Intents // Make sure Intents framework is imported and linked

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    // Hold the context during async operations
    private var currentContext: NSExtensionContext?

    func beginRequest(with context: NSExtensionContext) {
        // Store the context for later use in async callbacks
        self.currentContext = context

        let request = context.inputItems.first as? NSExtensionItem

        // --- Get profile ---
        let profile: UUID?
        #if os(macOS)
        if #available(macOS 14.0, *) {
             profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
         } else {
             profile = request?.userInfo?["profile"] as? UUID // Fallback for older macOS if needed
         }
        #else // iOS
        if #available(iOS 17.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID // Fallback for older iOS if needed
        }
        #endif


        // --- Get message ---
        let message: Any?
        #if os(macOS)
        if #available(macOS 14.0, *) {
             message = request?.userInfo?[SFExtensionMessageKey]
         } else {
             message = request?.userInfo?["message"] // Fallback for older macOS if needed
         }
        #else // iOS
        if #available(iOS 17.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"] // Fallback for older iOS if needed
        }
        #endif


        os_log(.default, "[FocusCheck] Received message: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")

        // Check if message is a dictionary and handle "checkFocusMode" command
        if let messageDict = message as? [String: Any],
           let command = messageDict["command"] as? String,
           command == "checkFocusMode" {

            os_log(.default, "[FocusCheck] Handling 'checkFocusMode' command.")

            // Use the Intents API for iOS 15+ / macOS 12+
            if #available(iOS 15.0, macOS 12.0, *) {
                // Start the asynchronous focus status check
                checkFocusStatus { [weak self] focusModeResult in
                    os_log(.default, "[FocusCheck] Async checkFocusStatus completed with result: %@", focusModeResult)
                    // Pass the stored context to the completion function
                    self?.completeRequest(payload: ["focusMode": focusModeResult])
                }
                // *** IMPORTANT: Do NOT complete the request here. It's handled in the callback. ***
                return // Exit beginRequest early, wait for the async callback

            } else {
                // Fallback for older OS versions where Focus API is not available
                os_log(.default, "[FocusCheck] Focus Status API not available on this OS version.")
                completeRequest(payload: ["focusMode": "Unsupported OS version"])
            }

        } else {
            // Default response for other messages (echo)
            os_log(.default, "[FocusCheck] Handling non-checkFocusMode message (echo).")
            completeRequest(payload: ["echo": message ?? "nil message received"])
        }
    }

    // Centralized function to complete the request safely on the main thread
    private func completeRequest(payload: [String: Any]) {
         // Ensure we have a context to complete
         guard let context = self.currentContext else {
            os_log(.error, "[FocusCheck] Error: Context is nil. Cannot complete request.")
            return
        }
        // Ensure this completion logic runs on the main thread
        DispatchQueue.main.async {
            let response = NSExtensionItem()
            var responseKey: String

             #if os(macOS)
             if #available(macOS 14.0, *) {
                  responseKey = SFExtensionMessageKey
              } else {
                  responseKey = "message"
              }
             #else // iOS
             if #available(iOS 17.0, *) {
                 responseKey = SFExtensionMessageKey
             } else {
                 responseKey = "message"
             }
             #endif

            response.userInfo = [responseKey: payload]
            os_log(.default, "[FocusCheck] Attempting to complete request. Key: %@, Payload: %@", responseKey, String(describing: payload))

            context.completeRequest(returningItems: [response], completionHandler: { [weak self] expired in
                 if expired {
                     os_log(.error, "[FocusCheck] Error: Extension request expired before completion.")
                 } else {
                     os_log(.default, "[FocusCheck] Extension request completed successfully.")
                 }
                 // Clean up context after completion
                 self?.currentContext = nil
            })
        }
    }

    @available(iOS 15.0, macOS 12.0, *)
    private func checkFocusStatus(completion: @escaping (String) -> Void) {
        os_log(.default, "[FocusCheck] Checking focus authorization status...")
        let authStatus = INFocusStatusCenter.default.authorizationStatus
        os_log(.default, "[FocusCheck] Authorization status raw value: %ld", authStatus.rawValue)

        switch authStatus {
        case .notDetermined:
            os_log(.default, "[FocusCheck] Authorization not determined. Requesting...")
            // Request authorization asynchronously
            INFocusStatusCenter.default.requestAuthorization { [weak self] status in
                os_log(.default, "[FocusCheck] Authorization request completed with status raw value: %ld", status.rawValue)
                if status == .authorized {
                    // If authorized, proceed to get the current mode
                    self?.getCurrentFocusMode(completion: completion)
                } else {
                    // If denied, call completion handler with the result
                    completion("Authorization denied")
                }
            }
        case .authorized:
            os_log(.default, "[FocusCheck] Already authorized. Getting current focus mode...")
            // Already authorized, proceed to get the current mode
            getCurrentFocusMode(completion: completion)
        case .denied:
            os_log(.default, "[FocusCheck] Authorization status: denied.")
            completion("Authorization denied")
        case .restricted:
            os_log(.default, "[FocusCheck] Authorization status: restricted.")
            completion("Authorization restricted")
        @unknown default:
            os_log(.default, "[FocusCheck] Unknown authorization status.")
            completion("Unknown authorization status")
        }
        // Note: No direct call to 'completion' here for .notDetermined or .authorized paths,
        // as it's handled within their respective async blocks or subsequent function calls.
    }

    @available(iOS 15.0, macOS 12.0, *)
    private func getCurrentFocusMode(completion: @escaping (String) -> Void) {
        os_log(.default, "[FocusCheck] Getting current focus status object...")
        // Get the current focus status (non-optional struct)
        let focusStatus = INFocusStatusCenter.default.focusStatus
        os_log(.default, "[FocusCheck] Raw INFocusStatus description: %@", focusStatus.description)

        // Check if focus mode is active (isFocused is an Optional Bool)
        if let isFocused = focusStatus.isFocused, isFocused {
            os_log(.default, "[FocusCheck] Focus mode is active (isFocused == true).")
            // Try to get the name of the active focus mode
            if let focusModeName = getFocusModeName(focusStatus) {
                os_log(.default, "[FocusCheck] Determined focus mode name: %@", focusModeName)
                completion(focusModeName)
            } else {
                os_log(.default, "[FocusCheck] Focus mode active, but could not determine name.")
                completion("Focus mode active (unnamed)") // Indicate active but no name found
            }
        } else {
            // isFocused is false or nil
             os_log(.default, "[FocusCheck] No focus mode active (isFocused is false or nil). isFocused value: %@", String(describing: focusStatus.isFocused))
            completion("None") // Indicate no focus mode is active
        }
    }

    // Helper method to safely get focus mode name using KVC or regex fallback
    @available(iOS 15.0, macOS 12.0, *)
    private func getFocusModeName(_ focusStatus: INFocusStatus) -> String? {
        // Attempt 1: Use Key-Value Coding (KVC) to access internal property (may be fragile)
        os_log(.default, "[FocusCheck] Attempting to get focus mode name via KVC ('modeName')...")
        if let value = focusStatus.value(forKey: "modeName") as? String, !value.isEmpty {
            os_log(.default, "[FocusCheck] Got name via KVC: %@", value)
            return value
        }
        os_log(.default, "[FocusCheck] KVC failed or returned empty string.")

        // Attempt 2: Fallback to parsing the description string (less reliable)
        let focusStatusDescription = focusStatus.description
        os_log(.default, "[FocusCheck] Attempting name via description parsing: %@", focusStatusDescription)
        // Regex looking for "modeName: <name>" pattern, stopping at comma or end of string
        let pattern = "modeName:\\s*([^,]+)"
        do {
            let regex = try NSRegularExpression(pattern: pattern, options: [])
            if let match = regex.firstMatch(in: focusStatusDescription, options: [], range: NSRange(location: 0, length: focusStatusDescription.utf16.count)),
               match.numberOfRanges > 1 {
                let range = match.range(at: 1) // Capture group 1
                if let swiftRange = Range(range, in: focusStatusDescription) {
                    let name = String(focusStatusDescription[swiftRange]).trimmingCharacters(in: .whitespacesAndNewlines)
                    // Ensure the extracted name is not empty
                    if !name.isEmpty {
                         os_log(.default, "[FocusCheck] Got name via regex: %@", name)
                        return name
                    } else {
                        os_log(.default, "[FocusCheck] Regex matched but extracted name was empty.")
                    }
                }
            } else {
                 os_log(.default, "[FocusCheck] Regex did not find a match for 'modeName:'.")
            }
        } catch {
            os_log(.error, "[FocusCheck] Regex error while parsing description: %@", error.localizedDescription)
        }

        os_log(.default, "[FocusCheck] Could not determine focus mode name via KVC or regex.")
        return nil // Return nil if name couldn't be found
    }
}
