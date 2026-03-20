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
