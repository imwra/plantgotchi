package com.plantgotchi.app.ble

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import com.plantgotchi.app.model.SensorReading
import com.welie.blessed.BluetoothCentralManager
import com.welie.blessed.BluetoothCentralManagerCallback
import com.welie.blessed.BluetoothPeripheral
import com.welie.blessed.BluetoothPeripheralCallback
import com.welie.blessed.ConnectionState
import com.welie.blessed.GattStatus
import com.welie.blessed.ScanResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

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
    val peripheral: BluetoothPeripheral,
)

/**
 * Manages BLE connections to Plantgotchi sensors using the BLESSED library.
 *
 * Wraps [BluetoothCentralManager] and exposes reactive [StateFlow]s for
 * connection state, discovered sensors, and the latest sensor reading.
 */
class BLEManager(context: Context) {

    private val _state = MutableStateFlow(BleState.IDLE)
    val state: StateFlow<BleState> = _state.asStateFlow()

    private val _discoveredSensors = MutableStateFlow<List<DiscoveredSensor>>(emptyList())
    val discoveredSensors: StateFlow<List<DiscoveredSensor>> = _discoveredSensors.asStateFlow()

    private val _latestReading = MutableStateFlow<PartialReading?>(null)
    val latestReading: StateFlow<PartialReading?> = _latestReading.asStateFlow()

    private val _connectedPeripheral = MutableStateFlow<BluetoothPeripheral?>(null)
    val connectedPeripheral: StateFlow<BluetoothPeripheral?> = _connectedPeripheral.asStateFlow()

    /** Accumulated partial reading from individual characteristic notifications. */
    data class PartialReading(
        val moisture: Int? = null,
        val temperature: Double? = null,
        val light: Int? = null,
        val battery: Int? = null,
    )

    private val bluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager

    private val centralCallback = object : BluetoothCentralManagerCallback() {
        override fun onDiscovered(peripheral: BluetoothPeripheral, scanResult: ScanResult) {
            val sensor = DiscoveredSensor(
                name = peripheral.name ?: "Unknown Sensor",
                address = peripheral.address,
                rssi = scanResult.rssi,
                peripheral = peripheral,
            )
            val current = _discoveredSensors.value.toMutableList()
            val existingIndex = current.indexOfFirst { it.address == sensor.address }
            if (existingIndex >= 0) {
                current[existingIndex] = sensor
            } else {
                current.add(sensor)
            }
            _discoveredSensors.value = current
        }

        override fun onConnected(peripheral: BluetoothPeripheral) {
            _state.value = BleState.CONNECTED
            _connectedPeripheral.value = peripheral
            // Subscribe to all sensor characteristics
            for (charUuid in BLEConstants.SENSOR_CHARACTERISTICS) {
                peripheral.getCharacteristic(BLEConstants.SERVICE_UUID, charUuid)?.let {
                    peripheral.setNotify(it, true)
                }
            }
        }

        override fun onDisconnected(peripheral: BluetoothPeripheral, status: GattStatus) {
            _state.value = BleState.DISCONNECTED
            _connectedPeripheral.value = null
            _latestReading.value = null
        }

        override fun onConnectionFailed(peripheral: BluetoothPeripheral, status: GattStatus) {
            _state.value = BleState.IDLE
            _connectedPeripheral.value = null
        }
    }

    private val peripheralCallback = object : BluetoothPeripheralCallback() {
        override fun onCharacteristicUpdate(
            peripheral: BluetoothPeripheral,
            value: ByteArray,
            characteristic: android.bluetooth.BluetoothGattCharacteristic,
            status: GattStatus
        ) {
            if (status != GattStatus.SUCCESS) return

            val current = _latestReading.value ?: PartialReading()
            val uuid = characteristic.uuid

            _latestReading.value = when (uuid) {
                BLEConstants.CHAR_MOISTURE ->
                    current.copy(moisture = SensorParser.parseMoisture(value))
                BLEConstants.CHAR_TEMPERATURE ->
                    current.copy(temperature = SensorParser.parseTemperature(value))
                BLEConstants.CHAR_LIGHT ->
                    current.copy(light = SensorParser.parseLight(value))
                BLEConstants.CHAR_BATTERY ->
                    current.copy(battery = SensorParser.parseBattery(value))
                else -> current
            }
        }
    }

    private val centralManager = BluetoothCentralManager(
        context,
        centralCallback,
        android.os.Handler(android.os.Looper.getMainLooper())
    )

    /**
     * Start scanning for Plantgotchi sensors.
     */
    fun startScan() {
        _discoveredSensors.value = emptyList()
        _state.value = BleState.SCANNING
        centralManager.scanForPeripheralsWithServices(arrayOf(BLEConstants.SERVICE_UUID))
    }

    /**
     * Stop scanning for sensors.
     */
    fun stopScan() {
        centralManager.stopScan()
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
        centralManager.connectPeripheral(sensor.peripheral, peripheralCallback)
    }

    /**
     * Connect to a [BluetoothPeripheral] directly.
     */
    fun connectToSensor(peripheral: BluetoothPeripheral) {
        stopScan()
        _state.value = BleState.CONNECTING
        centralManager.connectPeripheral(peripheral, peripheralCallback)
    }

    /**
     * Disconnect the current peripheral.
     */
    fun disconnect() {
        _connectedPeripheral.value?.let {
            centralManager.cancelConnection(it)
        }
    }

    /**
     * Check if Bluetooth is enabled on the device.
     */
    fun isBluetoothEnabled(): Boolean {
        return bluetoothManager.adapter?.isEnabled == true
    }
}
