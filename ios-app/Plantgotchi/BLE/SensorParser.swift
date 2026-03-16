import Foundation

/// Parses raw BLE characteristic `Data` into typed sensor values.
/// The ESP32 sensor sends integer-encoded values (no floats over BLE).
enum SensorParser {

    /// Parse moisture from uint16 little-endian data. Returns percentage 0-100.
    static func parseMoisture(_ data: Data) -> Int? {
        guard data.count >= 2 else { return nil }
        let value = data.withUnsafeBytes { $0.load(as: UInt16.self) }
        let moisture = Int(UInt16(littleEndian: value))
        guard moisture >= 0, moisture <= 100 else { return nil }
        return moisture
    }

    /// Parse temperature from int16 little-endian data. Value is degrees C x 100.
    /// Returns temperature in degrees Celsius as a Double.
    static func parseTemperature(_ data: Data) -> Double? {
        guard data.count >= 2 else { return nil }
        let value = data.withUnsafeBytes { $0.load(as: Int16.self) }
        let raw = Int16(littleEndian: value)
        return Double(raw) / 100.0
    }

    /// Parse light from uint32 little-endian data. Returns lux value.
    static func parseLight(_ data: Data) -> Int? {
        guard data.count >= 4 else { return nil }
        let value = data.withUnsafeBytes { $0.load(as: UInt32.self) }
        return Int(UInt32(littleEndian: value))
    }

    /// Parse battery from uint8 data. Returns percentage 0-100.
    static func parseBattery(_ data: Data) -> Int? {
        guard data.count >= 1 else { return nil }
        let value = Int(data[0])
        guard value >= 0, value <= 100 else { return nil }
        return value
    }
}
