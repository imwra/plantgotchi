import CoreBluetooth

/// GATT UUIDs for the Plantgotchi BLE sensor peripheral.
enum BLEConstants {

    // MARK: - Plantgotchi Sensor Service

    /// Primary service UUID for the Plantgotchi sensor.
    static let sensorServiceUUID = CBUUID(string: "0000FE00-0000-1000-8000-00805F9B34FB")

    /// Soil moisture characteristic — uint16, Read+Notify, percentage 0-100.
    static let moistureCharUUID = CBUUID(string: "0000FE01-0000-1000-8000-00805F9B34FB")

    /// Temperature characteristic — int16, Read+Notify, degrees C x 100.
    static let temperatureCharUUID = CBUUID(string: "0000FE02-0000-1000-8000-00805F9B34FB")

    /// Light characteristic — uint32, Read+Notify, lux.
    static let lightCharUUID = CBUUID(string: "0000FE03-0000-1000-8000-00805F9B34FB")

    /// Battery characteristic — uint8, Read+Notify, percentage 0-100.
    static let batteryCharUUID = CBUUID(string: "0000FE04-0000-1000-8000-00805F9B34FB")

    /// Config characteristic — Read+Write, device configuration.
    static let configCharUUID = CBUUID(string: "0000FE05-0000-1000-8000-00805F9B34FB")

    // MARK: - Standard Device Information Service

    static let deviceInfoServiceUUID = CBUUID(string: "0000180A-0000-1000-8000-00805F9B34FB")

    // MARK: - All sensor characteristic UUIDs for discovery

    static let sensorCharacteristicUUIDs: [CBUUID] = [
        moistureCharUUID,
        temperatureCharUUID,
        lightCharUUID,
        batteryCharUUID,
        configCharUUID,
    ]
}
