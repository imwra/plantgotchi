package com.plantgotchi.app.ui.add

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.plantgotchi.app.PlantgotchiApp
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.ui.theme.Green
import kotlinx.coroutines.launch
import java.util.UUID

private val EMOJI_OPTIONS = listOf(
    "\uD83C\uDF31", // 🌱
    "\uD83C\uDF3F", // 🌿
    "\uD83C\uDF35", // 🌵
    "\uD83C\uDF3B", // 🌻
    "\uD83C\uDF39", // 🌹
    "\uD83C\uDF3A", // 🌺
    "\uD83C\uDF38", // 🌸
    "\uD83C\uDF37", // 🌷
    "\uD83C\uDF3E", // 🌾
    "\uD83C\uDF32", // 🌲
    "\uD83C\uDF34", // 🌴
    "\uD83E\uDEB4", // 🪴
)

private val LIGHT_OPTIONS = listOf("low", "medium", "high")

/**
 * Form to create a new plant.
 *
 * Includes name, species, emoji picker, light preference, and threshold sliders.
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AddPlantScreen(
    userId: String = "local-user",
    onBack: () -> Unit = {},
    onPlantAdded: (String) -> Unit = {},
) {
    var name by remember { mutableStateOf("") }
    var species by remember { mutableStateOf("") }
    var selectedEmoji by remember { mutableStateOf(EMOJI_OPTIONS[0]) }
    var lightPreference by remember { mutableStateOf("medium") }
    var moistureMin by remember { mutableFloatStateOf(30f) }
    var moistureMax by remember { mutableFloatStateOf(80f) }
    var tempMin by remember { mutableFloatStateOf(15f) }
    var tempMax by remember { mutableFloatStateOf(30f) }

    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = "Add Plant",
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Name
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Plant name") },
                placeholder = { Text("e.g. Office Fern") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
            )

            // Species
            OutlinedTextField(
                value = species,
                onValueChange = { species = it },
                label = { Text("Species (optional)") },
                placeholder = { Text("e.g. Nephrolepis exaltata") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
            )

            // Emoji picker
            Text(
                text = "Choose an emoji",
                style = MaterialTheme.typography.titleSmall,
            )
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                EMOJI_OPTIONS.forEach { emoji ->
                    FilterChip(
                        selected = emoji == selectedEmoji,
                        onClick = { selectedEmoji = emoji },
                        label = { Text(text = emoji, fontSize = 20.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Green.copy(alpha = 0.2f),
                        ),
                    )
                }
            }

            // Light preference
            Text(
                text = "Light preference",
                style = MaterialTheme.typography.titleSmall,
            )
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                LIGHT_OPTIONS.forEach { option ->
                    FilterChip(
                        selected = option == lightPreference,
                        onClick = { lightPreference = option },
                        label = {
                            Text(
                                text = option.replaceFirstChar { it.uppercase() },
                                style = MaterialTheme.typography.labelMedium,
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Green.copy(alpha = 0.2f),
                        ),
                    )
                }
            }

            // Moisture range
            Text(
                text = "Moisture range: ${moistureMin.toInt()}% – ${moistureMax.toInt()}%",
                style = MaterialTheme.typography.titleSmall,
            )
            Column {
                Text(
                    text = "Minimum: ${moistureMin.toInt()}%",
                    style = MaterialTheme.typography.bodySmall,
                )
                Slider(
                    value = moistureMin,
                    onValueChange = {
                        moistureMin = it
                        if (moistureMax < it) moistureMax = it
                    },
                    valueRange = 0f..100f,
                    steps = 19,
                    colors = SliderDefaults.colors(thumbColor = Green, activeTrackColor = Green),
                )
                Text(
                    text = "Maximum: ${moistureMax.toInt()}%",
                    style = MaterialTheme.typography.bodySmall,
                )
                Slider(
                    value = moistureMax,
                    onValueChange = {
                        moistureMax = it
                        if (moistureMin > it) moistureMin = it
                    },
                    valueRange = 0f..100f,
                    steps = 19,
                    colors = SliderDefaults.colors(thumbColor = Green, activeTrackColor = Green),
                )
            }

            // Temperature range
            Text(
                text = "Temp range: ${"%.0f".format(tempMin)}\u00B0C – ${"%.0f".format(tempMax)}\u00B0C",
                style = MaterialTheme.typography.titleSmall,
            )
            Column {
                Text(
                    text = "Minimum: ${"%.0f".format(tempMin)}\u00B0C",
                    style = MaterialTheme.typography.bodySmall,
                )
                Slider(
                    value = tempMin,
                    onValueChange = {
                        tempMin = it
                        if (tempMax < it) tempMax = it
                    },
                    valueRange = 0f..50f,
                    steps = 49,
                    colors = SliderDefaults.colors(thumbColor = Green, activeTrackColor = Green),
                )
                Text(
                    text = "Maximum: ${"%.0f".format(tempMax)}\u00B0C",
                    style = MaterialTheme.typography.bodySmall,
                )
                Slider(
                    value = tempMax,
                    onValueChange = {
                        tempMax = it
                        if (tempMin > it) tempMin = it
                    },
                    valueRange = 0f..50f,
                    steps = 49,
                    colors = SliderDefaults.colors(thumbColor = Green, activeTrackColor = Green),
                )
            }

            // Save button
            Button(
                onClick = {
                    if (name.isBlank()) return@Button
                    val plantId = UUID.randomUUID().toString()
                    scope.launch {
                        PlantgotchiApp.db.plantDao().insert(
                            Plant(
                                id = plantId,
                                userId = userId,
                                name = name.trim(),
                                species = species.trim().ifBlank { null },
                                emoji = selectedEmoji,
                                moistureMin = moistureMin.toInt(),
                                moistureMax = moistureMax.toInt(),
                                tempMin = tempMin.toDouble(),
                                tempMax = tempMax.toDouble(),
                                lightPreference = lightPreference,
                            )
                        )
                        onPlantAdded(plantId)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = name.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = Green),
                shape = RoundedCornerShape(12.dp),
            ) {
                Text(
                    text = "\uD83C\uDF31 Add Plant",
                    style = MaterialTheme.typography.labelLarge,
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
