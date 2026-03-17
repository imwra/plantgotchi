package com.plantgotchi.app

import android.app.Application
import android.content.Context
import com.plantgotchi.app.auth.AuthInterceptor
import com.plantgotchi.app.auth.AuthService
import com.plantgotchi.app.auth.TokenManager
import com.plantgotchi.app.db.AppDatabase
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

class PlantgotchiApp : Application() {

    val database: AppDatabase by lazy { AppDatabase.create(this) }

    lateinit var tokenManager: TokenManager
        private set
    lateinit var authService: AuthService
        private set
    lateinit var authInterceptor: AuthInterceptor
        private set
    lateinit var httpClient: HttpClient
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initialize auth
        tokenManager = TokenManager.create(this)
        authInterceptor = AuthInterceptor(tokenManager)
        httpClient = HttpClient(OkHttp) {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
            authInterceptor.install(this)
        }
        authService = AuthService(
            baseURL = BuildConfig.API_BASE_URL,
            tokenManager = tokenManager,
            httpClient = httpClient,
        )

        // When AuthInterceptor sees a 401, propagate to AuthService so UI reacts
        CoroutineScope(Dispatchers.Main).launch {
            authInterceptor.signOutEvents.collect {
                authService.signOut()
            }
        }

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

        val userId = tokenManager.getUserId()
        if (tokenManager.getToken() != null && userId != null) {
            com.plantgotchi.app.analytics.Analytics.identify(userId, mapOf("platform" to "android"))
        }
    }

    private fun seedDemoDataIfNeeded() {
        val prefs = getSharedPreferences("plantgotchi_prefs", Context.MODE_PRIVATE)
        val demoSeeded = prefs.getBoolean("demo_seeded", false)
        if (!demoSeeded) {
            CoroutineScope(Dispatchers.IO).launch {
                val userId = tokenManager.getUserId() ?: "local-user"
                val plants = database.plantDao().getPlantsByUserOnce(userId)
                if (plants.isEmpty()) {
                    com.plantgotchi.app.ui.settings.DemoDataLoader.load(userId, database)
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
