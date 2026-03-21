package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "strain_profiles",
    indices = [
        Index(value = ["name"]),
        Index(value = ["user_id"])
    ]
)
data class StrainProfile(
    @PrimaryKey
    val id: String,

    val name: String,

    val type: String? = null, // indica, sativa, hybrid

    @ColumnInfo(name = "flower_weeks_min")
    val flowerWeeksMin: Int? = null,

    @ColumnInfo(name = "flower_weeks_max")
    val flowerWeeksMax: Int? = null,

    val difficulty: String? = null,

    @ColumnInfo(name = "thresholds_by_phase")
    val thresholdsByPhase: String? = null, // JSON string

    val notes: String? = null,

    @ColumnInfo(name = "is_custom")
    val isCustom: Boolean = false,

    @ColumnInfo(name = "user_id")
    val userId: String? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,
)
