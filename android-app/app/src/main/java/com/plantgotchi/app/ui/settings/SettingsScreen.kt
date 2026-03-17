package com.plantgotchi.app.ui.settings

import android.app.LocaleManager
import android.content.Context
import android.os.Build
import android.os.LocaleList
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.core.os.LocaleListCompat
import com.plantgotchi.app.PlantgotchiApp
import com.plantgotchi.app.R
import com.plantgotchi.app.model.CareLog
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.Recommendation
import com.plantgotchi.app.model.SensorReading
import com.plantgotchi.app.analytics.Analytics
import com.plantgotchi.app.ui.theme.Green
import com.plantgotchi.app.ui.theme.Red
import kotlinx.coroutines.launch
import androidx.compose.runtime.LaunchedEffect
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

/**
 * Settings screen — language selector, demo mode, Turso cloud sync,
 * sensor management, and sign out.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit = {},
) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("plantgotchi_prefs", Context.MODE_PRIVATE) }
    var isDemoMode by remember { mutableStateOf(prefs.getBoolean("demo_mode_on", true)) }
    var showDemoLoadedAlert by remember { mutableStateOf(false) }
    var currentLocale by remember { mutableStateOf(getCurrentLocale(context)) }

    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        Analytics.track("screen_viewed", mapOf("screen_name" to "settings"))
    }

    if (showDemoLoadedAlert) {
        AlertDialog(
            onDismissRequest = { showDemoLoadedAlert = false },
            confirmButton = {
                TextButton(onClick = { showDemoLoadedAlert = false }) {
                    Text(stringResource(R.string.settings_ok))
                }
            },
            title = { Text(stringResource(R.string.settings_demo_loaded_title)) },
            text = {
                Text(stringResource(R.string.settings_demo_loaded_message))
            },
        )
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.settings_title),
                        style = MaterialTheme.typography.headlineSmall,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.detail_back),
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
            // Language section
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                ),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = stringResource(R.string.settings_language),
                        style = MaterialTheme.typography.titleSmall,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = stringResource(R.string.settings_language_desc),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        // Portuguese button
                        OutlinedButton(
                            onClick = {
                                setAppLocale(context, "pt-BR")
                                currentLocale = "pt"
                                Analytics.track("language_changed", mapOf("locale" to "pt-BR"))
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            colors = if (currentLocale == "pt") {
                                ButtonDefaults.outlinedButtonColors(
                                    containerColor = Green.copy(alpha = 0.15f),
                                    contentColor = Green,
                                )
                            } else {
                                ButtonDefaults.outlinedButtonColors()
                            },
                            border = if (currentLocale == "pt") {
                                BorderStroke(2.dp, Green)
                            } else {
                                ButtonDefaults.outlinedButtonBorder(true)
                            },
                        ) {
                            Text(stringResource(R.string.language_pt))
                        }

                        // English button
                        OutlinedButton(
                            onClick = {
                                setAppLocale(context, "en")
                                currentLocale = "en"
                                Analytics.track("language_changed", mapOf("locale" to "en"))
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            colors = if (currentLocale == "en") {
                                ButtonDefaults.outlinedButtonColors(
                                    containerColor = Green.copy(alpha = 0.15f),
                                    contentColor = Green,
                                )
                            } else {
                                ButtonDefaults.outlinedButtonColors()
                            },
                            border = if (currentLocale == "en") {
                                BorderStroke(2.dp, Green)
                            } else {
                                ButtonDefaults.outlinedButtonBorder(true)
                            },
                        ) {
                            Text(stringResource(R.string.language_en))
                        }
                    }
                }
            }

            // Demo Mode section
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                ),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = stringResource(R.string.settings_demo_mode),
                        style = MaterialTheme.typography.titleSmall,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = stringResource(R.string.settings_demo_desc),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = stringResource(R.string.settings_demo_data),
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        Switch(
                            checked = isDemoMode,
                            onCheckedChange = { enabled ->
                                isDemoMode = enabled
                                scope.launch {
                                    toggleDemoMode(enabled, context)
                                    if (enabled) {
                                        showDemoLoadedAlert = true
                                    }
                                }
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Green,
                                checkedTrackColor = Green.copy(alpha = 0.5f),
                            ),
                        )
                    }
                }
            }

            // Sensor Management
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                ),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = stringResource(R.string.settings_paired_sensors),
                        style = MaterialTheme.typography.titleSmall,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = stringResource(R.string.settings_no_sensors),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            // About
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                ),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Image(
                        painter = painterResource(R.drawable.ic_app_logo),
                        contentDescription = "Plantgotchi",
                        modifier = Modifier.size(64.dp),
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = stringResource(R.string.settings_about),
                        style = MaterialTheme.typography.titleSmall,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = stringResource(R.string.settings_version),
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Text(
                        text = stringResource(R.string.settings_about_desc),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

private fun getCurrentLocale(context: Context): String {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val localeManager = context.getSystemService(LocaleManager::class.java)
        val appLocales = localeManager.applicationLocales
        if (appLocales.isEmpty) "pt" else {
            val tag = appLocales.get(0)?.language ?: "pt"
            tag
        }
    } else {
        val locales = AppCompatDelegate.getApplicationLocales()
        if (locales.isEmpty) "pt" else {
            locales.get(0)?.language ?: "pt"
        }
    }
}

private fun setAppLocale(context: Context, languageTag: String) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val localeManager = context.getSystemService(LocaleManager::class.java)
        localeManager.applicationLocales = LocaleList.forLanguageTags(languageTag)
    } else {
        AppCompatDelegate.setApplicationLocales(
            LocaleListCompat.forLanguageTags(languageTag)
        )
    }
}

private suspend fun toggleDemoMode(enabled: Boolean, context: Context) {
    val userId = "local-user"
    val db = PlantgotchiApp.db
    val prefs = context.getSharedPreferences("plantgotchi_prefs", Context.MODE_PRIVATE)

    if (enabled) {
        DemoDataLoader.load(userId, db)
        prefs.edit().putBoolean("demo_mode_on", true).apply()
        Analytics.track("demo_data_loaded")
    } else {
        db.plantDao().deleteAllByUser(userId)
        prefs.edit().putBoolean("demo_mode_on", false).apply()
    }
}

object DemoDataLoader {
    private fun timestamp(hoursAgo: Double): String {
        val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        return fmt.format(Date(System.currentTimeMillis() - (hoursAgo * 3_600_000).toLong()))
    }

    suspend fun load(userId: String, db: com.plantgotchi.app.db.AppDatabase) {
    data class DemoPlant(
        val plant: Plant,
        val readings: List<List<Any?>>,
        val careActions: List<String>,
        val recommendations: List<Triple<String, String, String>>,
    )

    val demoPlants = listOf(
        DemoPlant(
            plant = Plant(
                id = UUID.randomUUID().toString(), userId = userId,
                name = "Blue Dream", species = "H\u00edbrido dominante Sativa",
                emoji = "\uD83C\uDF3F",
                moistureMin = 40, moistureMax = 70,
                tempMin = 20.0, tempMax = 30.0,
                lightPreference = "high",
                createdAt = timestamp(720.0),
            ),
            readings = listOf(
                listOf(55, 24.5, 2200, 92, 0.5),
                listOf(52, 24.0, 2100, 93, 6.0),
                listOf(58, 24.8, 2300, 93, 12.0),
                listOf(48, 23.5, 2000, 94, 24.0),
                listOf(60, 25.0, 2400, 95, 48.0),
            ),
            careActions = listOf("water", "fertilize", "prune"),
            recommendations = listOf(
                Triple("sensor", "Blue Dream est\u00e1 prosperando na fase vegetativa! Mantenha o ciclo de luz 18/6. Considere fazer a poda apical em breve para estimular crescimento mais arbustivo.", "info"),
            ),
        ),
        DemoPlant(
            plant = Plant(
                id = UUID.randomUUID().toString(), userId = userId,
                name = "OG Kush", species = "H\u00edbrido dominante Indica",
                emoji = "\uD83C\uDF43",
                moistureMin = 35, moistureMax = 65,
                tempMin = 18.0, tempMax = 28.0,
                lightPreference = "high",
                createdAt = timestamp(480.0),
            ),
            readings = listOf(
                listOf(30, 27.0, 2500, 68, 1.0),
                listOf(38, 26.5, 2300, 69, 8.0),
                listOf(33, 27.5, 2600, 70, 16.0),
                listOf(42, 26.0, 2100, 71, 32.0),
                listOf(28, 27.2, 2400, 72, 56.0),
            ),
            careActions = listOf("water", "water", "fertilize"),
            recommendations = listOf(
                Triple("sensor", "OG Kush est\u00e1 ficando seca! Umidade do solo em 30% (m\u00ednimo: 35%)", "warning"),
                Triple("sensor", "OG Kush mostra leves sinais de estresse t\u00e9rmico a 27\u00B0C. Considere melhorar a circula\u00e7\u00e3o de ar ou levantar a luz alguns cent\u00edmetros.", "warning"),
            ),
        ),
        DemoPlant(
            plant = Plant(
                id = UUID.randomUUID().toString(), userId = userId,
                name = "Girl Scout Cookies", species = "H\u00edbrido",
                emoji = "\uD83C\uDF3A",
                moistureMin = 40, moistureMax = 65,
                tempMin = 20.0, tempMax = 28.0,
                lightPreference = "high",
                createdAt = timestamp(360.0),
            ),
            readings = listOf(
                listOf(45, 23.0, 1900, 85, 2.0),
                listOf(48, 22.5, 1800, 86, 12.0),
                listOf(42, 23.5, 2000, 86, 24.0),
                listOf(50, 22.0, 1750, 87, 48.0),
                listOf(38, 23.8, 2100, 88, 96.0),
            ),
            careActions = listOf("water", "prune"),
            recommendations = listOf(
                Triple("sensor", "GSC est\u00e1 entrando na flora\u00e7\u00e3o. Mude para ciclo de luz 12/12 e aumente o f\u00f3sforo na alimenta\u00e7\u00e3o para buds maiores.", "info"),
            ),
        ),
        DemoPlant(
            plant = Plant(
                id = UUID.randomUUID().toString(), userId = userId,
                name = "Northern Lights", species = "Indica",
                emoji = "\uD83C\uDF1F",
                moistureMin = 35, moistureMax = 60,
                tempMin = 18.0, tempMax = 26.0,
                lightPreference = "medium",
                createdAt = timestamp(1200.0),
            ),
            readings = listOf(
                listOf(40, 22.0, 1600, 95, 3.0),
                listOf(42, 21.5, 1500, 95, 9.0),
                listOf(38, 22.3, 1650, 96, 18.0),
                listOf(45, 21.0, 1400, 96, 36.0),
                listOf(35, 22.5, 1700, 97, 72.0),
            ),
            careActions = listOf("water", "fertilize"),
            recommendations = listOf(
                Triple("sensor", "Northern Lights est\u00e1 perfeita. Essa variedade \u00e9 muito resiliente. Os tricomas est\u00e3o se desenvolvendo bem \u2014 verifique com uma lupa para o momento ideal de colheita.", "info"),
            ),
        ),
        DemoPlant(
            plant = Plant(
                id = UUID.randomUUID().toString(), userId = userId,
                name = "Sour Diesel", species = "Sativa",
                emoji = "\u26FD",
                moistureMin = 40, moistureMax = 70,
                tempMin = 20.0, tempMax = 30.0,
                lightPreference = "high",
                createdAt = timestamp(900.0),
            ),
            readings = listOf(
                listOf(62, 25.0, 2400, 55, 0.25),
                listOf(58, 24.5, 2300, 56, 4.0),
                listOf(65, 25.5, 2500, 57, 10.0),
                listOf(55, 24.0, 2200, 58, 20.0),
                listOf(68, 25.8, 2600, 60, 36.0),
            ),
            careActions = listOf("water", "prune", "fertilize", "prune"),
            recommendations = listOf(
                Triple("sensor", "Bateria do sensor baixa para Sour Diesel (55%) \u2014 carregue em breve", "warning"),
                Triple("sensor", "Sour Diesel est\u00e1 esticando r\u00e1pido! Essa sativa precisa de treinamento agressivo (LST ou SCROG) para manter o dossel uniforme. \u00d3timo desenvolvimento de terpenos.", "info"),
            ),
        ),
        DemoPlant(
            plant = Plant(
                id = UUID.randomUUID().toString(), userId = userId,
                name = "Purple Haze", species = "Sativa",
                emoji = "\uD83D\uDE08",
                moistureMin = 40, moistureMax = 70,
                tempMin = 18.0, tempMax = 28.0,
                lightPreference = "high",
                createdAt = timestamp(1500.0),
            ),
            readings = listOf(
                listOf(50, 21.0, 2000, 80, 4.0),
                listOf(52, 20.5, 1900, 81, 16.0),
                listOf(48, 21.5, 2100, 81, 36.0),
                listOf(55, 20.0, 1800, 82, 72.0),
                listOf(45, 22.0, 2200, 83, 120.0),
            ),
            careActions = listOf("water"),
            recommendations = listOf(
                Triple("sensor", "Purple Haze est\u00e1 mostrando bela colora\u00e7\u00e3o roxa conforme as temperaturas noturnas caem. Mantenha as temps noturnas em torno de 18\u00B0C para realçar a express\u00e3o de antocianina.", "info"),
            ),
        ),
    )

    for (demo in demoPlants) {
        db.plantDao().insert(demo.plant)

        val sensorId = "demo-sensor-${demo.plant.id.take(8)}"
        for (r in demo.readings) {
            db.readingDao().insert(
                SensorReading(
                    plantId = demo.plant.id,
                    sensorId = sensorId,
                    moisture = r[0] as Int,
                    temperature = (r[1] as Number).toDouble(),
                    light = r[2] as Int,
                    battery = r[3] as Int,
                    timestamp = timestamp((r[4] as Number).toDouble()),
                )
            )
        }

        for ((i, action) in demo.careActions.withIndex()) {
            db.careLogDao().insert(
                CareLog(
                    id = UUID.randomUUID().toString(),
                    plantId = demo.plant.id,
                    userId = userId,
                    action = action,
                    createdAt = timestamp((i + 1) * 48.0),
                )
            )
        }

        for ((source, message, severity) in demo.recommendations) {
            db.recommendationDao().insert(
                Recommendation(
                    id = UUID.randomUUID().toString(),
                    plantId = demo.plant.id,
                    source = source,
                    message = message,
                    severity = severity,
                    createdAt = timestamp(Math.random() * 24),
                )
            )
        }
    }
}
}
