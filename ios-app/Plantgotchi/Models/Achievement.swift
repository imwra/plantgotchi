import Foundation
import GRDB

/// A user achievement record.
struct Achievement: Codable, Identifiable, Equatable {
    var id: String
    var userId: String
    var achievementKey: String
    var points: Int
    var unlockedAt: String?
    var metadata: String?

    init(
        id: String = UUID().uuidString,
        userId: String,
        achievementKey: String,
        points: Int,
        unlockedAt: String? = nil,
        metadata: String? = nil
    ) {
        self.id = id
        self.userId = userId
        self.achievementKey = achievementKey
        self.points = points
        self.unlockedAt = unlockedAt
        self.metadata = metadata
    }
}

// MARK: - GRDB Records

extension Achievement: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "achievements"

    enum Columns: String, ColumnExpression {
        case id
        case userId = "user_id"
        case achievementKey = "achievement_key"
        case points
        case unlockedAt = "unlocked_at"
        case metadata
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case achievementKey = "achievement_key"
        case points
        case unlockedAt = "unlocked_at"
        case metadata
    }
}

// MARK: - Achievement Definitions

/// Known achievements with their point values.
enum AchievementDef: String, CaseIterable {
    case firstSeed     = "first_seed"
    case firstHarvest  = "first_harvest"
    case tenPlants     = "ten_plants"
    case firstTop      = "first_top"
    case firstLST      = "first_lst"
    case speedGrow     = "speed_grow"
    case firstGram     = "first_gram"
    case bigYield100g  = "big_yield_100g"
    case weekStreak    = "week_streak"
    case fiveStrains   = "five_strains"

    var key: String { rawValue }

    var points: Int {
        switch self {
        case .firstSeed:    return 10
        case .firstHarvest: return 50
        case .tenPlants:    return 30
        case .firstTop:     return 20
        case .firstLST:     return 20
        case .speedGrow:    return 100
        case .firstGram:    return 25
        case .bigYield100g: return 75
        case .weekStreak:   return 15
        case .fiveStrains:  return 40
        }
    }

    var label: String {
        switch self {
        case .firstSeed:    return "First Seed"
        case .firstHarvest: return "First Harvest"
        case .tenPlants:    return "Ten Plants"
        case .firstTop:     return "First Top"
        case .firstLST:     return "First LST"
        case .speedGrow:    return "Speed Grow"
        case .firstGram:    return "First Gram"
        case .bigYield100g: return "Big Yield (100g)"
        case .weekStreak:   return "Week Streak"
        case .fiveStrains:  return "Five Strains"
        }
    }
}
