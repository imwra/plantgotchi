import Foundation
import GRDB

/// A cannabis strain with growing metadata.
struct StrainProfile: Codable, Identifiable, Equatable {
    var id: String
    var name: String
    var type: StrainType?
    var flowerWeeksMin: Int?
    var flowerWeeksMax: Int?
    var difficulty: String?
    var thresholdsByPhase: String?
    var notes: String?
    var isCustom: Bool
    var userId: String?
    var createdAt: String?

    init(
        id: String = UUID().uuidString,
        name: String,
        type: StrainType? = nil,
        flowerWeeksMin: Int? = nil,
        flowerWeeksMax: Int? = nil,
        difficulty: String? = nil,
        thresholdsByPhase: String? = nil,
        notes: String? = nil,
        isCustom: Bool = false,
        userId: String? = nil,
        createdAt: String? = nil
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.flowerWeeksMin = flowerWeeksMin
        self.flowerWeeksMax = flowerWeeksMax
        self.difficulty = difficulty
        self.thresholdsByPhase = thresholdsByPhase
        self.notes = notes
        self.isCustom = isCustom
        self.userId = userId
        self.createdAt = createdAt
    }
}

// MARK: - GRDB Records

extension StrainProfile: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "strain_profiles"

    enum Columns: String, ColumnExpression {
        case id
        case name
        case type
        case flowerWeeksMin = "flower_weeks_min"
        case flowerWeeksMax = "flower_weeks_max"
        case difficulty
        case thresholdsByPhase = "thresholds_by_phase"
        case notes
        case isCustom = "is_custom"
        case userId = "user_id"
        case createdAt = "created_at"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case type
        case flowerWeeksMin = "flower_weeks_min"
        case flowerWeeksMax = "flower_weeks_max"
        case difficulty
        case thresholdsByPhase = "thresholds_by_phase"
        case notes
        case isCustom = "is_custom"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}
