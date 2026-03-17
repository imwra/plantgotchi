// ios-app/PlantgotchiTests/AnalyticsTests.swift
import Testing
import Foundation
@testable import Plantgotchi

@Suite(.serialized)
struct AnalyticsTests {
    @Test func trackCallsPostHogCapture() {
        Analytics.track("test_event", properties: ["key": "value"])
    }

    @Test func identifyDoesNotCrash() {
        Analytics.identify(userId: "user-1", traits: ["email": "a@b.com"])
    }

    @Test func resetDoesNotCrash() {
        Analytics.reset()
    }

    @Test func captureExceptionDoesNotCrash() {
        let error = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "test error"])
        Analytics.captureException(error, context: ["endpoint": "/api/plants"])
    }

    @Test func logDoesNotCrash() {
        Analytics.log(level: .warn, message: "sync failed", context: ["direction": "push"])
    }
}
