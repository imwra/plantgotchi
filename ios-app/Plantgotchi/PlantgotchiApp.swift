import SwiftUI
import BackgroundTasks
import PostHog

@main
struct PlantgotchiApp: App {
    @StateObject private var bleManager = BLEManager()
    @ObservedObject private var themeManager = ThemeManager.shared
    @ObservedObject private var localeManager = LocaleManager.shared

    init() {
        // Initialize the database on launch
        _ = AppDatabase.shared

        // Load demo data on first launch
        if !UserDefaults.standard.bool(forKey: "demoDataSeeded")
            && !UserDefaults.standard.bool(forKey: "demoModeExplicitlyOff") {
            let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"
            try? AppDatabase.shared.loadDemoData(userId: userId)
            UserDefaults.standard.set(true, forKey: "demoDataSeeded")
        }

        // Initialize PostHog analytics
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: configPath),
           let apiKey = config["PostHogApiKey"] as? String, !apiKey.isEmpty {
            let hostString = config["PostHogHost"] as? String ?? "https://us.i.posthog.com"
            let phConfig = PostHogConfig(apiKey: apiKey, host: hostString)
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
                .environmentObject(themeManager)
                .environmentObject(localeManager)
        }
    }
}
