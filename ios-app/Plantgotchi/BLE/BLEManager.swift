import Foundation
import CoreBluetooth
import Combine

/// Represents a discovered BLE sensor before pairing.
struct DiscoveredSensor: Identifiable, Equatable {
    let id: UUID              // CBPeripheral identifier
    let name: String
    let rssi: Int
    let peripheral: CBPeripheral

    static func == (lhs: DiscoveredSensor, rhs: DiscoveredSensor) -> Bool {
        lhs.id == rhs.id
    }
}

/// Connection state of the BLE manager.
enum BLEState: Equatable {
    case idle
    case scanning
    case connecting(UUID)
    case connected(UUID)
    case unauthorized
    case poweredOff
}

/// Manages CoreBluetooth interactions: scanning for Plantgotchi sensors,
/// connecting, subscribing to notifications, and parsing incoming data.
final class BLEManager: NSObject, ObservableObject {

    // MARK: - Published State

    @Published var state: BLEState = .idle
    @Published var discoveredSensors: [DiscoveredSensor] = []
    @Published var connectedSensorName: String?
    @Published var latestMoisture: Int?
    @Published var latestTemperature: Double?
    @Published var latestLight: Int?
    @Published var latestBattery: Int?

    // MARK: - Callbacks

    /// Called when a complete set of readings is available. Consumers (e.g. views or agents)
    /// can subscribe to handle new data.
    var onReadingReceived: ((Int?, Double?, Int?, Int?) -> Void)?

    // MARK: - Private

    private var centralManager: CBCentralManager!
    private var connectedPeripheral: CBPeripheral?
    private var discoveredPeripherals: [UUID: CBPeripheral] = [:]
    private var lastReadingEventTime: [String: Date] = [:]

    override init() {
        super.init()
        centralManager = CBCentralManager(
            delegate: self,
            queue: nil,
            options: [CBCentralManagerOptionRestoreIdentifierKey: "com.plantgotchi.ble"]
        )
    }

    // MARK: - Public API

    /// Start scanning for Plantgotchi sensor peripherals.
    func startScan() {
        guard centralManager.state == .poweredOn else { return }
        discoveredSensors = []
        state = .scanning
        centralManager.scanForPeripherals(
            withServices: [BLEConstants.sensorServiceUUID],
            options: [CBCentralManagerScanOptionAllowDuplicatesKey: false]
        )
    }

    /// Stop scanning.
    func stopScan() {
        centralManager.stopScan()
        if case .scanning = state {
            state = .idle
        }
    }

    /// Connect to a discovered sensor peripheral.
    func connect(to sensor: DiscoveredSensor) {
        stopScan()
        state = .connecting(sensor.id)
        let peripheral = sensor.peripheral
        discoveredPeripherals[sensor.id] = peripheral
        centralManager.connect(peripheral, options: nil)
    }

    /// Disconnect from the currently connected peripheral.
    func disconnect() {
        if let peripheral = connectedPeripheral {
            centralManager.cancelPeripheralConnection(peripheral)
        }
        resetConnectionState()
    }

    /// The sensor ID string derived from the connected peripheral's UUID.
    var connectedSensorId: String? {
        connectedPeripheral?.identifier.uuidString
    }

    // MARK: - Helpers

    private func resetConnectionState() {
        connectedPeripheral = nil
        connectedSensorName = nil
        latestMoisture = nil
        latestTemperature = nil
        latestLight = nil
        latestBattery = nil
        state = .idle
    }
}

// MARK: - CBCentralManagerDelegate

extension BLEManager: CBCentralManagerDelegate {

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        switch central.state {
        case .poweredOn:
            state = .idle
        case .poweredOff:
            state = .poweredOff
        case .unauthorized:
            state = .unauthorized
        default:
            state = .idle
        }
    }

    func centralManager(
        _ central: CBCentralManager,
        didDiscover peripheral: CBPeripheral,
        advertisementData: [String: Any],
        rssi RSSI: NSNumber
    ) {
        let name = peripheral.name ?? advertisementData[CBAdvertisementDataLocalNameKey] as? String ?? "Unknown Sensor"
        let sensor = DiscoveredSensor(
            id: peripheral.identifier,
            name: name,
            rssi: RSSI.intValue,
            peripheral: peripheral
        )

        discoveredPeripherals[peripheral.identifier] = peripheral

        if let index = discoveredSensors.firstIndex(where: { $0.id == sensor.id }) {
            discoveredSensors[index] = sensor
        } else {
            discoveredSensors.append(sensor)
        }
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        connectedPeripheral = peripheral
        connectedSensorName = peripheral.name
        state = .connected(peripheral.identifier)
        peripheral.delegate = self
        peripheral.discoverServices([BLEConstants.sensorServiceUUID])
        Analytics.track("sensor_paired", properties: ["sensor_id": peripheral.identifier.uuidString])
    }

    func centralManager(
        _ central: CBCentralManager,
        didFailToConnect peripheral: CBPeripheral,
        error: Error?
    ) {
        resetConnectionState()
    }

    func centralManager(
        _ central: CBCentralManager,
        didDisconnectPeripheral peripheral: CBPeripheral,
        error: Error?
    ) {
        Analytics.track("sensor_disconnected", properties: ["sensor_id": peripheral.identifier.uuidString])
        resetConnectionState()
    }

    /// State restoration handler for background BLE.
    func centralManager(
        _ central: CBCentralManager,
        willRestoreState dict: [String: Any]
    ) {
        if let peripherals = dict[CBCentralManagerRestoredStatePeripheralsKey] as? [CBPeripheral] {
            for peripheral in peripherals {
                discoveredPeripherals[peripheral.identifier] = peripheral
                if peripheral.state == .connected {
                    connectedPeripheral = peripheral
                    connectedSensorName = peripheral.name
                    state = .connected(peripheral.identifier)
                    peripheral.delegate = self
                    peripheral.discoverServices([BLEConstants.sensorServiceUUID])
                }
            }
        }
    }
}

// MARK: - CBPeripheralDelegate

extension BLEManager: CBPeripheralDelegate {

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard let services = peripheral.services else { return }
        for service in services {
            if service.uuid == BLEConstants.sensorServiceUUID {
                peripheral.discoverCharacteristics(
                    BLEConstants.sensorCharacteristicUUIDs,
                    for: service
                )
            }
        }
    }

    func peripheral(
        _ peripheral: CBPeripheral,
        didDiscoverCharacteristicsFor service: CBService,
        error: Error?
    ) {
        guard let characteristics = service.characteristics else { return }
        for characteristic in characteristics {
            // Read initial value
            peripheral.readValue(for: characteristic)
            // Subscribe to notifications if supported
            if characteristic.properties.contains(.notify) {
                peripheral.setNotifyValue(true, for: characteristic)
            }
        }
    }

    func peripheral(
        _ peripheral: CBPeripheral,
        didUpdateValueFor characteristic: CBCharacteristic,
        error: Error?
    ) {
        guard let data = characteristic.value, error == nil else { return }

        switch characteristic.uuid {
        case BLEConstants.moistureCharUUID:
            latestMoisture = SensorParser.parseMoisture(data)
        case BLEConstants.temperatureCharUUID:
            latestTemperature = SensorParser.parseTemperature(data)
        case BLEConstants.lightCharUUID:
            latestLight = SensorParser.parseLight(data)
        case BLEConstants.batteryCharUUID:
            latestBattery = SensorParser.parseBattery(data)
        default:
            break
        }

        // Notify callback with current values
        onReadingReceived?(latestMoisture, latestTemperature, latestLight, latestBattery)

        let sensorId = peripheral.identifier.uuidString
        let now = Date()
        if let last = lastReadingEventTime[sensorId], now.timeIntervalSince(last) < 60 {
            // Rate limited — skip analytics event
        } else {
            lastReadingEventTime[sensorId] = now
            Analytics.track("sensor_reading_received", properties: [
                "sensor_id": sensorId,
                "battery": latestBattery as Any,
                "moisture": latestMoisture as Any,
            ])
        }
    }
}
