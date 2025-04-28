//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by 黃佁媛 on 2024/4/10.
//

import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

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

        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")

        let response = NSExtensionItem()
        
        // Check if message is a dictionary and handle "checkFocusMode" command
        if let messageDict = message as? [String: Any], 
        let command = messageDict["command"] as? String,
        command == "checkFocusMode" {
            
            // Create a process to run the shell command
            let task = Process()
            let pipe = Pipe()
            
            task.launchPath = "/bin/bash"
            task.arguments = ["-c", "shortcuts run \"GetCurrentFocus\" 2>/dev/null"]
            task.standardOutput = pipe
            
            do {
                try task.run()
                
                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                if let output = String(data: data, encoding: .utf8) {
                    response.userInfo = [ SFExtensionMessageKey: [ "focusMode": output.trimmingCharacters(in: .whitespacesAndNewlines) ] ]
                } else {
                    response.userInfo = [ SFExtensionMessageKey: [ "focusMode": "Error: Could not read output" ] ]
                }
            } catch {
                response.userInfo = [ SFExtensionMessageKey: [ "focusMode": "Error: \(error.localizedDescription)" ] ]
            }
        } else {
            // Default response for other messages
            response.userInfo = [ SFExtensionMessageKey: [ "echo": message ] ]
        }

        context.completeRequest(returningItems: [ response ], completionHandler: nil)
    }


}
