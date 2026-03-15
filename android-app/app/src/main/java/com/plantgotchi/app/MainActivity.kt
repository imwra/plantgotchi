package com.plantgotchi.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.plantgotchi.app.nav.AppNavigation
import com.plantgotchi.app.ui.theme.PlantgotchiTheme

/**
 * Single-activity Compose host for the Plantgotchi app.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PlantgotchiTheme {
                AppNavigation()
            }
        }
    }
}
