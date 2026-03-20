package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Room entity mirroring the `plants` table from the web schema.
 */
@Entity(tableName = "plants")
data class Plant(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    val name: String,

    val species: String? = null,

    val emoji: String = "\uD83C\uDF31", // 🌱

    @ColumnInfo(name = "photo_url")
    val photoUrl: String? = null,

    @ColumnInfo(name = "moisture_min")
    val moistureMin: Int = 30,

    @ColumnInfo(name = "moisture_max")
    val moistureMax: Int = 80,

    @ColumnInfo(name = "temp_min")
    val tempMin: Double = 15.0,

    @ColumnInfo(name = "temp_max")
    val tempMax: Double = 30.0,

    @ColumnInfo(name = "light_preference")
    val lightPreference: String = "medium",

    @ColumnInfo(name = "plant_type")
    val plantType: String? = null,

    @ColumnInfo(name = "strain_id")
    val strainId: String? = null,

    @ColumnInfo(name = "strain_name")
    val strainName: String? = null,

    @ColumnInfo(name = "strain_type")
    val strainType: String? = null,

    val environment: String? = null,

    @ColumnInfo(name = "current_phase")
    val currentPhase: String? = null,

    @ColumnInfo(name = "phase_started_at")
    val phaseStartedAt: String? = null,

    @ColumnInfo(name = "grow_id")
    val growId: String? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,

    @ColumnInfo(name = "updated_at")
    val updatedAt: String? = null,
)
