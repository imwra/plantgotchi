package com.plantgotchi.app

import android.app.Application
import com.plantgotchi.app.db.AppDatabase
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig

/**
 * Application class for Plantgotchi.
 * Initializes Room database and BLE manager as singletons.
 */
class PlantgotchiApp : Application() {

    /** Room database singleton — accessible from anywhere via `PlantgotchiApp.database`. */
    val database: AppDatabase by lazy {
        AppDatabase.create(this)
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initialize PostHog analytics
        val posthogApiKey = BuildConfig.POSTHOG_API_KEY
        if (posthogApiKey.isNotBlank()) {
            val config = PostHogAndroidConfig(
                apiKey = posthogApiKey,
                host = BuildConfig.POSTHOG_HOST,
            ).apply {
                captureScreenViews = true
                captureApplicationLifecycleEvents = true
                sessionReplay = true
            }
            PostHogAndroid.setup(this, config)
            PostHog.register(mapOf("platform" to "android", "app_version" to "1.0.0"))
        }
    }

    companion object {
        lateinit var instance: PlantgotchiApp
            private set

        val db: AppDatabase
            get() = instance.database
    }
}
