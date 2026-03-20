import Combine
import Foundation

@MainActor
public final class GardenStore: ObservableObject {
    @Published public private(set) var snapshot: GardenSnapshot?

    private let client: PlantAPIClientProtocol
    private let cache: SnapshotCacheProtocol
    private let now: () -> Date
    private let vitalityEngine: GardenVitalityEngine

    public init(
        client: PlantAPIClientProtocol,
        cache: SnapshotCacheProtocol,
        now: @escaping () -> Date = Date.init,
        vitalityEngine: GardenVitalityEngine = GardenVitalityEngine()
    ) {
        self.client = client
        self.cache = cache
        self.now = now
        self.vitalityEngine = vitalityEngine
    }

    @discardableResult
    public func refresh() async throws -> GardenSnapshot {
        do {
            let payload = try await client.fetchPlants()
            let snapshot = makeSnapshot(from: payload, now: now())
            try cache.save(snapshot)
            self.snapshot = snapshot
            return snapshot
        } catch {
            if let error = error as? PlantAPIClientError, error == .unauthorized {
                throw error
            }

            if let cached = try cache.load() {
                self.snapshot = cached
                return cached
            }
            throw error
        }
    }

    private func makeSnapshot(from payload: [APIPlantPayload], now: Date) -> GardenSnapshot {
        let inputs = payload.map { entry in
            PlantScopeInput(
                id: entry.plant.id,
                name: entry.plant.name,
                moistureScore: score(
                    reading: entry.latestReading?.moisture,
                    min: entry.plant.moistureMin,
                    max: entry.plant.moistureMax
                ),
                temperatureScore: score(
                    reading: entry.latestReading?.temperature,
                    min: entry.plant.tempMin,
                    max: entry.plant.tempMax
                ),
                lightScore: lightScore(
                    reading: entry.latestReading?.light,
                    preference: entry.plant.lightPreference
                ),
                freshnessScore: freshnessScore(
                    timestamp: entry.latestReading?.timestamp,
                    now: now
                ),
                currentPhase: entry.plant.currentPhase,
                strainName: entry.plant.strainName,
                environment: entry.plant.environment
            )
        }

        let plantScopes = inputs.map(vitalityEngine.plantScope(from:))
        return GardenSnapshot.generatedAt(
            now,
            wholeGarden: vitalityEngine.wholeGarden(from: inputs),
            subsets: [],
            plants: plantScopes
        )
    }

    private func score(reading: Double?, min: Double, max: Double) -> Double? {
        guard let reading else {
            return nil
        }

        if min...max ~= reading {
            return 1.0
        }

        let span = Swift.max(max - min, 1.0)
        let distance = reading < min ? min - reading : reading - max
        return Swift.max(0.0, 1.0 - (distance / span))
    }

    private func lightScore(reading: Double?, preference: String) -> Double? {
        guard let reading else {
            return nil
        }

        let range: ClosedRange<Double>
        switch preference.lowercased() {
        case "low":
            range = 0...1000
        case "high":
            range = 2000...5000
        default:
            range = 1000...2000
        }

        if range.contains(reading) {
            return 1.0
        }

        let distance = reading < range.lowerBound ? range.lowerBound - reading : reading - range.upperBound
        return Swift.max(0.0, 1.0 - (distance / 2000.0))
    }

    private func freshnessScore(timestamp: String?, now: Date) -> Double {
        guard
            let timestamp,
            let date = ISO8601DateFormatter().date(from: timestamp)
        else {
            return 0.2
        }

        let age = now.timeIntervalSince(date)
        switch age {
        case ..<21_600:
            return 1.0
        case ..<86_400:
            return 0.75
        case ..<259_200:
            return 0.4
        default:
            return 0.1
        }
    }
}
