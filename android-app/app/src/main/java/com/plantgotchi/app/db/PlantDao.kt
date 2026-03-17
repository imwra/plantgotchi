package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.plantgotchi.app.model.Plant
import kotlinx.coroutines.flow.Flow

@Dao
interface PlantDao {

    @Query("SELECT * FROM plants WHERE user_id = :userId ORDER BY name")
    fun getPlantsByUser(userId: String): Flow<List<Plant>>

    @Query("SELECT * FROM plants WHERE user_id = :userId ORDER BY name")
    suspend fun getPlantsByUserOnce(userId: String): List<Plant>

    @Query("SELECT * FROM plants WHERE id = :id")
    suspend fun getPlantById(id: String): Plant?

    @Query("SELECT * FROM plants WHERE id = :id")
    fun observePlant(id: String): Flow<Plant?>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(plant: Plant)

    @Update
    suspend fun update(plant: Plant)

    @Query("DELETE FROM plants WHERE id = :id")
    suspend fun delete(id: String)

    @Query("DELETE FROM plants WHERE user_id = :userId")
    suspend fun deleteAllByUser(userId: String)
}
