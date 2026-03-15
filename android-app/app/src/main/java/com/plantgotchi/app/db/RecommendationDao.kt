package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.plantgotchi.app.model.Recommendation
import kotlinx.coroutines.flow.Flow

@Dao
interface RecommendationDao {

    @Query(
        """
        SELECT * FROM recommendations
        WHERE plant_id = :plantId
        ORDER BY created_at DESC
        LIMIT :limit
        """
    )
    suspend fun getRecommendations(plantId: String, limit: Int = 10): List<Recommendation>

    @Query(
        """
        SELECT * FROM recommendations
        WHERE plant_id = :plantId
        ORDER BY created_at DESC
        LIMIT :limit
        """
    )
    fun observeRecommendations(plantId: String, limit: Int = 10): Flow<List<Recommendation>>

    @Query("SELECT * FROM recommendations WHERE id = :id")
    suspend fun getById(id: String): Recommendation?

    @Query("UPDATE recommendations SET acted_on = 1 WHERE id = :id")
    suspend fun markActedOn(id: String)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(recommendation: Recommendation)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(recommendations: List<Recommendation>)
}
