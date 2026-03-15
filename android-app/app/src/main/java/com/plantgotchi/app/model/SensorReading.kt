package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Room entity mirroring the `sensor_readings` table from the web schema.
 */
@Entity(
    tableName = "sensor_readings",
    foreignKeys = [
        ForeignKey(
            entity = Plant::class,
            parentColumns = ["id"],
            childColumns = ["plant_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["plant_id", "timestamp"]),
        Index(value = ["sensor_id", "timestamp"]),
        Index(value = ["sensor_id", "timestamp"], unique = true)
    ]
)
data class SensorReading(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "plant_id")
    val plantId: String,

    @ColumnInfo(name = "sensor_id")
    val sensorId: String,

    val moisture: Int? = null,

    val temperature: Double? = null,

    val light: Int? = null,

    val battery: Int? = null,

    val timestamp: String? = null,
)
