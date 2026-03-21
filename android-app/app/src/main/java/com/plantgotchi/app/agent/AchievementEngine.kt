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
