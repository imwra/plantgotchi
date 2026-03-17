import PlantgotchiCore
import SwiftUI

struct PlantDetailSidebar: View {
    @ObservedObject var viewModel: GardenWindowViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Inspector")
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(MacGardenTheme.ink)

            if let plant = viewModel.selectedPlant {
                Text(plant.name)
                    .font(.title2.weight(.bold))
                    .foregroundStyle(MacGardenTheme.ink)

                Text(detailText(for: plant))
                    .font(.body)
                    .foregroundStyle(.secondary)

                Spacer()
            } else {
                Text("Select a plant from the garden to inspect its current state.")
                    .font(.body)
                    .foregroundStyle(.secondary)

                Spacer()
            }
        }
        .padding(24)
        .frame(maxHeight: .infinity, alignment: .topLeading)
        .background(MacGardenTheme.sidebar)
    }

    private func detailText(for plant: PlantScope) -> String {
        switch plant.attentionState {
        case .healthy:
            return "This plant is currently stable."
        case .needsAttention:
            return "This plant is the main contributor to your current attention queue."
        case .unknown:
            return "This plant is missing enough data that the garden cannot classify it yet."
        }
    }
}
