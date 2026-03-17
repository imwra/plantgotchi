public struct PlantScopeInput: Equatable {
    public let id: String
    public let name: String
    public let moistureScore: Double?
    public let temperatureScore: Double?
    public let lightScore: Double?
    public let freshnessScore: Double

    public init(
        id: String,
        name: String,
        moistureScore: Double?,
        temperatureScore: Double?,
        lightScore: Double?,
        freshnessScore: Double
    ) {
        self.id = id
        self.name = name
        self.moistureScore = moistureScore
        self.temperatureScore = temperatureScore
        self.lightScore = lightScore
        self.freshnessScore = freshnessScore
    }
}

public enum AttentionState: Equatable {
    case healthy
    case needsAttention
    case unknown
}

public struct PlantScope: Equatable, Identifiable {
    public let id: String
    public let name: String
    public let vitality: GardenSnapshot.VitalityLevel
    public let attentionState: AttentionState

    public init(
        id: String,
        name: String,
        vitality: GardenSnapshot.VitalityLevel,
        attentionState: AttentionState
    ) {
        self.id = id
        self.name = name
        self.vitality = vitality
        self.attentionState = attentionState
    }
}

public struct SubsetScope: Equatable, Identifiable {
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
