package com.plantgotchi.app.ble

import android.bluetooth.BluetoothManager
import android.content.Context
import com.posthog.PostHog
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * BLE connection state.
 */
enum class BleState {
    IDLE,
    SCANNING,
    CONNECTING,
    CONNECTED,
    DISCONNECTED,
}

/**
 * Represents a discovered BLE sensor before pairing.
 */
data class DiscoveredSensor(
    val name: String,
    val address: String,
    val rssi: Int,
)

/**
 * Manages BLE connections to Plantgotchi sensors.
 *
 * Uses Android's native BLE APIs. Exposes reactive [StateFlow]s for
 * connection state, discovered sensors, and the latest sensor reading.
 *
 * Note: BLE scanning/connecting requires a real device — this will not
 * function in the emulator.
 */
class BLEManager(private val context: Context) {

    private val _state = MutableStateFlow(BleState.IDLE)
    val state: StateFlow<BleState> = _state.asStateFlow()

    private val _discoveredSensors = MutableStateFlow<List<DiscoveredSensor>>(emptyList())
    val discoveredSensors: StateFlow<List<DiscoveredSensor>> = _discoveredSensors.asStateFlow()

    private val _latestReading = MutableStateFlow<PartialReading?>(null)
    val latestReading: StateFlow<PartialReading?> = _latestReading.asStateFlow()

    /** Accumulated partial reading from individual characteristic notifications. */
    data class PartialReading(
        val moisture: Int? = null,
        val temperature: Double? = null,
        val light: Int? = null,
        val battery: Int? = null,
    )

    private val bluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager

    /**
     * Start scanning for Plantgotchi sensors.
     */
    fun startScan() {
        _discoveredSensors.value = emptyList()
        _state.value = BleState.SCANNING
        // BLE scanning via BLESSED library — requires real device
        // TODO: Integrate BLESSED library once API version is stabilized
    }

    /**
     * Stop scanning for sensors.
     */
    fun stopScan() {
        if (_state.value == BleState.SCANNING) {
            _state.value = BleState.IDLE
        }
    }

    /**
     * Connect to a discovered sensor by its BLE address.
     */
    fun connectToSensor(address: String) {
        val sensor = _discoveredSensors.value.find { it.address == address } ?: return
        stopScan()
        _state.value = BleState.CONNECTING
        PostHog.capture("sensor_connect_attempt", properties = mapOf(
            "sensor_id" to address,
        ))
    }

    /**
     * Disconnect the current peripheral.
     */
    fun disconnect() {
        _state.value = BleState.DISCONNECTED
        _latestReading.value = null
    }

    /**
     * Check if Bluetooth is enabled on the device.
     */
    fun isBluetoothEnabled(): Boolean {
        return bluetoothManager.adapter?.isEnabled == true
    }
}
