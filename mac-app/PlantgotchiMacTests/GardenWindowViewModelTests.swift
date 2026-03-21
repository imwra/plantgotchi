import XCTest
import PlantgotchiCore
@testable import PlantgotchiMac

final class GardenWindowViewModelTests: XCTestCase {
    @MainActor
    func test_selectsPlantFromSnapshotAndPreservesWholeGardenScene() {
        let snapshot = GardenSnapshot.generatedAt(
            Date(timeIntervalSince1970: 0),
            wholeGarden: .init(vitality: .high, attentionCount: 0, unknownCount: 0),
            subsets: [],
            plants: [
                PlantScope(id: "p1", name: "Fern", vitality: .high, attentionState: .healthy),
                PlantScope(id: "p2", name: "Monstera", vitality: .medium, attentionState: .healthy),
            ]
        )
        let viewModel = GardenWindowViewModel(snapshot: snapshot)

        viewModel.selectPlant(id: "p2")

        XCTAssertEqual(viewModel.selectedPlantID, "p2")
        XCTAssertEqual(viewModel.sceneVitality, .high)
    }

    @MainActor
    func test_selectedPlantExposesLifecycleFields() {
        let snapshot = GardenSnapshot.generatedAt(
            Date(timeIntervalSince1970: 0),
            wholeGarden: .init(vitality: .high),
            subsets: [],
            plants: [
                PlantScope(
                    id: "p1",
                    name: "Northern Lights",
                    vitality: .high,
                    attentionState: .healthy,
                    currentPhase: "flowering",
                    strainName: "Northern Lights",
                    environment: "indoor"
                ),
            ]
        )
        let viewModel = GardenWindowViewModel(snapshot: snapshot)
        viewModel.selectPlant(id: "p1")

        let plant = viewModel.selectedPlant
        XCTAssertNotNil(plant)
        XCTAssertEqual(plant?.currentPhase, "flowering")
        XCTAssertEqual(plant?.strainName, "Northern Lights")
        XCTAssertEqual(plant?.environment, "indoor")
    }

    @MainActor
    func test_selectedPlantWithoutLifecycleFieldsHasNils() {
        let snapshot = GardenSnapshot.generatedAt(
            Date(timeIntervalSince1970: 0),
            wholeGarden: .init(vitality: .medium),
            subsets: [],
            plants: [
                PlantScope(id: "p1", name: "Fern", vitality: .medium, attentionState: .healthy),
            ]
        )
        let viewModel = GardenWindowViewModel(snapshot: snapshot)
        viewModel.selectPlant(id: "p1")

        let plant = viewModel.selectedPlant
        XCTAssertNotNil(plant)
        XCTAssertNil(plant?.currentPhase)
        XCTAssertNil(plant?.strainName)
        XCTAssertNil(plant?.environment)
    }
}
