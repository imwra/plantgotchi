import Foundation
import PlantgotchiCore

struct MenuBarPanelViewModel {
    let vitalityText: String
    let attentionSummary: String

    init(snapshot: GardenSnapshot) {
        vitalityText = snapshot.wholeGarden.vitality.rawValue.capitalized
        attentionSummary = snapshot.wholeGarden.attentionCount == 0
            ? "All healthy"
            : "\(snapshot.wholeGarden.attentionCount) need attention"
    }

    static func makeSnapshot(
        vitality: GardenSnapshot.VitalityLevel,
        attentionCount: Int
    ) -> GardenSnapshot {
        GardenSnapshot.generatedAt(
            Date(timeIntervalSince1970: 0),
            wholeGarden: .init(vitality: vitality, attentionCount: attentionCount, unknownCount: 0),
            subsets: [],
            plants: []
        )
    }
}
