package com.plantgotchi.app.ui.courses

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.plantgotchi.app.R
import com.plantgotchi.app.model.Course
import com.plantgotchi.app.PlantgotchiApp
import com.plantgotchi.app.analytics.Analytics

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CourseCatalogScreen(
    onCourseClick: (String) -> Unit,
) {
    val app = PlantgotchiApp.instance
    val courses by app.database.courseDao().observePublishedCourses().collectAsState(initial = emptyList())
    var searchQuery by remember { mutableStateOf("") }

    // Fetch courses on first load
    LaunchedEffect(Unit) {
        try {
            val remoteCourses = app.tursoSync.pullCourses()
            app.database.courseDao().insertCourses(remoteCourses)
            Analytics.track("courses_catalog_loaded", mapOf("count" to remoteCourses.size))
        } catch (_: Exception) { }
    }

    val filtered = courses.filter { course ->
        searchQuery.isBlank() || course.title.contains(searchQuery, ignoreCase = true) ||
            (course.description?.contains(searchQuery, ignoreCase = true) == true)
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text(stringResource(R.string.courses_title)) })
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            // Search bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text(stringResource(R.string.courses_search_hint)) },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                singleLine = true,
            )

            if (filtered.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = if (searchQuery.isBlank()) stringResource(R.string.courses_empty)
                               else stringResource(R.string.courses_empty_search),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    contentPadding = PaddingValues(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(filtered, key = { it.id }) { course ->
                        CourseCard(course = course, onClick = { onCourseClick(course.slug) })
                    }
                }
            }
        }
    }
}

@Composable
private fun CourseCard(course: Course, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
    ) {
        Column {
            if (course.coverImageUrl != null) {
                AsyncImage(
                    model = course.coverImageUrl,
                    contentDescription = course.title,
                    modifier = Modifier.fillMaxWidth().height(100.dp).clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp)),
                    contentScale = ContentScale.Crop,
                )
            } else {
                Box(
                    modifier = Modifier.fillMaxWidth().height(100.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("\uD83D\uDCDA", fontSize = 32.sp)
                }
            }
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = course.title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                course.creatorName?.let {
                    Text(
                        text = stringResource(R.string.courses_by, it),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = if (course.priceCents == 0) stringResource(R.string.courses_free)
                           else "$${course.priceCents / 100.0}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}
