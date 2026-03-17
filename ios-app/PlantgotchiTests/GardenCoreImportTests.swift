import XCTest
@testable import PlantgotchiCore

final class GardenCoreImportTests: XCTestCase {
    func test_canConstructEmptySnapshot() {
        let snapshot = GardenSnapshot.generatedAt(Date(), wholeGarden: .empty, subsets: [], plants: [])
        XCTAssertEqual(snapshot.wholeGarden.vitality, .medium)
    }
}
