import Foundation
import GRDB

/// An AI or rule-engine recommendation, matching the `recommendations` table.
struct Recommendation: Codable, Identifiable, Equatable {
    var id: String
    var plantId: String
    var source: String          // "rules" | "claude"
    var message: String
    var severity: String        // "info" | "warning" | "urgent"
    var actedOn: Bool
    var createdAt: String?

    init(
        id: String = UUID().uuidString,
        plantId: String,
        source: String,
        message: String,
        severity: String = "info",
        actedOn: Bool = false,
        createdAt: String? = nil
    ) {
        self.id = id
        self.plantId = plantId
        self.source = source
        self.message = message
        self.severity = severity
        self.actedOn = actedOn
        self.createdAt = createdAt
    }
}

// MARK: - GRDB Records

extension Recommendation: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "recommendations"

    enum Columns: String, ColumnExpression {
        case id
        case plantId = "plant_id"
        case source
        case message
        case severity
        case actedOn = "acted_on"
        case createdAt = "created_at"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case plantId = "plant_id"
        case source
        case message
        case severity
        case actedOn = "acted_on"
        case createdAt = "created_at"
    }

    /// GRDB stores Bool as INTEGER 0/1, matching the SQL schema `acted_on INTEGER DEFAULT 0`.
}
