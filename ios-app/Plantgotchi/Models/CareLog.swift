import Foundation
import GRDB

/// A care event logged by the user, matching the `care_logs` table.
struct CareLog: Codable, Identifiable, Equatable {
    var id: String
    var plantId: String
    var userId: String
    var action: String
    var notes: String?
    var createdAt: String?

    init(
        id: String = UUID().uuidString,
        plantId: String,
        userId: String,
        action: String,
        notes: String? = nil,
        createdAt: String? = nil
    ) {
        self.id = id
        self.plantId = plantId
        self.userId = userId
        self.action = action
        self.notes = notes
        self.createdAt = createdAt
    }
}

// MARK: - GRDB Records

extension CareLog: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "care_logs"

    enum Columns: String, ColumnExpression {
        case id
        case plantId = "plant_id"
        case userId = "user_id"
        case action
        case notes
        case createdAt = "created_at"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case plantId = "plant_id"
        case userId = "user_id"
        case action
        case notes
        case createdAt = "created_at"
    }
}
