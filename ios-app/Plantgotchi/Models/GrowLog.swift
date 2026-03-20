import Foundation
import GRDB

/// A timestamped log entry for a plant during a grow.
struct GrowLog: Codable, Identifiable, Equatable {
    var id: String
    var plantId: String
    var userId: String
    var phase: Phase
    var logType: GrowLogType
    var data: String?
    var photoUrl: String?
    var notes: String?
    var createdAt: String?

    init(
        id: String = UUID().uuidString,
        plantId: String,
        userId: String,
        phase: Phase,
        logType: GrowLogType,
        data: String? = nil,
        photoUrl: String? = nil,
        notes: String? = nil,
        createdAt: String? = nil
    ) {
        self.id = id
        self.plantId = plantId
        self.userId = userId
        self.phase = phase
        self.logType = logType
        self.data = data
        self.photoUrl = photoUrl
        self.notes = notes
        self.createdAt = createdAt
    }
}

// MARK: - GRDB Records

extension GrowLog: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "grow_logs"

    enum Columns: String, ColumnExpression {
        case id
        case plantId = "plant_id"
        case userId = "user_id"
        case phase
        case logType = "log_type"
        case data
        case photoUrl = "photo_url"
        case notes
        case createdAt = "created_at"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case plantId = "plant_id"
        case userId = "user_id"
        case phase
        case logType = "log_type"
        case data
        case photoUrl = "photo_url"
        case notes
        case createdAt = "created_at"
    }
}
