// ios-app/Plantgotchi/Analytics/Analytics.swift
import Foundation
#if os(iOS)
import PostHog
#endif

enum LogLevel: String {
    case info, warn, error
}

enum Analytics {
    static func track(_ event: String, properties: [String: Any] = [:]) {
        #if os(iOS)
        PostHogSDK.shared.capture(event, properties: properties)
        #endif
    }

    static func identify(userId: String, traits: [String: Any]) {
        #if os(iOS)
        PostHogSDK.shared.identify(userId, userProperties: traits)
        #endif
    }

    static func reset() {
        #if os(iOS)
        PostHogSDK.shared.reset()
        #endif
    }

    static func captureException(_ error: Error, context: [String: Any] = [:]) {
        #if os(iOS)
        var props: [String: Any] = [
            "$exception_type": String(describing: type(of: error)),
            "$exception_message": error.localizedDescription,
        ]
        for (k, v) in context { props[k] = v }
        PostHogSDK.shared.capture("$exception", properties: props)
        #endif
    }

    static func log(level: LogLevel, message: String, context: [String: Any] = [:]) {
        #if os(iOS)
        var props: [String: Any] = [
            "level": level.rawValue,
            "message": message,
        ]
        for (k, v) in context { props[k] = v }
        PostHogSDK.shared.capture("log_entry", properties: props)
        #endif
    }
}
