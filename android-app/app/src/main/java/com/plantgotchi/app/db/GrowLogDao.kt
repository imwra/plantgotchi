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
