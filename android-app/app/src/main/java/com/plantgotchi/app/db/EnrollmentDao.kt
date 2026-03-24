package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.plantgotchi.app.model.CourseEnrollment
import com.plantgotchi.app.model.ModuleCompletion
import kotlinx.coroutines.flow.Flow

@Dao
interface EnrollmentDao {

    @Query("SELECT * FROM course_enrollments WHERE user_id = :userId ORDER BY enrolled_at DESC")
    fun observeEnrollments(userId: String): Flow<List<CourseEnrollment>>

    @Query("SELECT * FROM course_enrollments WHERE user_id = :userId AND course_id = :courseId LIMIT 1")
    suspend fun getEnrollment(userId: String, courseId: String): CourseEnrollment?

    @Query("SELECT * FROM module_completions WHERE enrollment_id = :enrollmentId")
    suspend fun getCompletions(enrollmentId: String): List<ModuleCompletion>

    @Query("SELECT COUNT(*) FROM module_completions WHERE enrollment_id = :enrollmentId")
    suspend fun getCompletionCount(enrollmentId: String): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEnrollment(enrollment: CourseEnrollment)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCompletion(completion: ModuleCompletion)

    @Query("UPDATE course_enrollments SET status = 'completed', completed_at = :completedAt WHERE id = :enrollmentId")
    suspend fun markCompleted(enrollmentId: String, completedAt: String)
}
