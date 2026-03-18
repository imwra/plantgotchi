import AppKit

final class AppDelegate: NSObject, NSApplicationDelegate {
    static var refreshHandler: (() -> Void)?

    func applicationDidFinishLaunching(_ notification: Notification) {
        Self.refreshHandler?()
    }

    func applicationDidBecomeActive(_ notification: Notification) {
        Self.refreshHandler?()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }
}
