public struct PlantScopeInput: Codable, Equatable {
    public let id: String
    public let name: String
    public let moistureScore: Double?
    public let temperatureScore: Double?
    public let lightScore: Double?
    public let freshnessScore: Double
    public let currentPhase: String?
    public let strainName: String?
    public let environment: String?

    public init(
        id: String,
        name: String,
        moistureScore: Double?,
        temperatureScore: Double?,
        lightScore: Double?,
        freshnessScore: Double,
        currentPhase: String? = nil,
        strainName: String? = nil,
        environment: String? = nil
    ) {
        self.id = id
        self.name = name
        self.moistureScore = moistureScore
        self.temperatureScore = temperatureScore
        self.lightScore = lightScore
        self.freshnessScore = freshnessScore
        self.currentPhase = currentPhase
        self.strainName = strainName
        self.environment = environment
    }
}

public enum AttentionState: String, Codable, Equatable {
    case healthy
    case needsAttention
    case unknown
}

public struct PlantScope: Codable, Equatable, Identifiable {
    public let id: String
    public let name: String
    public let vitality: GardenSnapshot.VitalityLevel
    public let attentionState: AttentionState
    public let currentPhase: String?
    public let strainName: String?
    public let environment: String?

    public init(
        id: String,
        name: String,
        vitality: GardenSnapshot.VitalityLevel,
        attentionState: AttentionState,
        currentPhase: String? = nil,
        strainName: String? = nil,
        environment: String? = nil
    ) {
        self.id = id
        self.name = name
        self.vitality = vitality
        self.attentionState = attentionState
        self.currentPhase = currentPhase
        self.strainName = strainName
        self.environment = environment
    }
}

public struct SubsetScope: Codable, Equatable, Identifiable {
    public let id: String
    public let name: String
    public let vitality: GardenSnapshot.VitalityLevel
    public let attentionCount: Int
    public let unknownCount: Int
    public let plantIDs: [String]

    public init(
        id: String,
        name: String,
        vitality: GardenSnapshot.VitalityLevel,
        attentionCount: Int,
        unknownCount: Int,
        plantIDs: [String]
    ) {
        self.id = id
        self.name = name
        self.vitality = vitality
        self.attentionCount = attentionCount
        self.unknownCount = unknownCount
        self.plantIDs = plantIDs
    }
}
