import SwiftUI
import BackgroundTasks

@main
struct PlantgotchiApp: App {
    @StateObject private var bleManager = BLEManager()

    init() {
        // Initialize the database on launch
        _ = AppDatabase.shared

        // Register background task for Claude API analysis
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: BackgroundAgent.taskIdentifier,
            using: nil
        ) { task in
            guard let refreshTask = task as? BGAppRefreshTask else { return }
            BackgroundAgent.shared.handleAppRefresh(task: refreshTask)
        }
    }

    var body: some Scene {
        WindowGroup {
            GardenView()
                .environmentObject(bleManager)
        }
    }
}
