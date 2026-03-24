package com.plantgotchi.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.plantgotchi.app.model.ContentBlock
import com.plantgotchi.app.model.Course
import com.plantgotchi.app.model.CoursePhase
import com.plantgotchi.app.model.PhaseModule
import kotlinx.coroutines.flow.Flow

@Dao
interface CourseDao {

    @Query("SELECT * FROM courses WHERE status = 'published' ORDER BY created_at DESC")
    fun observePublishedCourses(): Flow<List<Course>>

    @Query("SELECT * FROM courses WHERE status = 'published' ORDER BY created_at DESC")
    suspend fun getPublishedCourses(): List<Course>

    @Query("SELECT * FROM courses WHERE id = :id")
    suspend fun getCourseById(id: String): Course?

    @Query("SELECT * FROM courses WHERE slug = :slug")
    suspend fun getCourseBySlug(slug: String): Course?

    @Query("SELECT * FROM course_phases WHERE course_id = :courseId ORDER BY sort_order")
    suspend fun getPhasesByCourse(courseId: String): List<CoursePhase>

    @Query("SELECT * FROM phase_modules WHERE phase_id = :phaseId ORDER BY sort_order")
    suspend fun getModulesByPhase(phaseId: String): List<PhaseModule>

    @Query("SELECT * FROM module_content_blocks WHERE module_id = :moduleId ORDER BY sort_order")
    suspend fun getBlocksByModule(moduleId: String): List<ContentBlock>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCourse(course: Course)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCourses(courses: List<Course>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPhases(phases: List<CoursePhase>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertModules(modules: List<PhaseModule>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBlocks(blocks: List<ContentBlock>)

    @Query("DELETE FROM courses")
    suspend fun deleteAllCourses()
}
