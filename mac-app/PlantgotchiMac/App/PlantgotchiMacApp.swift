import SwiftUI

@main
struct PlantgotchiMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup("Garden") {
            Text("Mac garden shell")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .defaultSize(width: 1100, height: 760)
    }
}
