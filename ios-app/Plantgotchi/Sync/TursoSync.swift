import Foundation

/// Syncs local data with the server via authenticated Astro API endpoints.
/// Replaces the previous direct-to-Turso approach (no more DB credentials on device).
final class TursoSync {
    private let httpClient: AuthenticatedHTTPClient

    static let shared = TursoSync()

    private init() {
        // Read base URL from Config.plist
        let baseURL: String
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: configPath),
           let url = config["APIBaseURL"] as? String, !url.isEmpty {
            baseURL = url
        } else {
            baseURL = "http://localhost:4321"
        }
        self.httpClient = AuthenticatedHTTPClient(baseURL: baseURL)
    }

    /// For testing: inject a custom HTTP client.
    init(httpClient: AuthenticatedHTTPClient) {
        self.httpClient = httpClient
    }

    // MARK: - Push Operations

    func pushReadings(_ readings: [SensorReading]) async throws {
        guard !readings.isEmpty else { return }

        for reading in readings {
            let body: [String: Any] = [
                "plant_id": reading.plantId,
                "sensor_id": reading.sensorId,
                "moisture": reading.moisture as Any,
                "temperature": reading.temperature as Any,
                "light": reading.light as Any,
                "battery": reading.battery as Any,
            ].compactMapValues { $0 }

            let data = try JSONSerialization.data(withJSONObject: body)
            let (_, response) = try await httpClient.request(
                path: "/api/readings",
                method: "POST",
                body: data
            )
            guard response.statusCode == 200 || response.statusCode == 201 else {
                throw TursoSyncError.httpError(statusCode: response.statusCode)
            }
        }
    }

    func pushCareLogs(_ logs: [CareLog]) async throws {
        guard !logs.isEmpty else { return }

        for log in logs {
            let body: [String: Any] = [
                "plant_id": log.plantId,
                "action": log.action,
                "notes": log.notes as Any,
            ].compactMapValues { $0 }

            let data = try JSONSerialization.data(withJSONObject: body)
            let (_, response) = try await httpClient.request(
                path: "/api/care-logs",
                method: "POST",
                body: data
            )
            guard response.statusCode == 200 || response.statusCode == 201 else {
                throw TursoSyncError.httpError(statusCode: response.statusCode)
            }
        }
    }

    // MARK: - Pull Operations

    func pullPlants(userId: String) async throws -> [Plant] {
        let (data, response) = try await httpClient.request(path: "/api/plants?user_id=\(userId)")
        guard response.statusCode == 200 else {
            throw TursoSyncError.httpError(statusCode: response.statusCode)
        }
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        return json.compactMap { parsePlant(from: $0) }
    }

    func pullRecommendations(plantId: String) async throws -> [Recommendation] {
        let (data, response) = try await httpClient.request(
            path: "/api/recommendations?plant_id=\(plantId)"
        )
        guard response.statusCode == 200 else {
            throw TursoSyncError.httpError(statusCode: response.statusCode)
        }
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        return json.compactMap { parseRecommendation(from: $0) }
    }

    // MARK: - Parsing

    private func parsePlant(from dict: [String: Any]) -> Plant? {
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
            moistureMin: dict["moisture_min"] as? Int ?? 30,
            moistureMax: dict["moisture_max"] as? Int ?? 80,
            tempMin: dict["temp_min"] as? Double ?? 15.0,
            tempMax: dict["temp_max"] as? Double ?? 30.0,
            lightPreference: dict["light_preference"] as? String ?? "medium",
            createdAt: dict["created_at"] as? String,
            updatedAt: dict["updated_at"] as? String
        )
    }

    private func parseRecommendation(from dict: [String: Any]) -> Recommendation? {
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
            actedOn: dict["acted_on"] as? Bool ?? false,
            createdAt: dict["created_at"] as? String
        )
    }
}

enum TursoSyncError: LocalizedError {
    case httpError(statusCode: Int)

    var errorDescription: String? {
        switch self {
        case .httpError(let code):
            return "API error: HTTP \(code)"
        }
    }
}
