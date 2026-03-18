import XCTest
@testable import PlantgotchiCore

final class GardenCoreImportTests: XCTestCase {
    func test_canConstructEmptySnapshot() {
        let snapshot = GardenSnapshot.generatedAt(Date(), wholeGarden: .empty, subsets: [], plants: [])
        XCTAssertEqual(snapshot.wholeGarden.vitality, .medium)
    }

    func test_sharedAnalyticsFacadeIsCallable() {
        Analytics.track("garden_core_import_test", properties: ["source": "tests"])
        Analytics.identify(userId: "garden-core-user", traits: ["platform": "macos"])
        Analytics.reset()
    }
}
