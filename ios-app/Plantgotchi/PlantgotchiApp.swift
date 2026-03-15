import SwiftUI
import BackgroundTasks
import PostHog

@main
struct PlantgotchiApp: App {
    @StateObject private var bleManager = BLEManager()

    init() {
        // Initialize the database on launch
        _ = AppDatabase.shared

        // Initialize PostHog analytics
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: configPath),
           let apiKey = config["PostHogApiKey"] as? String, !apiKey.isEmpty {
            let phConfig = PostHogConfig(apiKey: apiKey)
            phConfig.host = config["PostHogHost"] as? String ?? "https://us.i.posthog.com"
            phConfig.captureScreenViews = true
            phConfig.captureApplicationLifecycleEvents = true
            phConfig.sessionReplay = true
            PostHogSDK.shared.setup(phConfig)
            PostHogSDK.shared.register(["platform": "ios", "app_version": "1.0.0"])
        }

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
