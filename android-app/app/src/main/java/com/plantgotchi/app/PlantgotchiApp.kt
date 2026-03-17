package com.plantgotchi.app

import android.app.Application
import android.content.Context
import com.plantgotchi.app.db.AppDatabase
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

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

        // Seed demo data on first launch
        seedDemoDataIfNeeded()

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
            PostHog.register("platform", "android")
            PostHog.register("app_version", "1.0.0")
        }
    }

    private fun seedDemoDataIfNeeded() {
        val prefs = getSharedPreferences("plantgotchi_prefs", Context.MODE_PRIVATE)
        val demoSeeded = prefs.getBoolean("demo_seeded", false)
        if (!demoSeeded) {
            CoroutineScope(Dispatchers.IO).launch {
                val plants = database.plantDao().getPlantsByUserOnce("local-user")
                if (plants.isEmpty()) {
                    com.plantgotchi.app.ui.settings.DemoDataLoader.load("local-user", database)
                    prefs.edit().putBoolean("demo_seeded", true).apply()
                    prefs.edit().putBoolean("demo_mode_on", true).apply()
                }
            }
        }
    }

    companion object {
        lateinit var instance: PlantgotchiApp
            private set

        val db: AppDatabase
            get() = instance.database
    }
}
