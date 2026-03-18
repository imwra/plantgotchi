import PlantgotchiCore
import SwiftUI

@MainActor
final class GardenWindowViewModel: ObservableObject {
    @Published private(set) var snapshot: GardenSnapshot
    @Published private(set) var selectedPlantID: String?

    init(snapshot: GardenSnapshot) {
        self.snapshot = snapshot
    }

    var sceneVitality: GardenSnapshot.VitalityLevel {
        snapshot.wholeGarden.vitality
    }

    var selectedPlant: PlantScope? {
        snapshot.plants.first { $0.id == selectedPlantID }
    }

    func selectPlant(id: String) {
        selectedPlantID = id

        guard let plant = snapshot.plants.first(where: { $0.id == id }) else {
            return
        }

        Analytics.track("plant_viewed", properties: [
            "plant_id": plant.id,
            "species": "",
            "plant_name": plant.name,
        ])
    }

    func update(snapshot: GardenSnapshot) {
        self.snapshot = snapshot

        if let selectedPlantID, !snapshot.plants.contains(where: { $0.id == selectedPlantID }) {
            self.selectedPlantID = nil
        }
    }
}
