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
