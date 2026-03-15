import Foundation

/// HTTP sync client for Turso Cloud database.
/// Uses the Turso HTTP API (`POST /v2/pipeline`) to push local changes
/// and pull remote data for multi-device sync.
final class TursoSync {

    // MARK: - Configuration

    /// Turso database URL (e.g., "https://your-db-name-your-org.turso.io").
    var tursoUrl: String {
        get { UserDefaults.standard.string(forKey: "tursoUrl") ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: "tursoUrl") }
    }

    /// Turso auth token for database access.
    var tursoAuthToken: String {
        get { UserDefaults.standard.string(forKey: "tursoAuthToken") ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: "tursoAuthToken") }
    }

    /// Whether sync is configured with valid credentials.
    var isConfigured: Bool {
        !tursoUrl.isEmpty && !tursoAuthToken.isEmpty
    }

    static let shared = TursoSync()
    private init() {}

    // MARK: - Push Operations

    /// Push sensor readings to Turso cloud.
    func pushReadings(_ readings: [SensorReading]) async throws {
        guard isConfigured, !readings.isEmpty else { return }

        var statements: [[String: Any]] = []
        for reading in readings {
            statements.append([
                "type": "execute",
                "stmt": [
                    "sql": """
                        INSERT OR IGNORE INTO sensor_readings
                        (plant_id, sensor_id, moisture, temperature, light, battery)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                    "args": makeArgs([
                        textArg(reading.plantId),
                        textArg(reading.sensorId),
                        intArg(reading.moisture),
                        floatArg(reading.temperature),
                        intArg(reading.light),
                        intArg(reading.battery),
                    ])
                ] as [String: Any]
            ])
        }

        try await executePipeline(statements)
    }

    /// Push care logs to Turso cloud.
    func pushCareLogs(_ logs: [CareLog]) async throws {
        guard isConfigured, !logs.isEmpty else { return }

        var statements: [[String: Any]] = []
        for log in logs {
            statements.append([
                "type": "execute",
                "stmt": [
                    "sql": """
                        INSERT OR IGNORE INTO care_logs
                        (id, plant_id, user_id, action, notes)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                    "args": makeArgs([
                        textArg(log.id),
                        textArg(log.plantId),
                        textArg(log.userId),
                        textArg(log.action),
                        optionalTextArg(log.notes),
                    ])
                ] as [String: Any]
            ])
        }

        try await executePipeline(statements)
    }

    // MARK: - Pull Operations

    /// Pull plants for a user from Turso cloud.
    func pullPlants(userId: String) async throws -> [Plant] {
        guard isConfigured else { return [] }

        let statements: [[String: Any]] = [[
            "type": "execute",
            "stmt": [
                "sql": "SELECT * FROM plants WHERE user_id = ? ORDER BY name",
                "args": makeArgs([textArg(userId)])
            ] as [String: Any]
        ]]

        let results = try await executePipeline(statements)
        return parsePlants(from: results)
    }

    /// Pull recommendations for a plant from Turso cloud.
    func pullRecommendations(plantId: String) async throws -> [Recommendation] {
        guard isConfigured else { return [] }

        let statements: [[String: Any]] = [[
            "type": "execute",
            "stmt": [
                "sql": "SELECT * FROM recommendations WHERE plant_id = ? ORDER BY created_at DESC LIMIT 20",
                "args": makeArgs([textArg(plantId)])
            ] as [String: Any]
        ]]

        let results = try await executePipeline(statements)
        return parseRecommendations(from: results)
    }

    // MARK: - HTTP Pipeline

    /// Execute a Turso pipeline request and return the raw JSON response.
    @discardableResult
    private func executePipeline(_ statements: [[String: Any]]) async throws -> Any {
        let url = URL(string: "\(tursoUrl)/v2/pipeline")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(tursoAuthToken)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "requests": statements + [["type": "close"]]
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw TursoSyncError.invalidResponse
        }
        guard httpResponse.statusCode == 200 else {
            throw TursoSyncError.httpError(statusCode: httpResponse.statusCode)
        }

        return try JSONSerialization.jsonObject(with: data)
    }

    // MARK: - Argument Helpers

    private func textArg(_ value: String) -> [String: Any] {
        ["type": "text", "value": value]
    }

    private func optionalTextArg(_ value: String?) -> [String: Any] {
        if let value = value {
            return ["type": "text", "value": value]
        }
        return ["type": "null"]
    }

    private func intArg(_ value: Int?) -> [String: Any] {
        if let value = value {
            return ["type": "integer", "value": String(value)]
        }
        return ["type": "null"]
    }

    private func floatArg(_ value: Double?) -> [String: Any] {
        if let value = value {
            return ["type": "float", "value": String(value)]
        }
        return ["type": "null"]
    }

    private func makeArgs(_ args: [[String: Any]]) -> [[String: Any]] {
        args
    }

    // MARK: - Response Parsing

    /// Parse plant records from a Turso pipeline response.
    private func parsePlants(from response: Any) -> [Plant] {
        guard let dict = response as? [String: Any],
              let results = dict["results"] as? [[String: Any]],
              let first = results.first,
              let responseObj = first["response"] as? [String: Any],
              let result = responseObj["result"] as? [String: Any],
              let cols = result["cols"] as? [[String: Any]],
              let rows = result["rows"] as? [[[String: Any]]] else {
            return []
        }

        let colNames = cols.compactMap { $0["name"] as? String }
        return rows.compactMap { row -> Plant? in
            let values = row.map { cell -> Any? in
                if let type = cell["type"] as? String, type == "null" { return nil }
                return cell["value"]
            }
            let dict = Dictionary(uniqueKeysWithValues: zip(colNames, values))

            guard let id = dict["id"] as? String,
                  let userId = dict["user_id"] as? String,
                  let name = dict["name"] as? String else { return nil }

            return Plant(
                id: id,
                userId: userId,
                name: name,
                species: dict["species"] as? String,
                emoji: dict["emoji"] as? String ?? "\u{1F331}",
                photoUrl: dict["photo_url"] as? String,
                moistureMin: (dict["moisture_min"] as? String).flatMap(Int.init) ?? 30,
                moistureMax: (dict["moisture_max"] as? String).flatMap(Int.init) ?? 80,
                tempMin: (dict["temp_min"] as? String).flatMap(Double.init) ?? 15.0,
                tempMax: (dict["temp_max"] as? String).flatMap(Double.init) ?? 30.0,
                lightPreference: dict["light_preference"] as? String ?? "medium",
                createdAt: dict["created_at"] as? String,
                updatedAt: dict["updated_at"] as? String
            )
        }
    }

    /// Parse recommendation records from a Turso pipeline response.
    private func parseRecommendations(from response: Any) -> [Recommendation] {
        guard let dict = response as? [String: Any],
              let results = dict["results"] as? [[String: Any]],
              let first = results.first,
              let responseObj = first["response"] as? [String: Any],
              let result = responseObj["result"] as? [String: Any],
              let cols = result["cols"] as? [[String: Any]],
              let rows = result["rows"] as? [[[String: Any]]] else {
            return []
        }

        let colNames = cols.compactMap { $0["name"] as? String }
        return rows.compactMap { row -> Recommendation? in
            let values = row.map { cell -> Any? in
                if let type = cell["type"] as? String, type == "null" { return nil }
                return cell["value"]
            }
            let dict = Dictionary(uniqueKeysWithValues: zip(colNames, values))

            guard let id = dict["id"] as? String,
                  let plantId = dict["plant_id"] as? String,
                  let source = dict["source"] as? String,
                  let message = dict["message"] as? String else { return nil }

            return Recommendation(
                id: id,
                plantId: plantId,
                source: source,
                message: message,
                severity: dict["severity"] as? String ?? "info",
                actedOn: (dict["acted_on"] as? String) == "1",
                createdAt: dict["created_at"] as? String
            )
        }
    }
}

// MARK: - Errors

enum TursoSyncError: LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from Turso server"
        case .httpError(let code):
            return "Turso HTTP error: \(code)"
        }
    }
}
