package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "grow_logs",
    foreignKeys = [
        ForeignKey(
            entity = Plant::class,
            parentColumns = ["id"],
            childColumns = ["plant_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["plant_id", "created_at"]),
        Index(value = ["plant_id", "phase", "created_at"])
    ]
)
data class GrowLog(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "plant_id")
    val plantId: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    val phase: String,

    @ColumnInfo(name = "log_type")
    val logType: String,

    val data: String? = null, // JSON string

    @ColumnInfo(name = "photo_url")
    val photoUrl: String? = null,

    val notes: String? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,
)
