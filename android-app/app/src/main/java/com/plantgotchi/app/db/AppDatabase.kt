package com.plantgotchi.app.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.plantgotchi.app.model.CareLog
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.Recommendation
import com.plantgotchi.app.model.SensorReading

/**
 * Room database for Plantgotchi.
 *
 * Schema mirrors the web app's SQLite schema exactly:
 * - plants
 * - sensor_readings
 * - care_logs
 * - recommendations
 */
@Database(
    entities = [
        Plant::class,
        SensorReading::class,
        CareLog::class,
        Recommendation::class,
    ],
    version = 1,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun plantDao(): PlantDao
    abstract fun readingDao(): ReadingDao
    abstract fun careLogDao(): CareLogDao
    abstract fun recommendationDao(): RecommendationDao

    companion object {
        private const val DATABASE_NAME = "plantgotchi.db"

        @Volatile
        private var INSTANCE: AppDatabase? = null

        /**
         * Creates or returns the singleton database instance.
         */
        fun create(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: buildDatabase(context).also { INSTANCE = it }
            }
        }

        private fun buildDatabase(context: Context): AppDatabase {
            return Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                DATABASE_NAME
            )
                .fallbackToDestructiveMigration()
                .build()
        }
    }
}
