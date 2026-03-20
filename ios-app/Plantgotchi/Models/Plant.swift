import Foundation
import GRDB

// MARK: - Plant-Related Enums

/// Photoperiod vs autoflower.
enum PlantType: String, Codable, Equatable {
    case photo = "photo"
    case auto  = "auto"
}

/// Strain lineage.
enum StrainType: String, Codable, Equatable {
    case indica = "indica"
    case sativa = "sativa"
    case hybrid = "hybrid"
}

/// Indoor vs outdoor grow.
enum GrowEnvironment: String, Codable, Equatable {
    case indoor  = "indoor"
    case outdoor = "outdoor"
}

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

    // Cannabis lifecycle fields (all optional for backward compat)
    var plantType: PlantType?
    var strainId: String?
    var strainName: String?
    var strainType: StrainType?
    var environment: GrowEnvironment?
    var currentPhase: Phase?
    var phaseStartedAt: String?
    var growId: String?

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
        updatedAt: String? = nil,
        plantType: PlantType? = nil,
        strainId: String? = nil,
        strainName: String? = nil,
        strainType: StrainType? = nil,
        environment: GrowEnvironment? = nil,
        currentPhase: Phase? = nil,
        phaseStartedAt: String? = nil,
        growId: String? = nil
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
        self.plantType = plantType
        self.strainId = strainId
        self.strainName = strainName
        self.strainType = strainType
        self.environment = environment
        self.currentPhase = currentPhase
        self.phaseStartedAt = phaseStartedAt
        self.growId = growId
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
        case plantType = "plant_type"
        case strainId = "strain_id"
        case strainName = "strain_name"
        case strainType = "strain_type"
        case environment
        case currentPhase = "current_phase"
        case phaseStartedAt = "phase_started_at"
        case growId = "grow_id"
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
        case plantType = "plant_type"
        case strainId = "strain_id"
        case strainName = "strain_name"
        case strainType = "strain_type"
        case environment
        case currentPhase = "current_phase"
        case phaseStartedAt = "phase_started_at"
        case growId = "grow_id"
    }
}
