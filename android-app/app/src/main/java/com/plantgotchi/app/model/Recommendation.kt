package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Room entity mirroring the `recommendations` table from the web schema.
 */
@Entity(
    tableName = "recommendations",
    foreignKeys = [
        ForeignKey(
            entity = Plant::class,
            parentColumns = ["id"],
            childColumns = ["plant_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["plant_id", "created_at"])
    ]
)
data class Recommendation(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "plant_id")
    val plantId: String,

    val source: String, // "rules" | "claude"

    val message: String,

    val severity: String = "info", // "info" | "warning" | "urgent"

    @ColumnInfo(name = "acted_on")
    val actedOn: Boolean = false,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,
)
