package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.plantgotchi.app.model.StrainProfile

@Dao
interface StrainProfileDao {

    @Query("SELECT * FROM strain_profiles WHERE is_custom = 0 OR user_id = :userId ORDER BY name")
    suspend fun getStrainProfiles(userId: String): List<StrainProfile>

    @Query("SELECT * FROM strain_profiles WHERE is_custom = 0 ORDER BY name")
    suspend fun getBuiltInStrains(): List<StrainProfile>

    @Query("SELECT * FROM strain_profiles WHERE id = :id")
    suspend fun getStrainById(id: String): StrainProfile?

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(strain: StrainProfile)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(strains: List<StrainProfile>)
}
