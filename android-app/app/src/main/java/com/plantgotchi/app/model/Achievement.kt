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
    AchievementDef("firstSeed", "First Seed", 10, "Start your first plant"),
    AchievementDef("firstHarvest", "First Harvest", 50, "Complete your first harvest"),
    AchievementDef("tenPlants", "Green Thumb", 30, "Grow 10 plants"),
    AchievementDef("firstTop", "First Top", 20, "Top a plant for the first time"),
    AchievementDef("firstLST", "First LST", 20, "Apply LST for the first time"),
    AchievementDef("speedGrow", "Speed Grower", 100, "Complete a grow in record time"),
    AchievementDef("firstGram", "First Gram", 25, "Harvest your first gram"),
    AchievementDef("bigYield100g", "Big Yield", 75, "Harvest 100g or more from a single plant"),
    AchievementDef("weekStreak", "Week Streak", 15, "Log activity 7 days in a row"),
    AchievementDef("fiveStrains", "Strain Collector", 40, "Grow 5 different strains"),
)
