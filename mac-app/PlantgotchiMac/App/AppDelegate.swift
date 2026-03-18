import AppKit

final class AppDelegate: NSObject, NSApplicationDelegate {
    static var refreshHandler: (() -> Void)?

    func applicationDidFinishLaunching(_ notification: Notification) {
        Self.refreshHandler?()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(windowDidOpen(_:)),
            name: NSWindow.didBecomeMainNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(windowWillClose(_:)),
            name: NSWindow.willCloseNotification,
            object: nil
        )
    }

    func applicationDidBecomeActive(_ notification: Notification) {
        Self.refreshHandler?()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    @objc private func windowDidOpen(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
    }

    @objc private func windowWillClose(_ notification: Notification) {
        DispatchQueue.main.async {
            let hasVisibleWindows = NSApp.windows.contains { window in
                window.isVisible && !window.className.contains("StatusBar")
                    && window.level == .normal
            }
            if !hasVisibleWindows {
                NSApp.setActivationPolicy(.accessory)
            }
        }
    }
}
