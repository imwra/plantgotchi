package com.plantgotchi.app.ui.courses

import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.plantgotchi.app.R
import com.plantgotchi.app.PlantgotchiApp
import com.plantgotchi.app.analytics.Analytics
import com.plantgotchi.app.model.*
import kotlinx.coroutines.launch
import kotlinx.serialization.json.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CourseLearnerScreen(
    slug: String,
    onBack: () -> Unit,
) {
    val app = PlantgotchiApp.instance
    val userId = app.authService.userId ?: "local-user"
    val scope = rememberCoroutineScope()
    val json = Json { ignoreUnknownKeys = true }
    val drawerState = rememberDrawerState(DrawerValue.Closed)

    var course by remember { mutableStateOf<Course?>(null) }
    var phases by remember { mutableStateOf<List<CoursePhase>>(emptyList()) }
    var modulesByPhase by remember { mutableStateOf<Map<String, List<PhaseModule>>>(emptyMap()) }
    var enrollment by remember { mutableStateOf<CourseEnrollment?>(null) }
    var completedModuleIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    var activeModuleId by remember { mutableStateOf<String?>(null) }
    var blocks by remember { mutableStateOf<List<ContentBlock>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    // Load course structure
    LaunchedEffect(slug) {
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
            enrollment?.let { e ->
                val completions = app.database.enrollmentDao().getCompletions(e.id)
                completedModuleIds = completions.map { it.moduleId }.toSet()
            }
            // Select first incomplete module
            val allModules = phases.flatMap { mods[it.id] ?: emptyList() }
            activeModuleId = allModules.firstOrNull { it.id !in completedModuleIds }?.id ?: allModules.firstOrNull()?.id
        }
        isLoading = false
    }

    // Load blocks when active module changes
    LaunchedEffect(activeModuleId) {
        val modId = activeModuleId ?: return@LaunchedEffect
        val phase = phases.firstOrNull { modulesByPhase[it.id]?.any { m -> m.id == modId } == true } ?: return@LaunchedEffect
        try {
            blocks = app.tursoSync.pullContentBlocks(slug, phase.id, modId)
            for (block in blocks) { app.database.courseDao().insertBlocks(listOf(block)) }
        } catch (_: Exception) {
            blocks = app.database.courseDao().getBlocksByModule(modId)
        }
    }

    val activeModule = modulesByPhase.values.flatten().firstOrNull { it.id == activeModuleId }
    val isModuleCompleted = activeModuleId in completedModuleIds

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Text(
                    course?.title ?: "",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(16.dp),
                )
                HorizontalDivider()
                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                    phases.forEach { phase ->
                        Text(
                            phase.title,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(start = 16.dp, top = 12.dp, bottom = 4.dp),
                        )
                        modulesByPhase[phase.id]?.forEach { module ->
                            NavigationDrawerItem(
                                label = { Text(module.title, style = MaterialTheme.typography.bodyMedium) },
                                selected = module.id == activeModuleId,
                                onClick = {
                                    activeModuleId = module.id
                                    scope.launch { drawerState.close() }
                                },
                                badge = {
                                    if (module.id in completedModuleIds) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = stringResource(R.string.courses_completed), tint = MaterialTheme.colorScheme.primary)
                                    }
                                },
                                modifier = Modifier.padding(horizontal = 8.dp),
                            )
                        }
                    }
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(activeModule?.title ?: "") },
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
            } else {
                Column(
                    modifier = Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    blocks.forEach { block ->
                        RenderBlock(block, json) { selectedIndex ->
                            val enrollId = enrollment?.id ?: return@RenderBlock
                            scope.launch {
                                try {
                                    val answers = buildJsonObject { put(block.id, selectedIndex) }.toString()
                                    app.tursoSync.completeModule(enrollId, activeModuleId!!, answers)
                                    val completion = ModuleCompletion(
                                        id = java.util.UUID.randomUUID().toString(),
                                        enrollmentId = enrollId,
                                        moduleId = activeModuleId!!,
                                        quizAnswers = answers,
                                        completedAt = java.time.Instant.now().toString(),
                                    )
                                    app.database.enrollmentDao().insertCompletion(completion)
                                    completedModuleIds = completedModuleIds + activeModuleId!!
                                    Analytics.track("course_quiz_submitted", mapOf("course_id" to (course?.id ?: ""), "module_id" to (activeModuleId ?: "")))
                                } catch (_: Exception) { }
                            }
                        }
                    }

                    // Complete module button (for non-quiz modules)
                    if (!isModuleCompleted && blocks.none { it.blockType == "quiz" }) {
                        Button(
                            onClick = {
                                val enrollId = enrollment?.id ?: return@Button
                                val modId = activeModuleId ?: return@Button
                                scope.launch {
                                    try {
                                        app.tursoSync.completeModule(enrollId, modId)
                                        val completion = ModuleCompletion(
                                            id = java.util.UUID.randomUUID().toString(),
                                            enrollmentId = enrollId,
                                            moduleId = modId,
                                            completedAt = java.time.Instant.now().toString(),
                                        )
                                        app.database.enrollmentDao().insertCompletion(completion)
                                        completedModuleIds = completedModuleIds + modId
                                        Analytics.track("course_module_completed", mapOf("course_id" to (course?.id ?: ""), "module_id" to modId))
                                    } catch (_: Exception) { }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(stringResource(R.string.courses_complete_module))
                        }
                    }
                }
            }
        }
    }
}

private sealed class ParsedBlock {
    data class Video(val url: String, val caption: String?) : ParsedBlock()
    data class Text(val markdown: String) : ParsedBlock()
    data class Quiz(val question: String, val options: List<String>, val correctIndex: Int, val explanation: String) : ParsedBlock()
}

private fun parseBlock(block: ContentBlock, json: Json): ParsedBlock? {
    return try {
        val parsed = json.parseToJsonElement(block.content).jsonObject
        when (block.blockType) {
            "video" -> {
                val url = parsed["url"]?.jsonPrimitive?.contentOrNull ?: return null
                val caption = parsed["caption"]?.jsonPrimitive?.contentOrNull
                ParsedBlock.Video(url, caption)
            }
            "text" -> {
                val markdown = parsed["markdown"]?.jsonPrimitive?.contentOrNull ?: return null
                ParsedBlock.Text(markdown)
            }
            "quiz" -> {
                val question = parsed["question"]?.jsonPrimitive?.contentOrNull ?: return null
                val options = parsed["options"]?.jsonArray?.map { it.jsonPrimitive.content } ?: return null
                val correctIndex = parsed["correct_index"]?.jsonPrimitive?.intOrNull ?: return null
                val explanation = parsed["explanation"]?.jsonPrimitive?.contentOrNull ?: ""
                ParsedBlock.Quiz(question, options, correctIndex, explanation)
            }
            else -> null
        }
    } catch (_: Exception) { null }
}

@Composable
private fun RenderBlock(block: ContentBlock, json: Json, onQuizAnswer: (Int) -> Unit) {
    val parsed = remember(block.id, block.content) { parseBlock(block, json) } ?: return
    when (parsed) {
        is ParsedBlock.Video -> VideoBlock(url = parsed.url, caption = parsed.caption)
        is ParsedBlock.Text -> TextBlock(markdown = parsed.markdown)
        is ParsedBlock.Quiz -> QuizBlockView(
            question = parsed.question,
            options = parsed.options,
            correctIndex = parsed.correctIndex,
            explanation = parsed.explanation,
            onAnswer = onQuizAnswer,
        )
    }
}

@Composable
private fun VideoBlock(url: String, caption: String?) {
    var embedUrl = url
    val ytMatch = Regex("""(?:youtube\.com/watch\?v=|youtu\.be/)([^&]+)""").find(url)
    if (ytMatch != null) embedUrl = "https://www.youtube.com/embed/${ytMatch.groupValues[1]}"
    val vimeoMatch = Regex("""vimeo\.com/(\d+)""").find(url)
    if (vimeoMatch != null) embedUrl = "https://player.vimeo.com/video/${vimeoMatch.groupValues[1]}"

    Card(shape = RoundedCornerShape(12.dp)) {
        Column {
            AndroidView(
                factory = { ctx ->
                    WebView(ctx).apply {
                        settings.javaScriptEnabled = true
                        webViewClient = WebViewClient()
                        loadUrl(embedUrl)
                    }
                },
                modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f),
            )
            caption?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(8.dp))
            }
        }
    }
}

@Composable
private fun TextBlock(markdown: String) {
    // Simple markdown rendering via WebView
    val htmlContent = """
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body { font-family: sans-serif; font-size: 14px; color: #333; padding: 0; margin: 0; }</style>
        </head><body>$markdown</body></html>
    """.trimIndent()

    Card(shape = RoundedCornerShape(12.dp)) {
        AndroidView(
            factory = { ctx ->
                WebView(ctx).apply {
                    webViewClient = WebViewClient()
                    loadDataWithBaseURL(null, htmlContent, "text/html", "UTF-8", null)
                }
            },
            modifier = Modifier.fillMaxWidth().heightIn(min = 80.dp, max = 400.dp),
        )
    }
}
