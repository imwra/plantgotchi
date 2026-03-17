import SwiftUI
import PlantgotchiCore

@main
struct PlantgotchiMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var menuBarController: MenuBarSceneController

    init() {
        let controller = MenuBarSceneController()
        _menuBarController = StateObject(wrappedValue: controller)
        AppDelegate.refreshHandler = {
            controller.refresh()
        }
    }

    var body: some Scene {
        MenuBarExtra {
            MenuBarPanelView(controller: menuBarController)
        } label: {
            MenuBarStatusView(snapshot: menuBarController.snapshot)
        }

        WindowGroup("Garden", id: "garden") {
            GardenWindowView(snapshot: menuBarController.snapshot ?? fallbackSnapshot)
        }
        .defaultSize(width: 1100, height: 760)
    }

    private var fallbackSnapshot: GardenSnapshot {
        MenuBarPanelViewModel.makeSnapshot(vitality: .medium, attentionCount: 0)
    }
}
