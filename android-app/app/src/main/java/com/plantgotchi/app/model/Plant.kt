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

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,

    @ColumnInfo(name = "updated_at")
    val updatedAt: String? = null,
)
