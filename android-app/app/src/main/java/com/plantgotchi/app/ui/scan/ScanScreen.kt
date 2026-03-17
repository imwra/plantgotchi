package com.plantgotchi.app.ui.scan

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.BluetoothSearching
import androidx.compose.material.icons.filled.SignalCellular4Bar
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.plantgotchi.app.R
import com.plantgotchi.app.ble.BLEManager
import com.plantgotchi.app.ble.BleState
import com.plantgotchi.app.ble.DiscoveredSensor
import com.plantgotchi.app.ui.theme.Blue
import com.plantgotchi.app.ui.theme.Green
import com.posthog.PostHog

/**
 * BLE scanning screen — discovers Plantgotchi sensors and allows pairing.
 *
 * Handles Android 12+ BLE permission request flow.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScanScreen(
    onBack: () -> Unit = {},
    onSensorPaired: (sensorAddress: String) -> Unit = {},
) {
    val context = LocalContext.current
    val bleManager = remember { BLEManager(context) }

    val state by bleManager.state.collectAsState()
    val discoveredSensors by bleManager.discoveredSensors.collectAsState()

    var permissionsGranted by remember { mutableStateOf(false) }

    // BLE permissions for Android 12+
    val blePermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        arrayOf(
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.ACCESS_FINE_LOCATION,
        )
    } else {
        arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        permissionsGranted = results.values.all { it }
        if (permissionsGranted) {
            bleManager.startScan()
        }
    }

    // Stop scanning when leaving screen
    DisposableEffect(Unit) {
        onDispose {
            bleManager.stopScan()
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.scan_title),
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
                .padding(horizontal = 16.dp),
        ) {
            // Status bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                val statusText = when (state) {
                    BleState.IDLE -> stringResource(R.string.scan_ready)
                    BleState.SCANNING -> stringResource(R.string.scan_scanning)
                    BleState.CONNECTING -> stringResource(R.string.scan_connecting)
                    BleState.CONNECTED -> stringResource(R.string.scan_connected)
                    BleState.DISCONNECTED -> stringResource(R.string.scan_disconnected)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (state == BleState.SCANNING) {
                        CircularProgressIndicator(
                            modifier = Modifier
                                .height(16.dp)
                                .width(16.dp),
                            strokeWidth = 2.dp,
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(
                        text = statusText,
                        style = MaterialTheme.typography.labelLarge,
                    )
                }

                if (state == BleState.SCANNING) {
                    OutlinedButton(onClick = { bleManager.stopScan() }) {
                        Text(stringResource(R.string.scan_stop))
                    }
                } else {
                    Button(
                        onClick = {
                            if (permissionsGranted || bleManager.isBluetoothEnabled()) {
                                bleManager.startScan()
                                PostHog.capture("sensor_scan_started")
                            } else {
                                permissionLauncher.launch(blePermissions)
                            }
                        },
                        enabled = state != BleState.CONNECTING,
                    ) {
                        Icon(
                            imageVector = Icons.Default.BluetoothSearching,
                            contentDescription = null,
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(stringResource(R.string.scan_start))
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (discoveredSensors.isEmpty() && state != BleState.SCANNING) {
                // Empty state
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Bluetooth,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.height(64.dp).width(64.dp),
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = stringResource(R.string.scan_no_sensors),
                            style = MaterialTheme.typography.headlineSmall,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = stringResource(R.string.scan_help),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            } else {
                // Sensor list
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(discoveredSensors, key = { it.address }) { sensor ->
                        SensorRow(
                            sensor = sensor,
                            isConnecting = state == BleState.CONNECTING,
                            onConnect = {
                                bleManager.connectToSensor(sensor.address)
                                onSensorPaired(sensor.address)
                                PostHog.capture("sensor_paired", properties = mapOf(
                                    "sensor_id" to sensor.address,
                                ))
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SensorRow(
    sensor: DiscoveredSensor,
    isConnecting: Boolean,
    onConnect: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        ),
    ) {
        Row(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = sensor.name,
                    style = MaterialTheme.typography.titleSmall,
                )
                Text(
                    text = sensor.address,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.SignalCellular4Bar,
                        contentDescription = stringResource(R.string.scan_signal),
                        modifier = Modifier.height(12.dp).width(12.dp),
                        tint = when {
                            sensor.rssi > -60 -> Green
                            sensor.rssi > -80 -> Blue
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        },
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${sensor.rssi} dBm",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            Button(
                onClick = onConnect,
                enabled = !isConnecting,
            ) {
                Text(stringResource(R.string.scan_pair))
            }
        }
    }
}
