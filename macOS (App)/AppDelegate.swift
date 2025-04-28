import Cocoa // Make sure Cocoa is imported

@main
class AppDelegate: NSObject, NSApplicationDelegate {

    // Define the App Group ID and UserDefaults key constants
    let appGroupID = "group.com.yhl.summariser" // ** USE YOUR ACTUAL APP GROUP ID **
    let focusModeKey = "currentSystemFocusMode"

    func applicationDidFinishLaunching(_ notification: Notification) {
        print("AppDelegate: Application finished launching.")

        // --- Register Observers ---

        // Observe Sleep Notifications
        NSWorkspace.shared.notificationCenter.addObserver(
            self, // Observe on this instance of AppDelegate
            selector: #selector(systemWillSleep(_:)), // Call the instance method
            name: NSWorkspace.willSleepNotification,
            object: nil // Observe from any object
        )
        print("AppDelegate: Registered observer for willSleepNotification.")

        // Observe Wake Notifications
        NSWorkspace.shared.notificationCenter.addObserver(
            self,
            selector: #selector(systemDidWake(_:)),
            name: NSWorkspace.didWakeNotification,
            object: nil
        )
        print("AppDelegate: Registered observer for didWakeNotification.")

        // TODO: Add observers for Do Not Disturb / Focus Mode changes if possible.
        // This often requires more complex methods like observing distributed notifications
        // or using newer, potentially private, APIs.
        // Example (Conceptual - Requires Research for reliable DND/Focus names):
        // NSDistributedNotificationCenter.default().addObserver(
        //     self,
        //     selector: #selector(focusModeDidChange(_:)),
        //     name: NSNotification.Name("com.apple.some.focus.change.notification"), // Hypothetical name
        //     object: nil
        // )

        // --- Initial Check ---
        // Optional: Check the current state immediately on launch,
        // assuming 'Normal' if not sleeping or in DND.
        // This requires a function to *query* the state, which is complex.
        // For now, we'll rely on wake notification to reset to "Normal".
        // If the app launches while *already* sleeping, willSleep won't fire until next sleep.
        // If it launches while *already* in DND, we need a way to detect that.
        // Let's default to Normal initially, unless we can determine otherwise.
        // We might need a separate check for DND status at launch.
         checkInitialFocusState()


        print("AppDelegate: Setup complete.")
    }

    func applicationWillTerminate(_ notification: Notification) {
        // --- Unregister Observers ---
        NSWorkspace.shared.notificationCenter.removeObserver(self) // Remove all workspace observers for self
        // NSDistributedNotificationCenter.default().removeObserver(self) // Remove distributed observers if added
        print("AppDelegate: Application will terminate, observers removed.")
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // Set to false if you want the app to run in the background without a window
        // Set to true if closing the (optional) window should quit the app
        return true // Or false if it's a background agent
    }

    // --- Notification Handlers (now instance methods) ---

    @objc func systemWillSleep(_ notification: Notification) {
        print("AppDelegate: System will sleep notification received.")
        updateSharedFocusMode(mode: "Sleep")
    }

    @objc func systemDidWake(_ notification: Notification) {
        print("AppDelegate: System did wake notification received.")
        // When waking up, assume "Normal" unless DND/Focus is active.
        // We need a way to check DND/Focus state here.
        // For now, let's reset to "Normal" as a basic implementation.
        // TODO: Check actual DND/Focus status upon waking.
        updateSharedFocusMode(mode: "Normal")
    }

    // Example handler for a hypothetical DND/Focus change notification
    // @objc func focusModeDidChange(_ notification: Notification) {
    //    print("AppDelegate: Focus mode change notification received: \(notification.name)")
    //    // Here you would need logic to DETERMINE the *new* state (e.g., "Work", "DND", "Normal")
    //    // This notification often just tells you *something* changed.
    //    // You might need to query the actual state using other means.
    //    let newState = determineCurrentFocusState() // Placeholder for complex logic
    //    updateSharedFocusMode(mode: newState)
    // }

    // --- Helper Functions (now instance methods or private) ---

    private func updateSharedFocusMode(mode: String) {
        // Use the instance constant for App Group ID
        if let sharedDefaults = UserDefaults(suiteName: appGroupID) {
            let currentStoredMode = sharedDefaults.string(forKey: focusModeKey)
            if currentStoredMode != mode {
                sharedDefaults.set(mode, forKey: focusModeKey)
                print("AppDelegate: Shared Defaults Updated - Focus Mode set to '\(mode)'")
            } else {
                 print("AppDelegate: Shared Defaults - Focus Mode already '\(mode)', no update needed.")
            }
        } else {
            print("AppDelegate Error: Could not access shared UserDefaults with suite name '\(appGroupID)'. Check App Group configuration.")
        }
    }

    // Placeholder for logic to determine the current focus state (DND, specific Focus modes)
    // This is the hard part and might involve undocumented APIs or libraries.
    private func determineCurrentFocusState() -> String {
        print("AppDelegate: Determining current focus state (basic implementation).")
        // Basic check: Is DND on? (Requires a method to check DND status)
        // if isDoNotDisturbActive() { // isDoNotDisturbActive() is a placeholder function
        //     return "Do Not Disturb"
        // }

        // Add checks for other focus modes if possible

        // Default if no specific focus mode detected
        return "Normal"
    }

    // Placeholder for initial state check
    private func checkInitialFocusState() {
        print("AppDelegate: Checking initial focus state.")
        // Check sleep status first (unlikely to be sleeping at launch, but possible)
        // Check DND/Focus status
        let initialState = determineCurrentFocusState()
        updateSharedFocusMode(mode: initialState) // Set initial state in UserDefaults
    }

    // Placeholder function - implement actual DND check if possible
    // private func isDoNotDisturbActive() -> Bool {
    //    print("AppDelegate: Checking DND status (placeholder - needs implementation).")
    //    // Implement logic here using reliable macOS APIs if available.
    //    // This might involve checking system preferences files, using private APIs,
    //    // or specific libraries designed for this. It's notoriously difficult.
    //    return false // Default to false
    // }
}
