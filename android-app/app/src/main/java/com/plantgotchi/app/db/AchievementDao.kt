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
