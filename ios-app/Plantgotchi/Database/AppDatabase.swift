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

    /// Delete all data for a user.
    func clearAllData(userId: String) throws {
        try dbQueue.write { db in
            let plants = try Plant.filter(Plant.Columns.userId == userId).fetchAll(db)
            for plant in plants {
                try SensorReading.filter(SensorReading.Columns.plantId == plant.id).deleteAll(db)
                try CareLog.filter(CareLog.Columns.plantId == plant.id).deleteAll(db)
                try Recommendation.filter(Recommendation.Columns.plantId == plant.id).deleteAll(db)
            }
            try Plant.filter(Plant.Columns.userId == userId).deleteAll(db)
        }
    }

    // MARK: - Demo Data

    /// Seed the database with realistic sample data for demo/preview purposes.
    func loadDemoData(userId: String) throws {
        let now = Date()
        let fmt = ISO8601DateFormatter()
        fmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        func ts(_ hoursAgo: Double) -> String {
            fmt.string(from: now.addingTimeInterval(-hoursAgo * 3600))
        }

        let isPt = LocaleManager.shared.locale == .ptBR

        let plants: [(Plant, [(Int?, Double?, Int?, Int?, Double)], [String], [(String, String, String)])] = [
            (
                Plant(userId: userId, name: "Northern Lights", species: "Indica", emoji: "\u{1F33F}",
                      moistureMin: 40, moistureMax: 70, tempMin: 20, tempMax: 28, lightPreference: "high",
                      createdAt: ts(720)),
                [(55, 24.5, 2200, 87, 0.5), (58, 24.0, 2100, 88, 6), (52, 24.8, 2300, 89, 12),
                 (60, 23.5, 2150, 90, 24), (48, 25.0, 2250, 91, 48)],
                ["water", "fertilize"],
                [("ai", isPt
                    ? "Northern Lights esta no final da fase vegetativa e com otima saude. A producao de tricomas esta comecando \u{2014} considere mudar para o ciclo de luz 12/12 em breve para iniciar a floracao."
                    : "Northern Lights is in late veg stage and looking healthy. Trichome production is starting \u{2014} consider switching to 12/12 light cycle soon to trigger flowering.", "info")]
            ),
            (
                Plant(userId: userId, name: "Blue Dream",
                      species: isPt ? "Hibrida (Sativa dominante)" : "Hybrid (Sativa-dominant)",
                      emoji: "\u{1F33B}",
                      moistureMin: 35, moistureMax: 65, tempMin: 21, tempMax: 30, lightPreference: "high",
                      createdAt: ts(480)),
                [(38, 27.5, 2400, 72, 1), (42, 26.0, 2300, 73, 8), (35, 28.0, 2500, 74, 16),
                 (45, 26.5, 2200, 75, 32), (32, 27.0, 2350, 76, 56)],
                ["water", "water", "prune"],
                [("sensor", isPt
                    ? "Blue Dream esta com pouca agua! Umidade do solo em 38% (minimo: 35%)"
                    : "Blue Dream is getting low on water! Soil moisture at 38% (minimum: 35%)", "warning"),
                 ("ai", isPt
                    ? "Blue Dream esta esticando bem. A genetica sativa faz com que ela cresca bastante \u{2014} considere fazer topping ou LST (treinamento de baixo estresse) para controlar a altura e melhorar a penetracao de luz."
                    : "Blue Dream is stretching nicely. The sativa genetics mean she'll keep growing tall \u{2014} consider topping or LST (low stress training) to manage canopy height and improve light penetration.", "info")]
            ),
            (
                Plant(userId: userId, name: "OG Kush",
                      species: isPt ? "Hibrida (Indica dominante)" : "Indica-dominant Hybrid",
                      emoji: "\u{1FAB4}",
                      moistureMin: 35, moistureMax: 60, tempMin: 20, tempMax: 28, lightPreference: "high",
                      createdAt: ts(1200)),
                [(50, 25.0, 2100, 95, 2), (48, 24.5, 2000, 95, 12), (52, 25.2, 2050, 96, 24),
                 (45, 24.0, 1900, 96, 48), (55, 25.5, 2200, 97, 96)],
                ["water", "fertilize"],
                [("ai", isPt
                    ? "OG Kush esta no inicio da floracao (semana 2). Niveis de fosforo e potassio parecem bons pela cor das folhas. Mantenha a umidade abaixo de 50% para evitar mofo nos buds."
                    : "OG Kush is in early flower (week 2). Phosphorus and potassium levels look good based on leaf color. Keep humidity below 50% to prevent bud rot as flowers develop.", "info")]
            ),
            (
                Plant(userId: userId, name: "Gorilla Glue",
                      species: isPt ? "Hibrida" : "Hybrid",
                      emoji: "\u{1F33F}",
                      moistureMin: 35, moistureMax: 65, tempMin: 20, tempMax: 29, lightPreference: "high",
                      createdAt: ts(360)),
                [(25, 22.5, 1800, 45, 0.25), (30, 23.0, 1700, 46, 4), (28, 22.8, 1600, 47, 10),
                 (40, 23.5, 1850, 48, 20), (50, 24.0, 1900, 50, 36)],
                ["water", "prune", "fertilize"],
                [("sensor", isPt
                    ? "Gorilla Glue precisa de agua! Umidade do solo em 25% (minimo: 35%)"
                    : "Gorilla Glue needs water! Soil moisture at 25% (minimum: 35%)", "urgent"),
                 ("sensor", isPt
                    ? "Bateria do sensor baixa para Gorilla Glue (45%) \u{2014} recarregue em breve"
                    : "Sensor battery low for Gorilla Glue (45%) \u{2014} charge soon", "warning"),
                 ("ai", isPt
                    ? "Gorilla Glue esta mostrando sinais de falta de agua \u{2014} as folhas inferiores estao caidas. Regue bem ate ver 10-20% de escoamento. Ela consome bastante nutrientes, entao aumente levemente a concentracao da solucao."
                    : "Gorilla Glue is showing signs of underwatering \u{2014} lower fan leaves are drooping. Water thoroughly until you see 10-20% runoff. She's a heavy feeder, so increase nutrient solution strength slightly.", "warning")]
            ),
            (
                Plant(userId: userId, name: "Sour Diesel", species: "Sativa", emoji: "\u{1F343}",
                      moistureMin: 30, moistureMax: 65, tempMin: 21, tempMax: 30, lightPreference: "high",
                      createdAt: ts(900)),
                [(55, 26.0, 2500, 60, 3), (52, 25.5, 2400, 61, 9), (58, 26.3, 2550, 62, 18),
                 (50, 25.0, 2300, 63, 36), (60, 26.5, 2600, 65, 72)],
                ["water", "prune"],
                [("ai", isPt
                    ? "Sour Diesel esta prosperando com a iluminacao atual. O espacamento longo entre nos e tipico de sativas. Considere desfolhar as folhas grandes que estao bloqueando os buds inferiores."
                    : "Sour Diesel is thriving under the current light setup. The long internodal spacing is typical for sativas. Consider defoliation of large fan leaves blocking lower bud sites.", "info")]
            ),
            (
                Plant(userId: userId, name: "Girl Scout Cookies",
                      species: isPt ? "Hibrida" : "Hybrid",
                      emoji: "\u{1F335}",
                      moistureMin: 35, moistureMax: 60, tempMin: 20, tempMax: 28, lightPreference: "high",
                      createdAt: ts(1500)),
                [(42, 24.0, 2300, 82, 4), (45, 23.5, 2200, 83, 16), (40, 24.5, 2400, 83, 36),
                 (48, 23.0, 2100, 84, 72), (38, 25.0, 2350, 85, 120)],
                ["water", "fertilize"],
                [("ai", isPt
                    ? "GSC esta no meio da floracao e desenvolvendo buds densos. Os tricomas estao majoritariamente transparentes \u{2014} ainda faltam 3-4 semanas para a colheita. Mantenha o cronograma de alimentacao e observe sinais de queimadura de nutrientes nas pontas das folhas."
                    : "GSC is mid-flower and developing dense buds. Trichomes are mostly clear \u{2014} still 3-4 weeks from harvest. Maintain current feeding schedule and watch for any signs of nutrient burn on leaf tips.", "info")]
            ),
        ]

        try dbQueue.write { db in
            for (plant, readings, actions, recs) in plants {
                try plant.save(db)

                let sensorId = "demo-sensor-\(plant.id.prefix(8))"
                for (moisture, temp, light, battery, hoursAgo) in readings {
                    var reading = SensorReading(
                        plantId: plant.id, sensorId: sensorId,
                        moisture: moisture, temperature: temp,
                        light: light, battery: battery,
                        timestamp: ts(hoursAgo)
                    )
                    try reading.insert(db, onConflict: .ignore)
                }

                for (i, action) in actions.enumerated() {
                    let log = CareLog(
                        plantId: plant.id, userId: userId,
                        action: action, notes: nil,
                        createdAt: ts(Double(i + 1) * 48)
                    )
                    try log.insert(db)
                }

                for (source, message, severity) in recs {
                    let rec = Recommendation(
                        plantId: plant.id, source: source,
                        message: message, severity: severity,
                        createdAt: ts(Double.random(in: 1...24))
                    )
                    try rec.insert(db)
                }
            }
        }
    }
}
