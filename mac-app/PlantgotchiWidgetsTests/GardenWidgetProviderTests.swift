import XCTest
import PlantgotchiCore

final class GardenWidgetProviderTests: XCTestCase {
    func test_wholeGardenSnapshotUsesCachedSnapshot() async throws {
        let cache = InMemorySnapshotCache(
            savedSnapshot: GardenSnapshot.generatedAt(
                Date(timeIntervalSince1970: 0),
                wholeGarden: .init(vitality: .high, attentionCount: 0, unknownCount: 0),
                subsets: [],
                plants: []
            )
        )
        let provider = GardenWidgetDataProvider(cache: cache)

        let entry = try provider.snapshotEntry(kind: .wholeGarden)

        XCTAssertEqual(entry.snapshot.wholeGarden.vitality, .high)
        XCTAssertEqual(entry.kind, .wholeGarden)
    }
}

private final class InMemorySnapshotCache: SnapshotCacheProtocol {
    let savedSnapshot: GardenSnapshot?

    init(savedSnapshot: GardenSnapshot?) {
        self.savedSnapshot = savedSnapshot
    }

    func load() throws -> GardenSnapshot? {
        savedSnapshot
    }

    func save(_ snapshot: GardenSnapshot) throws {}
}
