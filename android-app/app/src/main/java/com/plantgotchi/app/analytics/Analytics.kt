// android-app/app/src/main/java/com/plantgotchi/app/analytics/Analytics.kt
package com.plantgotchi.app.analytics

import com.posthog.PostHog

enum class LogLevel { INFO, WARN, ERROR }

object Analytics {
    fun track(event: String, properties: Map<String, Any> = emptyMap()) {
        try { PostHog.capture(event, properties = properties) } catch (_: Exception) {}
    }

    fun identify(userId: String, traits: Map<String, Any>) {
        try { PostHog.identify(userId, userProperties = traits) } catch (_: Exception) {}
    }

    fun reset() {
        try { PostHog.reset() } catch (_: Exception) {}
    }

    fun captureException(throwable: Throwable, context: Map<String, Any> = emptyMap()) {
        try {
            val props = mutableMapOf<String, Any>(
                "\$exception_type" to (throwable::class.simpleName ?: "Unknown"),
                "\$exception_message" to (throwable.message ?: ""),
                "\$exception_stack_trace_raw" to throwable.stackTraceToString(),
            )
            props.putAll(context)
            PostHog.capture("\$exception", properties = props)
        } catch (_: Exception) {}
    }

    fun log(level: LogLevel, message: String, context: Map<String, Any> = emptyMap()) {
        try {
            val props = mutableMapOf<String, Any>(
                "level" to level.name.lowercase(),
                "message" to message,
            )
            props.putAll(context)
            PostHog.capture("log_entry", properties = props)
        } catch (_: Exception) {}
    }
}
