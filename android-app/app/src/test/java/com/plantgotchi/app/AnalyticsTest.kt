// android-app/app/src/test/java/com/plantgotchi/app/AnalyticsTest.kt
package com.plantgotchi.app

import com.plantgotchi.app.analytics.Analytics
import com.plantgotchi.app.analytics.LogLevel
import org.junit.Test

class AnalyticsTest {
    @Test
    fun trackDoesNotCrash() {
        Analytics.track("test_event", mapOf("key" to "value"))
    }

    @Test
    fun identifyDoesNotCrash() {
        Analytics.identify("user-1", mapOf("email" to "a@b.com"))
    }

    @Test
    fun resetDoesNotCrash() {
        Analytics.reset()
    }

    @Test
    fun captureExceptionDoesNotCrash() {
        Analytics.captureException(RuntimeException("test"), mapOf("endpoint" to "/api/plants"))
    }

    @Test
    fun logDoesNotCrash() {
        Analytics.log(LogLevel.WARN, "sync failed", mapOf("direction" to "push"))
    }
}
