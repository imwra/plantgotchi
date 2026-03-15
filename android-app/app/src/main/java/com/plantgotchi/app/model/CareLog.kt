package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Room entity mirroring the `care_logs` table from the web schema.
 */
@Entity(
    tableName = "care_logs",
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
data class CareLog(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "plant_id")
    val plantId: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    val action: String,

    val notes: String? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,
)
