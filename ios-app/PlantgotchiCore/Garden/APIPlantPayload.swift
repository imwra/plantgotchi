public struct APIPlantPayload: Codable, Equatable {
    public let plant: APIPlant
    public let latestReading: APILatestReading?
    public let recentCareLogs: [APICareLog]

    public init(plant: APIPlant, latestReading: APILatestReading?, recentCareLogs: [APICareLog]) {
        self.plant = plant
        self.latestReading = latestReading
        self.recentCareLogs = recentCareLogs
    }
}

public struct APIPlant: Codable, Equatable {
    public let id: String
    public let userID: String
    public let name: String
    public let species: String?
    public let emoji: String
    public let moistureMin: Double
    public let moistureMax: Double
    public let tempMin: Double
    public let tempMax: Double
    public let lightPreference: String

    enum CodingKeys: String, CodingKey {
        case id
        case userID = "user_id"
        case name
        case species
        case emoji
        case moistureMin = "moisture_min"
        case moistureMax = "moisture_max"
        case tempMin = "temp_min"
        case tempMax = "temp_max"
        case lightPreference = "light_preference"
    }

    public init(
        id: String,
        userID: String,
        name: String,
        species: String?,
        emoji: String,
        moistureMin: Double,
        moistureMax: Double,
        tempMin: Double,
        tempMax: Double,
        lightPreference: String
    ) {
        self.id = id
        self.userID = userID
        self.name = name
        self.species = species
        self.emoji = emoji
        self.moistureMin = moistureMin
        self.moistureMax = moistureMax
        self.tempMin = tempMin
        self.tempMax = tempMax
        self.lightPreference = lightPreference
    }
}

public struct APILatestReading: Codable, Equatable {
    public let moisture: Double?
    public let temperature: Double?
    public let light: Double?
    public let timestamp: String

    public init(moisture: Double?, temperature: Double?, light: Double?, timestamp: String) {
        self.moisture = moisture
        self.temperature = temperature
        self.light = light
        self.timestamp = timestamp
    }
}

public struct APICareLog: Codable, Equatable {
    public let id: String
    public let action: String
    public let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case action
        case createdAt = "created_at"
    }

    public init(id: String, action: String, createdAt: String) {
        self.id = id
        self.action = action
        self.createdAt = createdAt
    }
}
