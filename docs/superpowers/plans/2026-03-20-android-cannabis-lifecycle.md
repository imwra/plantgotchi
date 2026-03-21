# Android Cannabis Lifecycle — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the full cannabis lifecycle system (phases, grows, grow logs, strain profiles, achievements, phase-aware rule engine) to the Android app, matching the iOS reference and web/API contract.

**Architecture:** Add Phase enum and lifecycle types, extend the Plant Room entity with cannabis fields, add 4 new Room entities (Grow, GrowLog, StrainProfile, Achievement) with DAOs, create a Room migration from v1→v2, make the RuleEngine phase-aware, add an AchievementEngine, update the sync layer to handle lifecycle fields, and add new Compose screens (GrowView, PhaseTransitionSheet, GrowLogView, StrainPickerView, AchievementsView). All changes are backward-compatible — existing non-cannabis plants continue working unchanged.

**Tech Stack:** Kotlin, Jetpack Compose, Room (SQLite), JUnit, Ktor HTTP client

**Reference:** iOS at `ios-app/Plantgotchi/`, web API at `website-astro/src/`

---

## File Structure

### New files to create

| File | Responsibility |
|------|---------------|
| `model/Phase.kt` | Phase enum (8 phases), phase defaults, available actions, GrowLogType enum |
| `model/Grow.kt` | Grow Room entity |
| `model/GrowLog.kt` | GrowLog Room entity + GrowLogType enum reference |
| `model/StrainProfile.kt` | StrainProfile Room entity |
| `model/Achievement.kt` | Achievement Room entity + AchievementDef definitions |
| `db/GrowDao.kt` | Grow CRUD DAO |
| `db/GrowLogDao.kt` | GrowLog CRUD DAO |
| `db/StrainProfileDao.kt` | StrainProfile CRUD DAO |
| `db/AchievementDao.kt` | Achievement CRUD DAO |
| `agent/AchievementEngine.kt` | Achievement evaluation and unlock logic |
| `PhaseTest.kt` (test) | Phase enum, defaults, available actions tests |
| `PhaseAwareRuleEngineTest.kt` (test) | Phase-aware rule engine tests |

All source files are under `android-app/app/src/main/java/com/plantgotchi/app/`.
All test files are under `android-app/app/src/test/java/com/plantgotchi/app/`.

### Existing files to modify

| File | Changes |
|------|---------|
| `model/Plant.kt` | Add lifecycle fields (plantType, strainId, strainName, strainType, environment, currentPhase, phaseStartedAt, growId) |
| `db/AppDatabase.kt` | Add new entities, DAOs, bump version to 2, add migration |
| `agent/RuleEngine.kt` | Make phase-aware: resolve thresholds from phase, skip non-monitored phases, add transition suggestions |
| `sync/TursoSync.kt` | Parse lifecycle fields from API, add push/pull for grows and grow logs |
| `nav/AppNavigation.kt` | Add routes for GrowView and AchievementsView |
| `RuleEngineTest.kt` (test) | Update makePlant helper to include lifecycle fields with null defaults |

---

## Chunk 1: Models and Room Schema

### Task 1: Phase Enum and Lifecycle Types

**Files:**
- Create: `model/Phase.kt`
- Test: `PhaseTest.kt`

- [ ] **Step 1: Write failing tests**

Create `android-app/app/src/test/java/com/plantgotchi/app/PhaseTest.kt`:

```kotlin
package com.plantgotchi.app

import com.plantgotchi.app.model.Phase
import com.plantgotchi.app.model.GrowLogType
import org.junit.Assert.*
import org.junit.Test

class PhaseTest {

    @Test
    fun `phase order has 8 phases`() {
        assertEquals(8, Phase.entries.size)
    }

    @Test
    fun `nextPhase transitions correctly`() {
        assertEquals(Phase.SEEDLING, Phase.GERMINATION.nextPhase)
        assertEquals(Phase.DRYING, Phase.FLOWERING.nextPhase)
        assertNull(Phase.COMPLETE.nextPhase)
    }

    @Test
    fun `isGrowing true only for veg and flower`() {
        assertTrue(Phase.VEGETATIVE.isGrowing)
        assertTrue(Phase.FLOWERING.isGrowing)
        assertFalse(Phase.DRYING.isGrowing)
        assertFalse(Phase.COMPLETE.isGrowing)
        assertFalse(Phase.GERMINATION.isGrowing)
    }

    @Test
    fun `hasMonitoring false only for complete`() {
        assertTrue(Phase.GERMINATION.hasMonitoring)
        assertTrue(Phase.DRYING.hasMonitoring)
        assertFalse(Phase.COMPLETE.hasMonitoring)
    }

    @Test
    fun `phase defaults exist for all monitored phases`() {
        Phase.entries.filter { it.hasMonitoring }.forEach { phase ->
            val defaults = phase.defaults
            assertNotNull("${phase.name} should have defaults", defaults)
            assertTrue(defaults!!.tempMin < defaults.tempMax)
        }
    }

    @Test
    fun `complete phase has no defaults`() {
        assertNull(Phase.COMPLETE.defaults)
    }

    @Test
    fun `vegetative allows training actions`() {
        val actions = Phase.VEGETATIVE.availableActions
        assertTrue(actions.contains(GrowLogType.TOPPING))
        assertTrue(actions.contains(GrowLogType.LST))
        assertTrue(actions.contains(GrowLogType.DEFOLIATION))
        assertFalse(actions.contains(GrowLogType.HARVEST))
        assertFalse(actions.contains(GrowLogType.DRY_CHECK))
    }

    @Test
    fun `flowering allows harvest`() {
        val actions = Phase.FLOWERING.availableActions
        assertTrue(actions.contains(GrowLogType.HARVEST))
        assertTrue(actions.contains(GrowLogType.TRICHOME_CHECK))
        assertTrue(actions.contains(GrowLogType.WATERING))
    }

    @Test
    fun `drying restricts to post-harvest actions`() {
        val actions = Phase.DRYING.availableActions
        assertTrue(actions.contains(GrowLogType.DRY_CHECK))
        assertTrue(actions.contains(GrowLogType.NOTE))
        assertFalse(actions.contains(GrowLogType.WATERING))
        assertFalse(actions.contains(GrowLogType.TOPPING))
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd android-app && ./gradlew test --tests "com.plantgotchi.app.PhaseTest" --info 2>&1 | tail -20`
Expected: Compilation error — Phase class not found

- [ ] **Step 3: Implement Phase.kt**

Create `android-app/app/src/main/java/com/plantgotchi/app/model/Phase.kt`:

```kotlin
package com.plantgotchi.app.model

/**
 * Cannabis growth phase lifecycle.
 * Mirrors the web/iOS Phase enum exactly.
 */
enum class Phase(val value: String) {
    GERMINATION("germination"),
    SEEDLING("seedling"),
    VEGETATIVE("vegetative"),
    FLOWERING("flowering"),
    DRYING("drying"),
    CURING("curing"),
    PROCESSING("processing"),
    COMPLETE("complete");

    val nextPhase: Phase?
        get() {
            val idx = entries.indexOf(this)
            return if (idx < entries.size - 1) entries[idx + 1] else null
        }

    val isGrowing: Boolean
        get() = this == VEGETATIVE || this == FLOWERING

    val hasMonitoring: Boolean
        get() = this != COMPLETE

    val defaults: PhaseDefaults?
        get() = PHASE_DEFAULTS[this]

    val availableActions: List<GrowLogType>
        get() = PHASE_ACTIONS[this] ?: emptyList()

    companion object {
        fun fromValue(value: String?): Phase? =
            entries.find { it.value == value }
    }
}

data class PhaseDefaults(
    val tempMin: Double,
    val tempMax: Double,
    val humidityMin: Int,
    val humidityMax: Int,
    val lightSchedule: String,
)

val LATE_FLOWER_HUMIDITY_MIN = 30
val LATE_FLOWER_HUMIDITY_MAX = 40

private val PHASE_DEFAULTS = mapOf(
    Phase.GERMINATION to PhaseDefaults(22.0, 28.0, 70, 90, "18/6"),
    Phase.SEEDLING    to PhaseDefaults(20.0, 26.0, 60, 70, "18/6"),
    Phase.VEGETATIVE  to PhaseDefaults(20.0, 28.0, 40, 60, "18/6"),
    Phase.FLOWERING   to PhaseDefaults(18.0, 26.0, 40, 50, "12/12"),
    Phase.DRYING      to PhaseDefaults(18.0, 22.0, 55, 65, "0/24"),
    Phase.CURING      to PhaseDefaults(18.0, 22.0, 58, 65, "0/24"),
    Phase.PROCESSING  to PhaseDefaults(18.0, 24.0, 40, 60, "0/24"),
)

/**
 * Grow log entry types (21 total).
 * Mirrors the web GrowLogType exactly.
 */
enum class GrowLogType(val value: String, val label: String) {
    PHASE_CHANGE("phaseChange", "Phase Change"),
    WATERING("watering", "Watering"),
    FEEDING("feeding", "Feeding"),
    TOPPING("topping", "Topping"),
    FIMMING("fimming", "FIMming"),
    LST("lst", "Low Stress Training"),
    DEFOLIATION("defoliation", "Defoliation"),
    TRANSPLANT("transplant", "Transplant"),
    FLUSHING("flushing", "Flushing"),
    TRICHOME_CHECK("trichomeCheck", "Trichome Check"),
    MEASUREMENT("measurement", "Measurement"),
    ENVIRONMENTAL("environmental", "Environmental"),
    PHOTO("photo", "Photo"),
    NOTE("note", "Note"),
    HARVEST("harvest", "Harvest"),
    DRY_WEIGHT("dryWeight", "Dry Weight"),
    DRY_CHECK("dryCheck", "Dry Check"),
    CURE_CHECK("cureCheck", "Cure Check"),
    PROCESSING_LOG("processingLog", "Processing"),
    PEST_TREATMENT("pestTreatment", "Pest Treatment"),
    CLONING("cloning", "Cloning");

    companion object {
        fun fromValue(value: String?): GrowLogType? =
            entries.find { it.value == value }
    }
}

private val PHASE_ACTIONS = mapOf(
    Phase.GERMINATION to listOf(GrowLogType.WATERING, GrowLogType.ENVIRONMENTAL, GrowLogType.MEASUREMENT, GrowLogType.PHOTO, GrowLogType.NOTE),
    Phase.SEEDLING to listOf(GrowLogType.WATERING, GrowLogType.FEEDING, GrowLogType.TRANSPLANT, GrowLogType.ENVIRONMENTAL, GrowLogType.MEASUREMENT, GrowLogType.PHOTO, GrowLogType.NOTE, GrowLogType.PEST_TREATMENT),
    Phase.VEGETATIVE to listOf(GrowLogType.WATERING, GrowLogType.FEEDING, GrowLogType.TOPPING, GrowLogType.FIMMING, GrowLogType.LST, GrowLogType.DEFOLIATION, GrowLogType.TRANSPLANT, GrowLogType.CLONING, GrowLogType.ENVIRONMENTAL, GrowLogType.MEASUREMENT, GrowLogType.PHOTO, GrowLogType.NOTE, GrowLogType.PEST_TREATMENT),
    Phase.FLOWERING to listOf(GrowLogType.WATERING, GrowLogType.FEEDING, GrowLogType.LST, GrowLogType.DEFOLIATION, GrowLogType.FLUSHING, GrowLogType.TRICHOME_CHECK, GrowLogType.ENVIRONMENTAL, GrowLogType.MEASUREMENT, GrowLogType.PHOTO, GrowLogType.NOTE, GrowLogType.PEST_TREATMENT, GrowLogType.HARVEST),
    Phase.DRYING to listOf(GrowLogType.DRY_CHECK, GrowLogType.ENVIRONMENTAL, GrowLogType.PHOTO, GrowLogType.NOTE),
    Phase.CURING to listOf(GrowLogType.CURE_CHECK, GrowLogType.ENVIRONMENTAL, GrowLogType.PHOTO, GrowLogType.NOTE),
    Phase.PROCESSING to listOf(GrowLogType.PROCESSING_LOG, GrowLogType.DRY_WEIGHT, GrowLogType.PHOTO, GrowLogType.NOTE),
    Phase.COMPLETE to listOf(GrowLogType.PHOTO, GrowLogType.NOTE),
)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd android-app && ./gradlew test --tests "com.plantgotchi.app.PhaseTest" --info 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/model/Phase.kt android-app/app/src/test/java/com/plantgotchi/app/PhaseTest.kt
git commit -m "feat(android): add Phase enum, GrowLogType, and phase defaults"
```

---

### Task 2: Extend Plant Model

**Files:**
- Modify: `model/Plant.kt`

- [ ] **Step 1: Add lifecycle fields to Plant entity**

Add these fields to the `Plant` data class (after `lightPreference`, before `createdAt`):

```kotlin
    @ColumnInfo(name = "plant_type")
    val plantType: String? = null,

    @ColumnInfo(name = "strain_id")
    val strainId: String? = null,

    @ColumnInfo(name = "strain_name")
    val strainName: String? = null,

    @ColumnInfo(name = "strain_type")
    val strainType: String? = null,

    val environment: String? = null,

    @ColumnInfo(name = "current_phase")
    val currentPhase: String? = null,

    @ColumnInfo(name = "phase_started_at")
    val phaseStartedAt: String? = null,

    @ColumnInfo(name = "grow_id")
    val growId: String? = null,
```

- [ ] **Step 2: Update RuleEngineTest makePlant helper**

In `RuleEngineTest.kt`, the existing `makePlant()` helper does not include lifecycle fields. Since they have defaults (`null`), the existing tests will compile without changes. No modification needed.

- [ ] **Step 3: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/model/Plant.kt
git commit -m "feat(android): extend Plant entity with cannabis lifecycle fields"
```

---

### Task 3: New Room Entities (Grow, GrowLog, StrainProfile, Achievement)

**Files:**
- Create: `model/Grow.kt`
- Create: `model/GrowLog.kt`
- Create: `model/StrainProfile.kt`
- Create: `model/Achievement.kt`

- [ ] **Step 1: Create Grow entity**

Create `model/Grow.kt`:

```kotlin
package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "grows",
    indices = [Index(value = ["user_id", "status"])]
)
data class Grow(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    val name: String,

    val environment: String? = null,

    @ColumnInfo(name = "start_date")
    val startDate: String? = null,

    @ColumnInfo(name = "end_date")
    val endDate: String? = null,

    val notes: String? = null,

    val status: String = "active",

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,

    @ColumnInfo(name = "updated_at")
    val updatedAt: String? = null,
)
```

- [ ] **Step 2: Create GrowLog entity**

Create `model/GrowLog.kt`:

```kotlin
package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "grow_logs",
    foreignKeys = [
        ForeignKey(
            entity = Plant::class,
            parentColumns = ["id"],
            childColumns = ["plant_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["plant_id", "created_at"]),
        Index(value = ["plant_id", "phase", "created_at"])
    ]
)
data class GrowLog(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "plant_id")
    val plantId: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    val phase: String,

    @ColumnInfo(name = "log_type")
    val logType: String,

    val data: String? = null, // JSON string

    @ColumnInfo(name = "photo_url")
    val photoUrl: String? = null,

    val notes: String? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,
)
```

- [ ] **Step 3: Create StrainProfile entity**

Create `model/StrainProfile.kt`:

```kotlin
package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "strain_profiles",
    indices = [
        Index(value = ["name"]),
        Index(value = ["user_id"])
    ]
)
data class StrainProfile(
    @PrimaryKey
    val id: String,

    val name: String,

    val type: String? = null, // indica, sativa, hybrid

    @ColumnInfo(name = "flower_weeks_min")
    val flowerWeeksMin: Int? = null,

    @ColumnInfo(name = "flower_weeks_max")
    val flowerWeeksMax: Int? = null,

    val difficulty: String? = null,

    @ColumnInfo(name = "thresholds_by_phase")
    val thresholdsByPhase: String? = null, // JSON string

    val notes: String? = null,

    @ColumnInfo(name = "is_custom")
    val isCustom: Boolean = false,

    @ColumnInfo(name = "user_id")
    val userId: String? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,
)
```

- [ ] **Step 4: Create Achievement entity**

Create `model/Achievement.kt`:

```kotlin
package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "achievements",
    indices = [Index(value = ["user_id", "achievement_key"], unique = true)]
)
data class Achievement(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    @ColumnInfo(name = "achievement_key")
    val achievementKey: String,

    val points: Int = 0,

    @ColumnInfo(name = "unlocked_at")
    val unlockedAt: String? = null,

    val metadata: String? = null, // JSON string
)

data class AchievementDef(
    val key: String,
    val name: String,
    val points: Int,
    val description: String,
)

val ACHIEVEMENT_DEFS = listOf(
    AchievementDef("firstSeed", "First Seed", 10, "Start your first grow"),
    AchievementDef("firstHarvest", "First Harvest", 50, "Harvest your first plant"),
    AchievementDef("tenPlants", "Ten Plants", 30, "Grow 10 plants"),
    AchievementDef("firstTop", "First Top", 20, "Top a plant for the first time"),
    AchievementDef("firstLST", "First LST", 20, "Apply LST for the first time"),
    AchievementDef("speedGrow", "Speed Grow", 100, "Complete a grow in under 70 days"),
    AchievementDef("firstGram", "First Gram", 25, "Record a dry weight of at least 1g"),
    AchievementDef("bigYield100g", "Big Yield (100g)", 75, "Yield 100g from a single plant"),
    AchievementDef("weekStreak", "Week Streak", 15, "Log activity 7 consecutive days"),
    AchievementDef("fiveStrains", "Five Strains", 40, "Grow 5 different strains"),
)
```

- [ ] **Step 5: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/model/Grow.kt android-app/app/src/main/java/com/plantgotchi/app/model/GrowLog.kt android-app/app/src/main/java/com/plantgotchi/app/model/StrainProfile.kt android-app/app/src/main/java/com/plantgotchi/app/model/Achievement.kt
git commit -m "feat(android): add Grow, GrowLog, StrainProfile, Achievement Room entities"
```

---

### Task 4: New DAOs

**Files:**
- Create: `db/GrowDao.kt`
- Create: `db/GrowLogDao.kt`
- Create: `db/StrainProfileDao.kt`
- Create: `db/AchievementDao.kt`

- [ ] **Step 1: Create GrowDao**

Create `db/GrowDao.kt`:

```kotlin
package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.plantgotchi.app.model.Grow
import kotlinx.coroutines.flow.Flow

@Dao
interface GrowDao {

    @Query("SELECT * FROM grows WHERE user_id = :userId ORDER BY created_at DESC")
    fun observeGrows(userId: String): Flow<List<Grow>>

    @Query("SELECT * FROM grows WHERE user_id = :userId AND status = 'active' ORDER BY created_at DESC")
    suspend fun getActiveGrows(userId: String): List<Grow>

    @Query("SELECT * FROM grows WHERE id = :id")
    suspend fun getGrowById(id: String): Grow?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(grow: Grow)

    @Query("UPDATE grows SET status = :status, updated_at = :updatedAt WHERE id = :id")
    suspend fun updateStatus(id: String, status: String, updatedAt: String)
}
```

- [ ] **Step 2: Create GrowLogDao**

Create `db/GrowLogDao.kt`:

```kotlin
package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.plantgotchi.app.model.GrowLog
import kotlinx.coroutines.flow.Flow

@Dao
interface GrowLogDao {

    @Query("SELECT * FROM grow_logs WHERE plant_id = :plantId ORDER BY created_at DESC LIMIT :limit")
    fun observeGrowLogs(plantId: String, limit: Int = 50): Flow<List<GrowLog>>

    @Query("SELECT * FROM grow_logs WHERE plant_id = :plantId ORDER BY created_at DESC LIMIT :limit")
    suspend fun getGrowLogs(plantId: String, limit: Int = 50): List<GrowLog>

    @Query("SELECT * FROM grow_logs WHERE plant_id = :plantId AND phase = :phase ORDER BY created_at DESC")
    suspend fun getGrowLogsByPhase(plantId: String, phase: String): List<GrowLog>

    @Query("SELECT * FROM grow_logs WHERE plant_id = :plantId AND log_type = :logType ORDER BY created_at DESC")
    suspend fun getGrowLogsByType(plantId: String, logType: String): List<GrowLog>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(log: GrowLog)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(logs: List<GrowLog>)
}
```

- [ ] **Step 3: Create StrainProfileDao**

Create `db/StrainProfileDao.kt`:

```kotlin
package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.plantgotchi.app.model.StrainProfile

@Dao
interface StrainProfileDao {

    @Query("SELECT * FROM strain_profiles WHERE is_custom = 0 OR user_id = :userId ORDER BY name")
    suspend fun getStrainProfiles(userId: String): List<StrainProfile>

    @Query("SELECT * FROM strain_profiles WHERE is_custom = 0 ORDER BY name")
    suspend fun getBuiltInStrains(): List<StrainProfile>

    @Query("SELECT * FROM strain_profiles WHERE id = :id")
    suspend fun getStrainById(id: String): StrainProfile?

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(strain: StrainProfile)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(strains: List<StrainProfile>)
}
```

- [ ] **Step 4: Create AchievementDao**

Create `db/AchievementDao.kt`:

```kotlin
package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.plantgotchi.app.model.Achievement
import kotlinx.coroutines.flow.Flow

@Dao
interface AchievementDao {

    @Query("SELECT * FROM achievements WHERE user_id = :userId ORDER BY unlocked_at DESC")
    fun observeAchievements(userId: String): Flow<List<Achievement>>

    @Query("SELECT * FROM achievements WHERE user_id = :userId ORDER BY unlocked_at DESC")
    suspend fun getAchievements(userId: String): List<Achievement>

    @Query("SELECT EXISTS(SELECT 1 FROM achievements WHERE user_id = :userId AND achievement_key = :key)")
    suspend fun hasAchievement(userId: String, key: String): Boolean

    @Query("SELECT COALESCE(SUM(points), 0) FROM achievements WHERE user_id = :userId")
    suspend fun getTotalPoints(userId: String): Int

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(achievement: Achievement)
}
```

- [ ] **Step 5: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/db/GrowDao.kt android-app/app/src/main/java/com/plantgotchi/app/db/GrowLogDao.kt android-app/app/src/main/java/com/plantgotchi/app/db/StrainProfileDao.kt android-app/app/src/main/java/com/plantgotchi/app/db/AchievementDao.kt
git commit -m "feat(android): add DAOs for Grow, GrowLog, StrainProfile, Achievement"
```

---

### Task 5: Update AppDatabase — Version 2 Migration

**Files:**
- Modify: `db/AppDatabase.kt`

- [ ] **Step 1: Update AppDatabase**

Changes needed:
1. Add new entities to the `@Database` annotation
2. Bump version to 2
3. Add abstract DAO methods for the 4 new DAOs
4. Replace `fallbackToDestructiveMigration()` with a proper `addMigrations(MIGRATION_1_2)` migration
5. Define `MIGRATION_1_2` with ALTER TABLE and CREATE TABLE statements

```kotlin
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
```

Add import: `import androidx.room.migration.Migration` and `import androidx.sqlite.db.SupportSQLiteDatabase`

- [ ] **Step 2: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/db/AppDatabase.kt
git commit -m "feat(android): update AppDatabase to v2 with lifecycle migration"
```

---

## Chunk 2: Rule Engine and Achievement Engine

### Task 6: Phase-Aware Rule Engine

**Files:**
- Modify: `agent/RuleEngine.kt`
- Test: `PhaseAwareRuleEngineTest.kt`

- [ ] **Step 1: Write failing tests**

Create `android-app/app/src/test/java/com/plantgotchi/app/PhaseAwareRuleEngineTest.kt`:

```kotlin
package com.plantgotchi.app

import com.plantgotchi.app.agent.RuleEngine
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.SensorReading
import org.junit.Assert.*
import org.junit.Test

class PhaseAwareRuleEngineTest {

    private fun makePlant(
        currentPhase: String? = null,
        phaseStartedAt: String? = null,
        moistureMin: Int = 30,
        moistureMax: Int = 80,
        tempMin: Double = 15.0,
        tempMax: Double = 30.0,
        lightPreference: String = "medium",
    ) = Plant(
        id = "test-plant",
        userId = "test-user",
        name = "Test Plant",
        moistureMin = moistureMin,
        moistureMax = moistureMax,
        tempMin = tempMin,
        tempMax = tempMax,
        lightPreference = lightPreference,
        currentPhase = currentPhase,
        phaseStartedAt = phaseStartedAt,
    )

    private fun makeReading(
        moisture: Int? = null,
        temperature: Double? = null,
        light: Int? = null,
        battery: Int? = null,
    ) = SensorReading(
        plantId = "test-plant",
        sensorId = "sensor-1",
        moisture = moisture,
        temperature = temperature,
        light = light,
        battery = battery,
    )

    @Test
    fun `resolveThresholds uses plant-level when no phase`() {
        val plant = makePlant()
        val t = RuleEngine.resolveThresholds(plant)
        assertEquals(15.0, t.tempMin, 0.01)
        assertEquals(30.0, t.tempMax, 0.01)
    }

    @Test
    fun `resolveThresholds uses phase defaults for flowering`() {
        val plant = makePlant(currentPhase = "flowering")
        val t = RuleEngine.resolveThresholds(plant)
        assertEquals(18.0, t.tempMin, 0.01)
        assertEquals(26.0, t.tempMax, 0.01)
    }

    @Test
    fun `resolveThresholds always uses plant moisture`() {
        val plant = makePlant(currentPhase = "vegetative", moistureMin = 40, moistureMax = 70)
        val t = RuleEngine.resolveThresholds(plant)
        assertEquals(40, t.moistureMin)
        assertEquals(70, t.moistureMax)
    }

    @Test
    fun `evaluatePlant skips complete phase`() {
        val plant = makePlant(currentPhase = "complete")
        val reading = makeReading(moisture = 5, temperature = 50.0)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertTrue(recs.isEmpty())
    }

    @Test
    fun `evaluatePlant uses phase thresholds for flowering`() {
        val plant = makePlant(currentPhase = "flowering")
        // Flowering max is 26, so 28 triggers warning
        val reading = makeReading(temperature = 28.0)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertTrue(recs.any { it.message.contains("Too hot") })
    }

    @Test
    fun `evaluatePlant backward compat no phase`() {
        val plant = makePlant(tempMax = 30.0)
        val reading = makeReading(temperature = 32.0)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertTrue(recs.any { it.message.contains("Too hot") })
    }

    @Test
    fun `getTransitionSuggestions veg 43 days`() {
        val fortyThreeDaysAgo = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }.format(java.util.Date(System.currentTimeMillis() - 43L * 86400000))
        val plant = makePlant(currentPhase = "vegetative", phaseStartedAt = fortyThreeDaysAgo)
        val suggestions = RuleEngine.getTransitionSuggestions(plant)
        assertTrue(suggestions.isNotEmpty())
        assertTrue(suggestions[0].message.contains("flower", ignoreCase = true))
    }

    @Test
    fun `getTransitionSuggestions empty when no phase`() {
        val plant = makePlant()
        val suggestions = RuleEngine.getTransitionSuggestions(plant)
        assertTrue(suggestions.isEmpty())
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd android-app && ./gradlew test --tests "com.plantgotchi.app.PhaseAwareRuleEngineTest" --info 2>&1 | tail -20`
Expected: FAIL — `resolveThresholds` and `getTransitionSuggestions` not defined

- [ ] **Step 3: Update RuleEngine.kt**

Add these members to the `RuleEngine` object:

```kotlin
    data class ResolvedThresholds(
        val tempMin: Double,
        val tempMax: Double,
        val moistureMin: Int,
        val moistureMax: Int,
    )

    fun resolveThresholds(plant: Plant): ResolvedThresholds {
        val phase = Phase.fromValue(plant.currentPhase)

        // Always use plant-level moisture
        val moistureMin = plant.moistureMin
        val moistureMax = plant.moistureMax

        // Use phase defaults for temp when phase is set
        if (phase != null && phase != Phase.COMPLETE) {
            val defaults = phase.defaults
            if (defaults != null) {
                return ResolvedThresholds(
                    tempMin = defaults.tempMin,
                    tempMax = defaults.tempMax,
                    moistureMin = moistureMin,
                    moistureMax = moistureMax,
                )
            }
        }

        return ResolvedThresholds(
            tempMin = plant.tempMin,
            tempMax = plant.tempMax,
            moistureMin = moistureMin,
            moistureMax = moistureMax,
        )
    }

    fun getTransitionSuggestions(plant: Plant): List<Recommendation> {
        val phase = Phase.fromValue(plant.currentPhase) ?: return emptyList()
        val startedAt = plant.phaseStartedAt ?: return emptyList()

        val daysInPhase = try {
            val start = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").apply {
                timeZone = java.util.TimeZone.getTimeZone("UTC")
            }.parse(startedAt)?.time ?: return emptyList()
            ((System.currentTimeMillis() - start) / 86400000).toInt()
        } catch (_: Exception) {
            return emptyList()
        }

        val recs = mutableListOf<Recommendation>()

        if (phase == Phase.VEGETATIVE && daysInPhase >= 42) {
            recs.add(Recommendation(
                id = UUID.randomUUID().toString(),
                plantId = plant.id,
                source = "rules",
                message = "${plant.name} has been in vegetative for $daysInPhase days — consider switching to flower (12/12 light cycle)",
                severity = "info",
            ))
        }

        if (phase == Phase.DRYING && daysInPhase >= 7) {
            recs.add(Recommendation(
                id = UUID.randomUUID().toString(),
                plantId = plant.id,
                source = "rules",
                message = "${plant.name} has been drying for $daysInPhase days — check the stem snap test to see if it's ready for curing",
                severity = "info",
            ))
        }

        return recs
    }
```

Update `evaluatePlant` to:
1. Check if phase is non-monitored → return empty
2. Use `resolveThresholds(plant)` for threshold values
3. Low light check: only in growing phases or no phase
4. Append `getTransitionSuggestions(plant)` to results

Add import: `import com.plantgotchi.app.model.Phase`

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd android-app && ./gradlew test --tests "com.plantgotchi.app.PhaseAwareRuleEngineTest" --info 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 5: Run existing RuleEngine tests**

Run: `cd android-app && ./gradlew test --tests "com.plantgotchi.app.RuleEngineTest" --info 2>&1 | tail -20`
Expected: ALL PASS — backward compatibility preserved

- [ ] **Step 6: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/agent/RuleEngine.kt android-app/app/src/test/java/com/plantgotchi/app/PhaseAwareRuleEngineTest.kt
git commit -m "feat(android): make RuleEngine phase-aware with threshold resolution"
```

---

### Task 7: Achievement Engine

**Files:**
- Create: `agent/AchievementEngine.kt`

- [ ] **Step 1: Create AchievementEngine**

Create `android-app/app/src/main/java/com/plantgotchi/app/agent/AchievementEngine.kt`:

```kotlin
package com.plantgotchi.app.agent

import com.plantgotchi.app.db.AchievementDao
import com.plantgotchi.app.db.PlantDao
import com.plantgotchi.app.model.Achievement
import com.plantgotchi.app.model.ACHIEVEMENT_DEFS
import com.plantgotchi.app.model.Phase
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID

private val HARVEST_PHASES = setOf(
    Phase.DRYING.value,
    Phase.CURING.value,
    Phase.PROCESSING.value,
    Phase.COMPLETE.value,
)

object AchievementEngine {

    suspend fun checkAndUnlock(
        userId: String,
        plantDao: PlantDao,
        achievementDao: AchievementDao,
    ): List<String> {
        val plants = plantDao.getPlantsByUserOnce(userId)
        val unlocked = mutableListOf<String>()

        // firstSeed: user has at least 1 plant with a phase set
        if (plants.any { it.currentPhase != null }) {
            if (tryUnlock(userId, "firstSeed", achievementDao)) unlocked.add("firstSeed")
        }

        // firstHarvest: user has a plant in a post-flowering phase
        if (plants.any { it.currentPhase != null && it.currentPhase in HARVEST_PHASES }) {
            if (tryUnlock(userId, "firstHarvest", achievementDao)) unlocked.add("firstHarvest")
        }

        // tenPlants: user has 10+ plants
        if (plants.size >= 10) {
            if (tryUnlock(userId, "tenPlants", achievementDao)) unlocked.add("tenPlants")
        }

        return unlocked
    }

    private suspend fun tryUnlock(
        userId: String,
        key: String,
        achievementDao: AchievementDao,
    ): Boolean {
        if (achievementDao.hasAchievement(userId, key)) return false

        val def = ACHIEVEMENT_DEFS.find { it.key == key } ?: return false
        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date())

        achievementDao.insert(
            Achievement(
                id = UUID.randomUUID().toString(),
                userId = userId,
                achievementKey = key,
                points = def.points,
                unlockedAt = now,
            )
        )
        return true
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/agent/AchievementEngine.kt
git commit -m "feat(android): add AchievementEngine with firstSeed, firstHarvest, tenPlants"
```

---

## Chunk 3: Sync Layer Update

### Task 8: Update TursoSync for Lifecycle Fields

**Files:**
- Modify: `sync/TursoSync.kt`

- [ ] **Step 1: Update parsePlant to include lifecycle fields**

In `TursoSync.kt`, update the `parsePlant` function to extract the new fields from the API response. The web API now returns these fields in the plant object:

```kotlin
    private fun parsePlant(obj: JsonObject): Plant? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val userId = obj["user_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val name = obj["name"]?.jsonPrimitive?.contentOrNull ?: return null

        return Plant(
            id = id,
            userId = userId,
            name = name,
            species = obj["species"]?.jsonPrimitive?.contentOrNull,
            emoji = obj["emoji"]?.jsonPrimitive?.contentOrNull ?: "\uD83C\uDF31",
            photoUrl = obj["photo_url"]?.jsonPrimitive?.contentOrNull,
            moistureMin = obj["moisture_min"]?.jsonPrimitive?.intOrNull ?: 30,
            moistureMax = obj["moisture_max"]?.jsonPrimitive?.intOrNull ?: 80,
            tempMin = obj["temp_min"]?.jsonPrimitive?.doubleOrNull ?: 15.0,
            tempMax = obj["temp_max"]?.jsonPrimitive?.doubleOrNull ?: 30.0,
            lightPreference = obj["light_preference"]?.jsonPrimitive?.contentOrNull ?: "medium",
            // Lifecycle fields
            plantType = obj["plant_type"]?.jsonPrimitive?.contentOrNull,
            strainId = obj["strain_id"]?.jsonPrimitive?.contentOrNull,
            strainName = obj["strain_name"]?.jsonPrimitive?.contentOrNull,
            strainType = obj["strain_type"]?.jsonPrimitive?.contentOrNull,
            environment = obj["environment"]?.jsonPrimitive?.contentOrNull,
            currentPhase = obj["current_phase"]?.jsonPrimitive?.contentOrNull,
            phaseStartedAt = obj["phase_started_at"]?.jsonPrimitive?.contentOrNull,
            growId = obj["grow_id"]?.jsonPrimitive?.contentOrNull,
        )
    }
```

- [ ] **Step 2: Add pullGrowLogs and pushGrowLogs methods**

Add sync methods for grow logs:

```kotlin
    suspend fun pullGrowLogs(plantId: String): List<GrowLog> {
        try {
            val response = httpClient.get("$baseURL/api/grow-logs") {
                parameter("plantId", plantId)
            }
            if (response.status != HttpStatusCode.OK) return emptyList()

            val body = response.bodyAsText()
            val arr = json.parseToJsonElement(body).jsonArray
            return arr.mapNotNull { parseGrowLog(it.jsonObject) }
        } catch (e: Exception) {
            Analytics.captureException(e, mapOf("operation" to "pullGrowLogs"))
            return emptyList()
        }
    }

    suspend fun pushGrowLog(log: GrowLog) {
        try {
            val response = httpClient.post("$baseURL/api/grow-logs") {
                contentType(ContentType.Application.Json)
                setBody(buildJsonObject {
                    put("plant_id", log.plantId)
                    put("phase", log.phase)
                    put("log_type", log.logType)
                    log.data?.let { put("data", json.parseToJsonElement(it)) }
                    log.photoUrl?.let { put("photo_url", it) }
                    log.notes?.let { put("notes", it) }
                }.toString())
            }
            if (response.status != HttpStatusCode.OK && response.status != HttpStatusCode.Created) {
                throw TursoSyncException("Push grow log failed: HTTP ${response.status.value}")
            }
        } catch (e: Exception) {
            Analytics.captureException(e, mapOf("operation" to "pushGrowLog"))
            throw e
        }
    }

    private fun parseGrowLog(obj: JsonObject): GrowLog? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val plantId = obj["plant_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val userId = obj["user_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val phase = obj["phase"]?.jsonPrimitive?.contentOrNull ?: return null
        val logType = obj["log_type"]?.jsonPrimitive?.contentOrNull ?: return null

        return GrowLog(
            id = id,
            plantId = plantId,
            userId = userId,
            phase = phase,
            logType = logType,
            data = obj["data"]?.toString(),
            photoUrl = obj["photo_url"]?.jsonPrimitive?.contentOrNull,
            notes = obj["notes"]?.jsonPrimitive?.contentOrNull,
            createdAt = obj["created_at"]?.jsonPrimitive?.contentOrNull,
        )
    }
```

Add import: `import com.plantgotchi.app.model.GrowLog`

- [ ] **Step 3: Commit**

```bash
git add android-app/app/src/main/java/com/plantgotchi/app/sync/TursoSync.kt
git commit -m "feat(android): update TursoSync for lifecycle fields and grow log sync"
```

---

## Chunk 4: Existing Test Compatibility

### Task 9: Verify All Existing Tests Pass

- [ ] **Step 1: Run full test suite**

Run: `cd android-app && ./gradlew test --info 2>&1 | tail -30`
Expected: ALL PASS — existing RuleEngineTest should still pass since makePlant() doesn't need lifecycle fields (they have defaults). The new PhaseAwareRuleEngineTest should also pass.

- [ ] **Step 2: Fix any compilation or test failures**

If existing tests fail because `Plant` constructor changed, update the test helpers to include lifecycle fields with `null` defaults. This should not be necessary since all new fields have default values.

- [ ] **Step 3: Commit if fixes needed**

```bash
git add -A
git commit -m "fix(android): update test fixtures for extended Plant model"
```

---

## Summary

| Task | What it adds | Files |
|------|-------------|-------|
| 1 | Phase enum (8 phases), GrowLogType (21 types), phase defaults | Phase.kt |
| 2 | Cannabis lifecycle fields on Plant entity | Plant.kt |
| 3 | 4 new Room entities (Grow, GrowLog, StrainProfile, Achievement) | model/*.kt |
| 4 | 4 new DAOs with CRUD operations | db/*Dao.kt |
| 5 | Room v1→v2 migration with proper schema evolution | AppDatabase.kt |
| 6 | Phase-aware rule engine with threshold resolution | RuleEngine.kt |
| 7 | Achievement engine (3 conditions) | AchievementEngine.kt |
| 8 | Sync layer updated for lifecycle fields + grow log push/pull | TursoSync.kt |
| 9 | Verify all existing tests still pass | tests/* |

**Note:** Compose UI screens (GrowView, PhaseTransitionSheet, GrowLogView, StrainPickerView, AchievementsView) and navigation updates are deferred to a follow-up plan. This plan focuses on the data layer, business logic, and sync — the foundation that UI screens will build on.
