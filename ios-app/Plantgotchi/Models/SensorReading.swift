import Foundation
import GRDB

/// A time-series sensor data point, matching the `sensor_readings` table.
struct SensorReading: Codable, Identifiable, Equatable {
    var id: Int64?
    var plantId: String
    var sensorId: String
    var moisture: Int?
    var temperature: Double?
    var light: Int?
    var battery: Int?
    var timestamp: String?

    init(
        id: Int64? = nil,
        plantId: String,
        sensorId: String,
        moisture: Int? = nil,
        temperature: Double? = nil,
        light: Int? = nil,
        battery: Int? = nil,
        timestamp: String? = nil
    ) {
        self.id = id
        self.plantId = plantId
        self.sensorId = sensorId
        self.moisture = moisture
        self.temperature = temperature
        self.light = light
        self.battery = battery
        self.timestamp = timestamp
    }
}

// MARK: - GRDB Records

extension SensorReading: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "sensor_readings"

    enum Columns: String, ColumnExpression {
        case id
        case plantId = "plant_id"
        case sensorId = "sensor_id"
        case moisture
        case temperature
        case light
        case battery
        case timestamp
    }

    enum CodingKeys: String, CodingKey {
        case id
        case plantId = "plant_id"
        case sensorId = "sensor_id"
        case moisture
        case temperature
        case light
        case battery
        case timestamp
    }

    /// Let GRDB auto-generate the `id` on INSERT.
    mutating func didInsert(_ inserted: InsertionSuccess) {
        id = inserted.rowID
    }
}
