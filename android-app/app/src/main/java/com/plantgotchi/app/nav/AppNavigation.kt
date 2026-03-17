package com.plantgotchi.app.nav

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.plantgotchi.app.PlantgotchiApp
import com.plantgotchi.app.analytics.Analytics
import com.plantgotchi.app.ui.add.AddPlantScreen
import com.plantgotchi.app.ui.auth.LoginScreen
import com.plantgotchi.app.ui.auth.SignUpScreen
import com.plantgotchi.app.ui.detail.PlantDetailScreen
import com.plantgotchi.app.ui.garden.GardenScreen
import com.plantgotchi.app.ui.scan.ScanScreen
import com.plantgotchi.app.ui.settings.SettingsScreen

object Routes {
    const val LOGIN = "login"
    const val SIGN_UP = "signup"
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
    val app = PlantgotchiApp.instance
    val isAuthenticated by app.authService.isAuthenticated.collectAsState()

    val startDestination = if (isAuthenticated) Routes.GARDEN else Routes.LOGIN

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    LaunchedEffect(currentRoute) {
        val tabName = when (currentRoute) {
            Routes.GARDEN -> "garden"
            Routes.SCAN -> "scan"
            Routes.SETTINGS -> "settings"
            else -> null
        }
        if (tabName != null) {
            Analytics.track("tab_changed", mapOf("tab_name" to tabName))
        }
    }

    // React to auth state changes: navigate when login/logout happens
    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) {
            navController.navigate(Routes.GARDEN) {
                popUpTo(Routes.LOGIN) { inclusive = true }
            }
        } else {
            navController.navigate(Routes.LOGIN) {
                popUpTo(Routes.GARDEN) { inclusive = true }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
    ) {
        composable(Routes.LOGIN) {
            LoginScreen(
                authService = app.authService,
                onSignUpClick = {
                    navController.navigate(Routes.SIGN_UP)
                },
            )
        }

        composable(Routes.SIGN_UP) {
            SignUpScreen(
                authService = app.authService,
                onBackToLogin = {
                    navController.popBackStack()
                },
            )
        }

        composable(Routes.GARDEN) {
            GardenScreen(
                userId = app.authService.userId ?: "local-user",
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
                userId = app.authService.userId ?: "local-user",
                onBack = { navController.popBackStack() },
                onPlantAdded = { _ ->
                    navController.popBackStack()
                },
            )
        }

        composable(Routes.SCAN) {
            ScanScreen(
                onBack = { navController.popBackStack() },
                onSensorPaired = { _ ->
                    navController.popBackStack()
                },
            )
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(
                onBack = { navController.popBackStack() },
            )
        }
    }
}
