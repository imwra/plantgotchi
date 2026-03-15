package com.plantgotchi.app.ui.detail

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.plantgotchi.app.PlantgotchiApp
import com.plantgotchi.app.agent.RuleEngine
import com.plantgotchi.app.model.CareLog
import com.plantgotchi.app.model.Recommendation
import com.plantgotchi.app.ui.theme.Blue
import com.plantgotchi.app.ui.theme.Green
import com.plantgotchi.app.ui.theme.Red
import com.plantgotchi.app.ui.theme.Yellow
import com.posthog.PostHog
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Plant detail screen — shows sensor readings, care log, recommendations,
 * and quick action buttons (Water, Fertilize).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlantDetailScreen(
    plantId: String,
    userId: String = "local-user",
    onBack: () -> Unit = {},
) {
    val plant by PlantgotchiApp.db.plantDao()
        .observePlant(plantId)
        .collectAsState(initial = null)

    val latestReading by PlantgotchiApp.db.readingDao()
        .observeLatestReading(plantId)
        .collectAsState(initial = null)

    val careLogs by PlantgotchiApp.db.careLogDao()
        .observeCareLogs(plantId)
        .collectAsState(initial = emptyList())

    val recommendations by PlantgotchiApp.db.recommendationDao()
        .observeRecommendations(plantId)
        .collectAsState(initial = emptyList())

    val scope = rememberCoroutineScope()

    val currentPlant = plant ?: return

    val moisture = latestReading?.moisture
    val temp = latestReading?.temperature
    val light = latestReading?.light
    val battery = latestReading?.battery

    val hp = RuleEngine.computeHP(
        moisture, temp,
        currentPlant.moistureMin, currentPlant.moistureMax,
        currentPlant.tempMin, currentPlant.tempMax,
    )
    val status = RuleEngine.computeStatus(
        moisture, temp,
        currentPlant.moistureMin, currentPlant.moistureMax,
        currentPlant.tempMin, currentPlant.tempMax,
    )
    val lightLabel = RuleEngine.getLightLabel(light)

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = "${currentPlant.emoji} ${currentPlant.name}",
                        style = MaterialTheme.typography.headlineSmall,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                        )
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Header — emoji + status
            item {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(text = currentPlant.emoji, fontSize = 72.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = when (status) {
                            "happy" -> "\u2665 Happy"
                            "thirsty" -> "\u2639 Needs attention"
                            else -> "? No data"
                        },
                        style = MaterialTheme.typography.titleMedium,
                        color = when (status) {
                            "happy" -> Green
                            "thirsty" -> Yellow
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        },
                    )
                    if (currentPlant.species != null) {
                        Text(
                            text = currentPlant.species,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }

            // HP bar
            item {
                SensorCard(title = "Health") {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("HP", style = MaterialTheme.typography.labelMedium)
                        Spacer(modifier = Modifier.width(8.dp))
                        LinearProgressIndicator(
                            progress = { hp / 100f },
                            modifier = Modifier
                                .weight(1f)
                                .height(12.dp)
                                .clip(RoundedCornerShape(6.dp)),
                            color = when {
                                hp >= 70 -> Green
                                hp >= 40 -> Yellow
                                else -> Red
                            },
                            trackColor = MaterialTheme.colorScheme.surfaceVariant,
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("$hp/100", style = MaterialTheme.typography.labelMedium)
                    }
                }
            }

            // Sensor readings
            item {
                SensorCard(title = "Sensor Readings") {
                    ReadingRow(label = "\uD83D\uDCA7 Moisture", value = moisture?.let { "$it%" } ?: "--")
                    ReadingRow(label = "\uD83C\uDF21 Temp", value = temp?.let { "${"%.1f".format(it)}\u00B0C" } ?: "--")
                    ReadingRow(label = "\u2600 Light", value = light?.let { "$it lux ($lightLabel)" } ?: "--")
                    ReadingRow(label = "\uD83D\uDD0B Battery", value = battery?.let { "$it%" } ?: "--")
                }
            }

            // Quick actions
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Button(
                        onClick = {
                            scope.launch {
                                PlantgotchiApp.db.careLogDao().insert(
                                    CareLog(
                                        id = UUID.randomUUID().toString(),
                                        plantId = plantId,
                                        userId = userId,
                                        action = "water",
                                        notes = "Watered via app",
                                    )
                                )
                                PostHog.capture("care_logged", properties = mapOf(
                                    "plant_id" to plantId,
                                    "action" to "water",
                                ))
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Blue),
                    ) {
                        Text("\uD83D\uDCA7 Water")
                    }
                    Button(
                        onClick = {
                            scope.launch {
                                PlantgotchiApp.db.careLogDao().insert(
                                    CareLog(
                                        id = UUID.randomUUID().toString(),
                                        plantId = plantId,
                                        userId = userId,
                                        action = "fertilize",
                                        notes = "Fertilized via app",
                                    )
                                )
                                PostHog.capture("care_logged", properties = mapOf(
                                    "plant_id" to plantId,
                                    "action" to "fertilize",
                                ))
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Green),
                    ) {
                        Text("\uD83C\uDF3F Fertilize")
                    }
                }
            }

            // Recommendations
            if (recommendations.isNotEmpty()) {
                item {
                    Text(
                        text = "Recommendations",
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
                items(recommendations, key = { it.id }) { rec ->
                    RecommendationRow(
                        recommendation = rec,
                        onActedOn = {
                            scope.launch {
                                PlantgotchiApp.db.recommendationDao().markActedOn(rec.id)
                            }
                        },
                    )
                }
            }

            // Care log
            if (careLogs.isNotEmpty()) {
                item {
                    Text(
                        text = "Care Log",
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
                items(careLogs, key = { it.id }) { log ->
                    CareLogRow(careLog = log)
                }
            }

            // Bottom spacing
            item { Spacer(modifier = Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun SensorCard(
    title: String,
    content: @Composable () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        ),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
            )
            Spacer(modifier = Modifier.height(8.dp))
            content()
        }
    }
}

@Composable
private fun ReadingRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium)
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun RecommendationRow(
    recommendation: Recommendation,
    onActedOn: () -> Unit,
) {
    val severityColor = when (recommendation.severity) {
        "urgent" -> Red
        "warning" -> Yellow
        else -> Blue
    }
    val severityIcon = when (recommendation.severity) {
        "urgent" -> "\u26A0\uFE0F"
        "warning" -> "\u26A0"
        else -> "\u2139\uFE0F"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = severityColor.copy(alpha = 0.1f),
        ),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Text(text = severityIcon, fontSize = 16.sp)
            Spacer(modifier = Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = recommendation.message,
                    style = MaterialTheme.typography.bodySmall,
                )
                if (!recommendation.actedOn) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Tap to mark as done",
                        style = MaterialTheme.typography.labelSmall,
                        color = severityColor,
                        modifier = Modifier.clip(RoundedCornerShape(4.dp))
                            .padding(2.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun CareLogRow(careLog: CareLog) {
    val actionIcon = when (careLog.action) {
        "water" -> "\uD83D\uDCA7"
        "fertilize" -> "\uD83C\uDF3F"
        "prune" -> "\u2702\uFE0F"
        "repot" -> "\uD83E\uDEB4"
        else -> "\uD83D\uDCDD"
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text = actionIcon, fontSize = 16.sp)
        Spacer(modifier = Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = careLog.action.replaceFirstChar { it.uppercase() },
                style = MaterialTheme.typography.bodyMedium,
            )
            if (careLog.notes != null) {
                Text(
                    text = careLog.notes,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Text(
            text = careLog.createdAt?.take(10) ?: "",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
