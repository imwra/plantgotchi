package com.plantgotchi.app.ui.courses

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.plantgotchi.app.R
import com.plantgotchi.app.PlantgotchiApp
import com.plantgotchi.app.analytics.Analytics
import com.plantgotchi.app.model.Course
import com.plantgotchi.app.model.CourseEnrollment
import com.plantgotchi.app.model.CoursePhase
import com.plantgotchi.app.model.PhaseModule
import com.plantgotchi.app.sync.CourseDetail
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CourseDetailScreen(
    slug: String,
    onBack: () -> Unit,
    onStartLearning: (String) -> Unit,
) {
    val app = PlantgotchiApp.instance
    val userId = app.authService.userId ?: "local-user"
    val scope = rememberCoroutineScope()

    var course by remember { mutableStateOf<Course?>(null) }
    var phases by remember { mutableStateOf<List<CoursePhase>>(emptyList()) }
    var modulesByPhase by remember { mutableStateOf<Map<String, List<PhaseModule>>>(emptyMap()) }
    var enrollment by remember { mutableStateOf<CourseEnrollment?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var isEnrolling by remember { mutableStateOf(false) }

    LaunchedEffect(slug) {
        try {
            val detail = app.tursoSync.pullCourseDetail(slug)
            if (detail != null) {
                course = detail.course
                phases = detail.phases
                modulesByPhase = detail.modules
                app.database.courseDao().insertCourse(detail.course)
                app.database.courseDao().insertPhases(detail.phases)
                detail.modules.values.flatten().let { app.database.courseDao().insertModules(it) }
                enrollment = app.database.enrollmentDao().getEnrollment(userId, detail.course.id)
            } else {
                // Fallback to local cache
                val localCourse = app.database.courseDao().getCourseBySlug(slug)
                course = localCourse
                if (localCourse != null) {
                    phases = app.database.courseDao().getPhasesByCourse(localCourse.id)
                    val mods = mutableMapOf<String, List<PhaseModule>>()
                    for (p in phases) {
                        mods[p.id] = app.database.courseDao().getModulesByPhase(p.id)
                    }
                    modulesByPhase = mods
                    enrollment = app.database.enrollmentDao().getEnrollment(userId, localCourse.id)
                }
            }
        } catch (_: Exception) { }
        isLoading = false
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(course?.title ?: "") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.detail_back))
                    }
                },
            )
        }
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (course == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text(stringResource(R.string.courses_empty))
            }
        } else {
            val c = course ?: return@Scaffold
            Column(
                modifier = Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState())
            ) {
                // Cover image
                c.coverImageUrl?.let { url ->
                    AsyncImage(
                        model = url,
                        contentDescription = c.title,
                        modifier = Modifier.fillMaxWidth().height(200.dp).clip(RoundedCornerShape(bottomStart = 16.dp, bottomEnd = 16.dp)),
                        contentScale = ContentScale.Crop,
                    )
                }

                Column(modifier = Modifier.padding(16.dp)) {
                    // Title and creator
                    Text(c.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    c.creatorName?.let {
                        Text(stringResource(R.string.courses_by, it), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Spacer(modifier = Modifier.height(8.dp))

                    // Stats
                    val totalModules = modulesByPhase.values.sumOf { it.size }
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text(stringResource(R.string.courses_phases, phases.size), style = MaterialTheme.typography.labelMedium)
                        Text(stringResource(R.string.courses_modules, totalModules), style = MaterialTheme.typography.labelMedium)
                    }
                    Spacer(modifier = Modifier.height(16.dp))

                    // Enroll / Continue button
                    Button(
                        onClick = {
                            if (enrollment != null) {
                                onStartLearning(slug)
                            } else {
                                isEnrolling = true
                                scope.launch {
                                    try {
                                        val newEnrollment = app.tursoSync.enrollInCourse(c.id)
                                        if (newEnrollment != null) {
                                            app.database.enrollmentDao().insertEnrollment(newEnrollment)
                                            enrollment = newEnrollment
                                            Analytics.track("course_enrolled", mapOf("course_id" to c.id, "price_cents" to c.priceCents))
                                            onStartLearning(slug)
                                        }
                                    } catch (_: Exception) { }
                                    isEnrolling = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isEnrolling,
                    ) {
                        Text(
                            if (enrollment != null) stringResource(R.string.courses_continue)
                            else if (c.priceCents == 0) stringResource(R.string.courses_enroll_free)
                            else stringResource(R.string.courses_enroll_paid, "$${c.priceCents / 100.0}")
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))

                    // About
                    c.description?.let { desc ->
                        Text(stringResource(R.string.courses_about), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(desc, style = MaterialTheme.typography.bodyMedium)
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // Curriculum
                    Text(stringResource(R.string.courses_curriculum), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    phases.forEach { phase ->
                        Text(phase.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                        modulesByPhase[phase.id]?.forEach { module ->
                            Text("  \u2022 ${module.title}", style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(start = 8.dp, top = 4.dp))
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}
