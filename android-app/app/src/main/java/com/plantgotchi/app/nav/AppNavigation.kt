package com.plantgotchi.app.nav

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.plantgotchi.app.ui.add.AddPlantScreen
import com.plantgotchi.app.ui.detail.PlantDetailScreen
import com.plantgotchi.app.ui.garden.GardenScreen
import com.plantgotchi.app.ui.scan.ScanScreen
import com.plantgotchi.app.ui.settings.SettingsScreen

/**
 * Top-level Compose Navigation graph.
 *
 * Routes:
 * - garden (start) -> detail/{plantId}
 * - garden -> add
 * - garden -> scan
 * - garden -> settings
 */
object Routes {
    const val GARDEN = "garden"
    const val PLANT_DETAIL = "detail/{plantId}"
    const val ADD_PLANT = "add"
    const val SCAN = "scan"
    const val SETTINGS = "settings"

    fun plantDetail(plantId: String) = "detail/$plantId"
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.GARDEN,
    ) {
        composable(Routes.GARDEN) {
            GardenScreen(
                onPlantClick = { plantId ->
                    navController.navigate(Routes.plantDetail(plantId))
                },
                onAddPlantClick = {
                    navController.navigate(Routes.ADD_PLANT)
                },
                onScanClick = {
                    navController.navigate(Routes.SCAN)
                },
                onSettingsClick = {
                    navController.navigate(Routes.SETTINGS)
                },
            )
        }

        composable(
            route = Routes.PLANT_DETAIL,
            arguments = listOf(
                navArgument("plantId") { type = NavType.StringType }
            ),
        ) { backStackEntry ->
            val plantId = backStackEntry.arguments?.getString("plantId") ?: return@composable
            PlantDetailScreen(
                plantId = plantId,
                onBack = { navController.popBackStack() },
            )
        }

        composable(Routes.ADD_PLANT) {
            AddPlantScreen(
                onBack = { navController.popBackStack() },
                onPlantAdded = { plantId ->
                    navController.popBackStack()
                    navController.navigate(Routes.plantDetail(plantId))
                },
            )
        }

        composable(Routes.SCAN) {
            ScanScreen(
                onBack = { navController.popBackStack() },
                onSensorPaired = { _ ->
                    // Return to garden after pairing
                    navController.popBackStack()
                },
            )
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(
                onBack = { navController.popBackStack() },
                onSignOut = {
                    // Clear data and go back to garden
                    navController.popBackStack(Routes.GARDEN, inclusive = false)
                },
            )
        }
    }
}
