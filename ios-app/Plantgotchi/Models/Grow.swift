import Foundation
import GRDB

/// A grow session grouping one or more plants.
struct Grow: Codable, Identifiable, Equatable {
    var id: String
    var userId: String
    var name: String
    var environment: GrowEnvironment?
    var startDate: String?
    var endDate: String?
    var notes: String?
    var status: String
    var createdAt: String?
    var updatedAt: String?

    init(
        id: String = UUID().uuidString,
        userId: String,
        name: String,
        environment: GrowEnvironment? = nil,
        startDate: String? = nil,
        endDate: String? = nil,
        notes: String? = nil,
        status: String = "active",
        createdAt: String? = nil,
        updatedAt: String? = nil
    ) {
        self.id = id
        self.userId = userId
        self.name = name
        self.environment = environment
        self.startDate = startDate
        self.endDate = endDate
        self.notes = notes
        self.status = status
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - GRDB Records

extension Grow: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "grows"

    enum Columns: String, ColumnExpression {
        case id
        case userId = "user_id"
        case name
        case environment
        case startDate = "start_date"
        case endDate = "end_date"
        case notes
        case status
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case environment
        case startDate = "start_date"
        case endDate = "end_date"
        case notes
        case status
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
