import Foundation
import BackgroundTasks

/// Manages periodic background tasks for Claude API analysis.
/// Registers a `BGAppRefreshTask` that queries recent plant data,
/// calls the Claude API (Haiku) for deeper analysis, and stores
/// resulting recommendations in the local GRDB database.
final class BackgroundAgent {

    static let shared = BackgroundAgent()
    static let taskIdentifier = "com.plantgotchi.claude-analysis"

    /// The Claude API endpoint.
    private let claudeAPIURL = URL(string: "https://api.anthropic.com/v1/messages")!

    /// Refresh interval: 6 hours.
    private let refreshInterval: TimeInterval = 6 * 60 * 60

    private init() {}

    // MARK: - Scheduling

    /// Schedule the next background refresh task.
    func scheduleNextRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: Self.taskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: refreshInterval)
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("[BackgroundAgent] Failed to schedule refresh: \(error)")
        }
    }

    // MARK: - Task Handler

    /// Handle the background app refresh task.
    func handleAppRefresh(task: BGAppRefreshTask) {
        // Schedule the next refresh immediately
        scheduleNextRefresh()

        let workTask = Task {
            await performAnalysis()
        }

        task.expirationHandler = {
            workTask.cancel()
        }

        Task {
            await workTask.value
            task.setTaskCompleted(success: true)
        }
    }

    // MARK: - Claude Analysis

    /// Query recent data for all plants and request Claude analysis.
    private func performAnalysis() async {
        let db = AppDatabase.shared

        // Get API key from UserDefaults (user configures in Settings)
        guard let apiKey = UserDefaults.standard.string(forKey: "claudeAPIKey"),
              !apiKey.isEmpty else {
            print("[BackgroundAgent] No Claude API key configured, skipping analysis")
            return
        }

        // Get a userId — in a real app this would come from auth
        guard let userId = UserDefaults.standard.string(forKey: "userId") else {
            print("[BackgroundAgent] No userId configured, skipping analysis")
            return
        }

        do {
            let plants = try db.getPlants(userId: userId)

            for plant in plants {
                let readings = try db.getRecentReadings(plantId: plant.id, days: 7)
                let careLogs = try db.getCareLogs(plantId: plant.id, limit: 20)

                guard !readings.isEmpty else { continue }

                let prompt = buildPrompt(plant: plant, readings: readings, careLogs: careLogs)
                if let response = await callClaudeAPI(prompt: prompt, apiKey: apiKey) {
                    let rec = Recommendation(
                        plantId: plant.id,
                        source: "claude",
                        message: response,
                        severity: "info"
                    )
                    try db.addRecommendation(rec)
                }
            }
        } catch {
            print("[BackgroundAgent] Analysis failed: \(error)")
        }
    }

    /// Build a prompt summarizing plant data for Claude.
    private func buildPrompt(
        plant: Plant,
        readings: [SensorReading],
        careLogs: [CareLog]
    ) -> String {
        var lines: [String] = []
        lines.append("You are a plant care expert. Analyze this data and give ONE concise recommendation (1-2 sentences).")
        lines.append("")
        lines.append("Plant: \(plant.name) (\(plant.species ?? "unknown species"))")
        lines.append("Preferred ranges: moisture \(plant.moistureMin)-\(plant.moistureMax)%, temp \(plant.tempMin)-\(plant.tempMax)\u{00B0}C, light: \(plant.lightPreference)")
        lines.append("")
        lines.append("Recent readings (last 7 days, most recent first):")
        for reading in readings.prefix(20) {
            let parts = [
                reading.moisture.map { "moisture: \($0)%" },
                reading.temperature.map { "temp: \($0)\u{00B0}C" },
                reading.light.map { "light: \($0) lux" },
                reading.battery.map { "battery: \($0)%" },
            ].compactMap { $0 }
            lines.append("  \(reading.timestamp ?? "?"): \(parts.joined(separator: ", "))")
        }
        lines.append("")
        lines.append("Recent care actions:")
        for log in careLogs.prefix(10) {
            lines.append("  \(log.createdAt ?? "?"): \(log.action)\(log.notes.map { " — \($0)" } ?? "")")
        }

        return lines.joined(separator: "\n")
    }

    /// Call the Claude API (Haiku model) with the given prompt.
    private func callClaudeAPI(prompt: String, apiKey: String) async -> String? {
        var request = URLRequest(url: claudeAPIURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")

        let body: [String: Any] = [
            "model": "claude-3-haiku-20240307",
            "max_tokens": 256,
            "messages": [
                ["role": "user", "content": prompt]
            ]
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                print("[BackgroundAgent] Claude API returned non-200 status")
                return nil
            }

            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let content = json["content"] as? [[String: Any]],
               let firstBlock = content.first,
               let text = firstBlock["text"] as? String {
                return text
            }
        } catch {
            print("[BackgroundAgent] Claude API call failed: \(error)")
        }
        return nil
    }
}
