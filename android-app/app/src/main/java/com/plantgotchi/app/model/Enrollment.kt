package com.plantgotchi.app.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "course_enrollments",
    foreignKeys = [ForeignKey(entity = Course::class, parentColumns = ["id"], childColumns = ["course_id"], onDelete = ForeignKey.CASCADE)],
    indices = [Index(value = ["user_id", "course_id"], unique = true)]
)
data class CourseEnrollment(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "user_id")
    val userId: String,

    @ColumnInfo(name = "course_id")
    val courseId: String,

    @ColumnInfo(name = "price_paid_cents")
    val pricePaidCents: Int = 0,

    val currency: String = "USD",

    val status: String = "active", // active, completed, cancelled

    @ColumnInfo(name = "enrolled_at")
    val enrolledAt: String? = null,

    @ColumnInfo(name = "completed_at")
    val completedAt: String? = null,
)

@Entity(
    tableName = "module_completions",
    foreignKeys = [
        ForeignKey(entity = CourseEnrollment::class, parentColumns = ["id"], childColumns = ["enrollment_id"], onDelete = ForeignKey.CASCADE),
        ForeignKey(entity = PhaseModule::class, parentColumns = ["id"], childColumns = ["module_id"], onDelete = ForeignKey.CASCADE),
    ],
    indices = [Index(value = ["enrollment_id", "module_id"], unique = true)]
)
data class ModuleCompletion(
    @PrimaryKey
    val id: String,

    @ColumnInfo(name = "enrollment_id")
    val enrollmentId: String,

    @ColumnInfo(name = "module_id")
    val moduleId: String,

    @ColumnInfo(name = "quiz_answers")
    val quizAnswers: String? = null, // JSON string

    @ColumnInfo(name = "completed_at")
    val completedAt: String? = null,
)
