import SwiftUI
#if os(iOS)
import BackgroundTasks
#endif
import PostHog

#if os(iOS)
@main
struct PlantgotchiApp: App {
    @StateObject private var bleManager = BLEManager()
    @ObservedObject private var themeManager = ThemeManager.shared
    @ObservedObject private var localeManager = LocaleManager.shared
    @StateObject private var authService: AuthService

    init() {
        // Initialize the database on launch
        _ = AppDatabase.shared

        // Read base URL from Config.plist, default to localhost for dev
        let baseURL: String
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: configPath),
           let url = config["APIBaseURL"] as? String, !url.isEmpty {
            baseURL = url
        } else {
            baseURL = "http://localhost:4321"
        }

        _authService = StateObject(wrappedValue: AuthService(baseURL: baseURL))

        // Re-identify returning user on launch
        if let _ = KeychainManager().getToken(),
           let userId = UserDefaults.standard.string(forKey: "authUserId") {
            var traits: [String: Any] = ["platform": "ios"]
            if let email = UserDefaults.standard.string(forKey: "authUserEmail") {
                traits["email"] = email
            }
            if let name = UserDefaults.standard.string(forKey: "authUserName") {
                traits["name"] = name
            }
            Analytics.identify(userId: userId, traits: traits)
        }

        // Load demo data on first launch
        if !UserDefaults.standard.bool(forKey: "demoDataSeeded")
            && !UserDefaults.standard.bool(forKey: "demoModeExplicitlyOff") {
            let userId = UserDefaults.standard.string(forKey: "authUserId") ?? "default-user"
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

        // Global exception handler
        NSSetUncaughtExceptionHandler { exception in
            let error = NSError(
                domain: exception.name.rawValue,
                code: 0,
                userInfo: [NSLocalizedDescriptionKey: exception.reason ?? ""]
            )
            Analytics.captureException(error, context: [
                "$exception_stack_trace_raw": exception.callStackSymbols.joined(separator: "\n"),
            ])
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
            Group {
                if authService.isAuthenticated {
                    GardenView()
                } else {
                    LoginView()
                }
            }
            .environmentObject(bleManager)
            .environmentObject(themeManager)
            .environmentObject(localeManager)
            .environmentObject(authService)
        }
    }
}
#else
// macOS stub — app entry point is iOS only; macOS target is for SPM testing only.
@main
struct PlantgotchiApp {
    static func main() {}
}
#endif
