package com.plantgotchi.app

import android.app.Application
import com.plantgotchi.app.db.AppDatabase

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
    }

    companion object {
        lateinit var instance: PlantgotchiApp
            private set

        val db: AppDatabase
            get() = instance.database
    }
}
