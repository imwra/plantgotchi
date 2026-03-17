import SwiftUI

@main
struct PlantgotchiMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var menuBarController = MenuBarSceneController()

    var body: some Scene {
        MenuBarExtra {
            MenuBarPanelView(controller: menuBarController)
        } label: {
            MenuBarStatusView(snapshot: menuBarController.snapshot)
        }

        WindowGroup("Garden") {
            Text("Mac garden shell")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .defaultSize(width: 1100, height: 760)
    }
}
