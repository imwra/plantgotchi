import Foundation
import PostHog

public enum LogLevel: String {
    case info
    case warn
    case error
}

public enum Analytics {
    private static var isConfigured = false

    public static var currentPlatform: String {
        #if os(macOS)
        "macos"
        #elseif os(iOS)
        "ios"
        #else
        "unknown"
        #endif
    }

    public static func setup(
        apiKey: String,
        host: String = "https://us.i.posthog.com",
        platform: String = currentPlatform,
        appVersion: String = "1.0.0"
    ) {
        guard !apiKey.isEmpty else {
            isConfigured = false
            return
        }

        let config = PostHogConfig(apiKey: apiKey, host: host)
        config.captureScreenViews = true
        config.captureApplicationLifecycleEvents = true

        PostHogSDK.shared.setup(config)
        PostHogSDK.shared.register([
            "platform": platform,
            "app_version": appVersion,
        ])
        isConfigured = true
    }

    public static func track(_ event: String, properties: [String: Any] = [:]) {
        guard isConfigured else { return }
        PostHogSDK.shared.capture(event, properties: properties)
    }

    public static func identify(userId: String, traits: [String: Any]) {
        guard isConfigured else { return }
        PostHogSDK.shared.identify(userId, userProperties: traits)
    }

    public static func reset() {
        guard isConfigured else { return }
        PostHogSDK.shared.reset()
    }

    public static func captureException(_ error: Error, context: [String: Any] = [:]) {
        guard isConfigured else { return }

        var properties: [String: Any] = [
            "$exception_type": String(describing: type(of: error)),
            "$exception_message": error.localizedDescription,
        ]
        for (key, value) in context {
            properties[key] = value
        }

        PostHogSDK.shared.capture("$exception", properties: properties)
    }

    public static func log(level: LogLevel, message: String, context: [String: Any] = [:]) {
        guard isConfigured else { return }

        var properties: [String: Any] = [
            "level": level.rawValue,
            "message": message,
        ]
        for (key, value) in context {
            properties[key] = value
        }

        PostHogSDK.shared.capture("log_entry", properties: properties)
    }
}
