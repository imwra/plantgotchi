package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.plantgotchi.app.model.SensorReading
import kotlinx.coroutines.flow.Flow

@Dao
interface ReadingDao {

    @Query(
        """
        SELECT * FROM sensor_readings
        WHERE plant_id = :plantId
        ORDER BY timestamp DESC
        LIMIT 1
        """
    )
    suspend fun getLatestReading(plantId: String): SensorReading?

    @Query(
        """
        SELECT * FROM sensor_readings
        WHERE plant_id = :plantId
        ORDER BY timestamp DESC
        LIMIT 1
        """
    )
    fun observeLatestReading(plantId: String): Flow<SensorReading?>

    @Query(
        """
        SELECT * FROM sensor_readings
        WHERE plant_id = :plantId
          AND timestamp >= datetime('now', :daysOffset)
        ORDER BY timestamp DESC
        """
    )
    suspend fun getRecentReadings(plantId: String, daysOffset: String = "-7 days"): List<SensorReading>

    @Query(
        """
        SELECT * FROM sensor_readings
        WHERE plant_id = :plantId
        ORDER BY timestamp DESC
        LIMIT :limit
        """
    )
    suspend fun getReadings(plantId: String, limit: Int = 100): List<SensorReading>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(reading: SensorReading)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(readings: List<SensorReading>)
}
