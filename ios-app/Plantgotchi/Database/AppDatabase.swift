import Foundation
import GRDB

/// Singleton wrapper around a GRDB `DatabaseQueue`.
/// Provides shared access, migration, and convenience query methods.
final class AppDatabase {

    /// The underlying GRDB database queue.
    let dbQueue: DatabaseQueue

    /// Shared singleton backed by the on-disk database in Application Support.
    static let shared: AppDatabase = {
        do {
            return try makeDefault()
        } catch {
            fatalError("AppDatabase initialization failed: \(error)")
        }
    }()

    /// Create the default on-disk database.
    static func makeDefault() throws -> AppDatabase {
        let fileManager = FileManager.default
        let appSupportURL = try fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        let dbURL = appSupportURL.appendingPathComponent("plantgotchi.sqlite")
        let dbQueue = try DatabaseQueue(path: dbURL.path)
        return try AppDatabase(dbQueue)
    }

    /// Create an in-memory database (useful for tests and previews).
    static func makeEmpty() throws -> AppDatabase {
        let dbQueue = try DatabaseQueue()
        return try AppDatabase(dbQueue)
    }

    private init(_ dbQueue: DatabaseQueue) throws {
        self.dbQueue = dbQueue
        try migrate()
    }

    /// Run all registered migrations.
    private func migrate() throws {
        var migrator = DatabaseMigrator()

        #if DEBUG
        // In debug, wipe DB on schema change for faster iteration.
        migrator.eraseDatabaseOnSchemaChange = true
        #endif

        Schema.registerMigrations(&migrator)
        try migrator.migrate(dbQueue)
    }

    // MARK: - Plant Queries

    /// Fetch all plants for a user, ordered by name.
    func getPlants(userId: String) throws -> [Plant] {
        try dbQueue.read { db in
            try Plant
                .filter(Plant.Columns.userId == userId)
                .order(Plant.Columns.name)
                .fetchAll(db)
        }
    }

    /// Fetch a single plant by ID.
    func getPlant(id: String) throws -> Plant? {
        try dbQueue.read { db in
            try Plant.fetchOne(db, key: id)
        }
    }

    /// Insert or update a plant.
    func savePlant(_ plant: Plant) throws {
        try dbQueue.write { db in
            try plant.save(db)
        }
    }

    /// Delete a plant by ID.
    func deletePlant(id: String) throws {
        try dbQueue.write { db in
            _ = try Plant.deleteOne(db, key: id)
        }
    }

    // MARK: - Sensor Reading Queries

    /// Insert a new sensor reading (ignores duplicate sensor_id+timestamp).
    func addSensorReading(_ reading: SensorReading) throws {
        try dbQueue.write { db in
            var r = reading
            try r.insert(db, onConflict: .ignore)
        }
    }

    /// Fetch the latest reading for a plant.
    func getLatestReading(plantId: String) throws -> SensorReading? {
        try dbQueue.read { db in
            try SensorReading
                .filter(SensorReading.Columns.plantId == plantId)
                .order(SensorReading.Columns.timestamp.desc)
                .fetchOne(db)
        }
    }

    /// Fetch recent readings for a plant within the given number of days.
    func getRecentReadings(plantId: String, days: Int = 7) throws -> [SensorReading] {
        try dbQueue.read { db in
            try SensorReading
                .filter(SensorReading.Columns.plantId == plantId)
                .filter(sql: "timestamp >= datetime('now', ?)", arguments: ["-\(days) days"])
                .order(SensorReading.Columns.timestamp.desc)
                .fetchAll(db)
        }
    }

    // MARK: - Care Log Queries

    /// Insert a care log entry.
    func addCareLog(_ log: CareLog) throws {
        try dbQueue.write { db in
            try log.insert(db)
        }
    }

    /// Fetch care logs for a plant, ordered by most recent first.
    func getCareLogs(plantId: String, limit: Int = 20) throws -> [CareLog] {
        try dbQueue.read { db in
            try CareLog
                .filter(CareLog.Columns.plantId == plantId)
                .order(CareLog.Columns.createdAt.desc)
                .limit(limit)
                .fetchAll(db)
        }
    }

    // MARK: - Recommendation Queries

    /// Insert a recommendation.
    func addRecommendation(_ rec: Recommendation) throws {
        try dbQueue.write { db in
            try rec.insert(db)
        }
    }

    /// Fetch recommendations for a plant, ordered by most recent first.
    func getRecommendations(plantId: String, limit: Int = 10) throws -> [Recommendation] {
        try dbQueue.read { db in
            try Recommendation
                .filter(Recommendation.Columns.plantId == plantId)
                .order(Recommendation.Columns.createdAt.desc)
                .limit(limit)
                .fetchAll(db)
        }
    }

    /// Mark a recommendation as acted on.
    func markRecommendationActedOn(id: String) throws {
        try dbQueue.write { db in
            if var rec = try Recommendation.fetchOne(db, key: id) {
                rec.actedOn = true
                try rec.update(db)
            }
        }
    }
}
