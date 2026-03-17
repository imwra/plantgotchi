import XCTest
@testable import PlantgotchiCore

@MainActor
final class GardenStoreTests: XCTestCase {
    func test_refreshPersistsLatestSnapshotForWidgets() async throws {
        let client = MockPlantAPIClient(payload: [.fixture])
        let cache = InMemorySnapshotCache()
        let store = GardenStore(client: client, cache: cache, now: { Date(timeIntervalSince1970: 1_800) })

        let snapshot = try await store.refresh()

        XCTAssertEqual(snapshot.wholeGarden.vitality, .high)
        XCTAssertEqual(snapshot.wholeGarden.attentionCount, 0)
        XCTAssertEqual(cache.savedSnapshot, snapshot)
        XCTAssertEqual(snapshot.plants.map(\.id), ["plant-1"])
    }

    func test_refreshFallsBackToCachedSnapshotWhenNetworkFails() async throws {
        let cached = GardenSnapshot.generatedAt(
            Date(timeIntervalSince1970: 500),
            wholeGarden: .init(vitality: .medium, attentionCount: 1, unknownCount: 0),
            subsets: [],
            plants: [
                PlantScope(
                    id: "cached-plant",
                    name: "Cached Plant",
                    vitality: .medium,
                    attentionState: .healthy
                ),
            ]
        )
        let client = MockPlantAPIClient(error: URLError(.timedOut))
        let cache = InMemorySnapshotCache(savedSnapshot: cached)
        let store = GardenStore(client: client, cache: cache, now: Date.init)

        let snapshot = try await store.refresh()

        XCTAssertEqual(snapshot, cached)
    }
}

private struct MockPlantAPIClient: PlantAPIClientProtocol {
    var payload: [APIPlantPayload] = []
    var error: Error?

    func fetchPlants() async throws -> [APIPlantPayload] {
        if let error {
            throw error
        }
        return payload
    }
}

private final class InMemorySnapshotCache: SnapshotCacheProtocol {
    var savedSnapshot: GardenSnapshot?

    init(savedSnapshot: GardenSnapshot? = nil) {
        self.savedSnapshot = savedSnapshot
    }

    func load() throws -> GardenSnapshot? {
        savedSnapshot
    }

    func save(_ snapshot: GardenSnapshot) throws {
        savedSnapshot = snapshot
    }
}

private extension APIPlantPayload {
    static let fixture = APIPlantPayload(
        plant: .init(
            id: "plant-1",
            userID: "user-1",
            name: "Monstera",
            species: "Monstera deliciosa",
            emoji: "\u{1F331}",
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 18,
            tempMax: 30,
            lightPreference: "medium"
        ),
        latestReading: .init(
            moisture: 55,
            temperature: 24,
            light: 1400,
            timestamp: "1970-01-01T00:20:00Z"
        ),
        recentCareLogs: []
    )
}
