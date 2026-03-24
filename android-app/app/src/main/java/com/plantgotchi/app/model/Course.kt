package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "courses",
    indices = [Index(value = ["slug"], unique = true), Index(value = ["creator_id"])]
)
data class Course(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "creator_id")
    val creatorId: String,

    @ColumnInfo(name = "creator_name")
    val creatorName: String? = null,

    val title: String,

    val slug: String,

    val description: String? = null,

    @ColumnInfo(name = "cover_image_url")
    val coverImageUrl: String? = null,

    @ColumnInfo(name = "price_cents")
    val priceCents: Int = 0,

    val currency: String = "USD",

    val status: String = "published",

    @ColumnInfo(name = "enrollment_count")
    val enrollmentCount: Int? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,

    @ColumnInfo(name = "updated_at")
    val updatedAt: String? = null,
)

@Entity(
    tableName = "course_phases",
    foreignKeys = [ForeignKey(entity = Course::class, parentColumns = ["id"], childColumns = ["course_id"], onDelete = ForeignKey.CASCADE)],
    indices = [Index(value = ["course_id", "sort_order"])]
)
data class CoursePhase(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "course_id")
    val courseId: String,

    val title: String,

    val description: String? = null,

    @ColumnInfo(name = "sort_order")
    val sortOrder: Int,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,
)

@Entity(
    tableName = "phase_modules",
    foreignKeys = [ForeignKey(entity = CoursePhase::class, parentColumns = ["id"], childColumns = ["phase_id"], onDelete = ForeignKey.CASCADE)],
    indices = [Index(value = ["phase_id", "sort_order"])]
)
data class PhaseModule(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "phase_id")
    val phaseId: String,

    val title: String,

    val description: String? = null,

    @ColumnInfo(name = "sort_order")
    val sortOrder: Int,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,
)

@Entity(
    tableName = "module_content_blocks",
    foreignKeys = [ForeignKey(entity = PhaseModule::class, parentColumns = ["id"], childColumns = ["module_id"], onDelete = ForeignKey.CASCADE)],
    indices = [Index(value = ["module_id", "sort_order"])]
)
data class ContentBlock(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "module_id")
    val moduleId: String,

    @ColumnInfo(name = "block_type")
    val blockType: String, // "video", "text", "quiz"

    @ColumnInfo(name = "sort_order")
    val sortOrder: Int,

    val content: String, // JSON string

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,

    @ColumnInfo(name = "updated_at")
    val updatedAt: String? = null,
)
