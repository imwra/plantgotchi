import Foundation
import GRDB

/// A plant owned by a user, matching the `plants` table in the web schema.
struct Plant: Codable, Identifiable, Equatable {
    var id: String
    var userId: String
    var name: String
    var species: String?
    var emoji: String
    var photoUrl: String?
    var moistureMin: Int
    var moistureMax: Int
    var tempMin: Double
    var tempMax: Double
    var lightPreference: String
    var createdAt: String?
    var updatedAt: String?

    /// Create a new plant with defaults matching the SQL schema.
    init(
        id: String = UUID().uuidString,
        userId: String,
        name: String,
        species: String? = nil,
        emoji: String = "\u{1F331}",
        photoUrl: String? = nil,
        moistureMin: Int = 30,
        moistureMax: Int = 80,
        tempMin: Double = 15.0,
        tempMax: Double = 30.0,
        lightPreference: String = "medium",
        createdAt: String? = nil,
        updatedAt: String? = nil
    ) {
        self.id = id
        self.userId = userId
        self.name = name
        self.species = species
        self.emoji = emoji
        self.photoUrl = photoUrl
        self.moistureMin = moistureMin
        self.moistureMax = moistureMax
        self.tempMin = tempMin
        self.tempMax = tempMax
        self.lightPreference = lightPreference
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - GRDB TableRecord + FetchableRecord + PersistableRecord

extension Plant: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "plants"

    /// Map Swift camelCase properties to SQL snake_case columns.
    enum Columns: String, ColumnExpression {
        case id
        case userId = "user_id"
        case name
        case species
        case emoji
        case photoUrl = "photo_url"
        case moistureMin = "moisture_min"
        case moistureMax = "moisture_max"
        case tempMin = "temp_min"
        case tempMax = "temp_max"
        case lightPreference = "light_preference"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case species
        case emoji
        case photoUrl = "photo_url"
        case moistureMin = "moisture_min"
        case moistureMax = "moisture_max"
        case tempMin = "temp_min"
        case tempMax = "temp_max"
        case lightPreference = "light_preference"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
