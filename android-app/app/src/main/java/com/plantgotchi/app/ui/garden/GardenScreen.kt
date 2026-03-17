package com.plantgotchi.app.ui.garden

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.plantgotchi.app.PlantgotchiApp
import com.plantgotchi.app.R
import com.posthog.PostHog
import com.plantgotchi.app.BuildConfig
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.SensorReading
import com.plantgotchi.app.ui.theme.Green
import androidx.compose.runtime.LaunchedEffect
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.launch
import kotlinx.serialization.json.*

/**
 * Main garden dashboard — displays a grid of plant cards.
 *
 * Uses pull-to-refresh and a FAB to add new plants.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GardenScreen(
    userId: String = "local-user",
    onPlantClick: (String) -> Unit = {},
    onAddPlantClick: () -> Unit = {},
    onScanClick: () -> Unit = {},
    onSettingsClick: () -> Unit = {},
) {
    var plants by remember { mutableStateOf<List<Plant>>(emptyList()) }
    var isRefreshing by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    suspend fun fetchPlants() {
        try {
            val app = PlantgotchiApp.instance
            val response = app.httpClient.get("${BuildConfig.API_BASE_URL}/api/plants")
            if (response.status == HttpStatusCode.OK) {
                val json = Json.parseToJsonElement(response.bodyAsText()).jsonArray
                plants = json.map { entry ->
                    val p = entry.jsonObject["plant"]!!.jsonObject
                    Plant(
                        id = p["id"]!!.jsonPrimitive.content,
                        userId = p["user_id"]!!.jsonPrimitive.content,
                        name = p["name"]!!.jsonPrimitive.content,
                        species = p["species"]?.jsonPrimitive?.contentOrNull,
                        emoji = p["emoji"]?.jsonPrimitive?.contentOrNull ?: "\uD83C\uDF31",
                        moistureMin = p["moisture_min"]?.jsonPrimitive?.intOrNull ?: 30,
                        moistureMax = p["moisture_max"]?.jsonPrimitive?.intOrNull ?: 80,
                        tempMin = p["temp_min"]?.jsonPrimitive?.doubleOrNull ?: 15.0,
                        tempMax = p["temp_max"]?.jsonPrimitive?.doubleOrNull ?: 30.0,
                        lightPreference = p["light_preference"]?.jsonPrimitive?.contentOrNull ?: "medium",
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    LaunchedEffect(Unit) {
        fetchPlants()
        while (true) {
            kotlinx.coroutines.delay(15_000)
            fetchPlants()
        }
    }

    // Track garden view when plants change
    LaunchedEffect(plants) {
        if (plants.isNotEmpty()) {
            PostHog.capture("garden_viewed", properties = mapOf(
                "plant_count" to plants.size,
            ))
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.garden_title),
                        style = MaterialTheme.typography.headlineMedium,
                    )
                },
                actions = {
                    IconButton(onClick = onScanClick) {
                        Icon(
                            imageVector = Icons.Default.Bluetooth,
                            contentDescription = stringResource(R.string.garden_scan_sensors),
                        )
                    }
                    IconButton(onClick = onSettingsClick) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = stringResource(R.string.garden_settings),
                        )
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddPlantClick,
                containerColor = Green,
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = stringResource(R.string.garden_add_plant),
                    tint = MaterialTheme.colorScheme.onPrimary,
                )
            }
        },
    ) { innerPadding ->
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = {
                scope.launch {
                    isRefreshing = true
                    fetchPlants()
                    isRefreshing = false
                }
            },
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            if (plants.isEmpty()) {
                EmptyGarden(modifier = Modifier.fillMaxSize())
            } else {
                PlantGrid(
                    plants = plants,
                    onPlantClick = onPlantClick,
                )
            }
        }
    }
}

@Composable
private fun EmptyGarden(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "\uD83C\uDF31", // 🌱
                fontSize = 64.sp,
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = stringResource(R.string.garden_empty_title),
                style = MaterialTheme.typography.headlineSmall,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.garden_empty_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun PlantGrid(
    plants: List<Plant>,
    onPlantClick: (String) -> Unit,
) {
    // We observe the latest reading for each plant inline in each card.
    // For efficiency in a real app, this could be hoisted into a ViewModel.
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(plants, key = { it.id }) { plant ->
            val reading by PlantgotchiApp.db.readingDao()
                .observeLatestReading(plant.id)
                .collectAsState(initial = null)

            PlantCard(
                plant = plant,
                latestReading = reading,
                onClick = { onPlantClick(plant.id) },
            )
        }
    }
}
