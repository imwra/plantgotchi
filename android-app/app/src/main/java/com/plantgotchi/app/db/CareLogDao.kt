package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.plantgotchi.app.model.CareLog
import kotlinx.coroutines.flow.Flow

@Dao
interface CareLogDao {

    @Query(
        """
        SELECT * FROM care_logs
        WHERE plant_id = :plantId
        ORDER BY created_at DESC
        LIMIT :limit
        """
    )
    suspend fun getCareLogs(plantId: String, limit: Int = 20): List<CareLog>

    @Query(
        """
        SELECT * FROM care_logs
        WHERE plant_id = :plantId
        ORDER BY created_at DESC
        LIMIT :limit
        """
    )
    fun observeCareLogs(plantId: String, limit: Int = 20): Flow<List<CareLog>>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(careLog: CareLog)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(careLogs: List<CareLog>)
}
