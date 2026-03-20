package com.plantgotchi.app.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.plantgotchi.app.model.Achievement
import com.plantgotchi.app.model.CareLog
import com.plantgotchi.app.model.Grow
import com.plantgotchi.app.model.GrowLog
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.Recommendation
import com.plantgotchi.app.model.SensorReading
import com.plantgotchi.app.model.StrainProfile

@Database(
    entities = [
        Plant::class,
        SensorReading::class,
        CareLog::class,
        Recommendation::class,
        Grow::class,
        GrowLog::class,
        StrainProfile::class,
        Achievement::class,
    ],
    version = 2,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun plantDao(): PlantDao
    abstract fun readingDao(): ReadingDao
    abstract fun careLogDao(): CareLogDao
    abstract fun recommendationDao(): RecommendationDao
    abstract fun growDao(): GrowDao
    abstract fun growLogDao(): GrowLogDao
    abstract fun strainProfileDao(): StrainProfileDao
    abstract fun achievementDao(): AchievementDao

    companion object {
        private const val DATABASE_NAME = "plantgotchi.db"

        @Volatile
        private var INSTANCE: AppDatabase? = null

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
                .addMigrations(MIGRATION_1_2)
                .build()
        }

        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                // Extend plants table
                db.execSQL("ALTER TABLE plants ADD COLUMN plant_type TEXT")
                db.execSQL("ALTER TABLE plants ADD COLUMN strain_id TEXT")
                db.execSQL("ALTER TABLE plants ADD COLUMN strain_name TEXT")
                db.execSQL("ALTER TABLE plants ADD COLUMN strain_type TEXT")
                db.execSQL("ALTER TABLE plants ADD COLUMN environment TEXT")
                db.execSQL("ALTER TABLE plants ADD COLUMN current_phase TEXT")
                db.execSQL("ALTER TABLE plants ADD COLUMN phase_started_at TEXT")
                db.execSQL("ALTER TABLE plants ADD COLUMN grow_id TEXT")

                // Create grows table
                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS grows (
                        id TEXT NOT NULL PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        environment TEXT,
                        start_date TEXT,
                        end_date TEXT,
                        notes TEXT,
                        status TEXT NOT NULL DEFAULT 'active',
                        created_at TEXT,
                        updated_at TEXT
                    )
                """)
                db.execSQL("CREATE INDEX IF NOT EXISTS index_grows_user_id_status ON grows(user_id, status)")

                // Create grow_logs table
                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS grow_logs (
                        id TEXT NOT NULL PRIMARY KEY,
                        plant_id TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        phase TEXT NOT NULL,
                        log_type TEXT NOT NULL,
                        data TEXT,
                        photo_url TEXT,
                        notes TEXT,
                        created_at TEXT,
                        FOREIGN KEY(plant_id) REFERENCES plants(id) ON DELETE CASCADE
                    )
                """)
                db.execSQL("CREATE INDEX IF NOT EXISTS index_grow_logs_plant_id_created_at ON grow_logs(plant_id, created_at)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_grow_logs_plant_id_phase_created_at ON grow_logs(plant_id, phase, created_at)")

                // Create strain_profiles table
                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS strain_profiles (
                        id TEXT NOT NULL PRIMARY KEY,
                        name TEXT NOT NULL,
                        type TEXT,
                        flower_weeks_min INTEGER,
                        flower_weeks_max INTEGER,
                        difficulty TEXT,
                        thresholds_by_phase TEXT,
                        notes TEXT,
                        is_custom INTEGER NOT NULL DEFAULT 0,
                        user_id TEXT,
                        created_at TEXT
                    )
                """)
                db.execSQL("CREATE INDEX IF NOT EXISTS index_strain_profiles_name ON strain_profiles(name)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_strain_profiles_user_id ON strain_profiles(user_id)")

                // Create achievements table
                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS achievements (
                        id TEXT NOT NULL PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        achievement_key TEXT NOT NULL,
                        points INTEGER NOT NULL DEFAULT 0,
                        unlocked_at TEXT,
                        metadata TEXT
                    )
                """)
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS index_achievements_user_id_achievement_key ON achievements(user_id, achievement_key)")
            }
        }
    }
}
