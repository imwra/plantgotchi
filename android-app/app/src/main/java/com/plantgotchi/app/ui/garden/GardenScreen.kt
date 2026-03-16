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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.plantgotchi.app.PlantgotchiApp
import com.posthog.PostHog
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.SensorReading
import com.plantgotchi.app.ui.theme.Green
import androidx.compose.runtime.LaunchedEffect
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

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
    val plants by PlantgotchiApp.db.plantDao()
        .getPlantsByUser(userId)
        .collectAsState(initial = emptyList())

    var isRefreshing by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

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
                        text = "Plantgotchi",
                        style = MaterialTheme.typography.headlineMedium,
                    )
                },
                actions = {
                    IconButton(onClick = onScanClick) {
                        Icon(
                            imageVector = Icons.Default.Bluetooth,
                            contentDescription = "Scan sensors",
                        )
                    }
                    IconButton(onClick = onSettingsClick) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings",
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
                    contentDescription = "Add plant",
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
                    // In a real app, this would trigger Turso sync
                    delay(1000)
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
                text = "No plants yet!",
                style = MaterialTheme.typography.headlineSmall,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Tap + to add your first plant",
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
