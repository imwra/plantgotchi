import PlantgotchiCore
import SwiftUI

struct DigitalGardenScene: View {
    @ObservedObject var viewModel: GardenWindowViewModel

    private let columns = [
        GridItem(.adaptive(minimum: 160, maximum: 220), spacing: 16),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                header
                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(viewModel.snapshot.plants) { plant in
                        Button {
                            viewModel.selectPlant(id: plant.id)
                        } label: {
                            plantTile(plant)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(28)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Digital Garden")
                .font(.system(size: 30, weight: .black, design: .rounded))
                .foregroundStyle(MacGardenTheme.ink)
            Text(sceneLabel)
                .font(.headline)
                .foregroundStyle(MacGardenTheme.accent(for: viewModel.sceneVitality))
            Text("\(viewModel.snapshot.plants.count) plants in view")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private func plantTile(_ plant: PlantScope) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            RoundedRectangle(cornerRadius: 14)
                .fill(MacGardenTheme.accent(for: plant.vitality).opacity(0.18))
                .overlay {
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(MacGardenTheme.accent(for: plant.vitality), lineWidth: 2)
                        .padding(6)
                    Text(symbol(for: plant))
                        .font(.system(size: 36))
                }
                .frame(height: 112)

            Text(plant.name)
                .font(.headline)
                .foregroundStyle(MacGardenTheme.ink)

            Text(statusLabel(for: plant))
                .font(.caption)
                .foregroundStyle(.secondary)

            if let phase = plant.currentPhase {
                Text(phaseLabel(phase))
                    .font(.caption2.weight(.medium))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(phaseColor(phase).opacity(0.15))
                    .foregroundStyle(phaseColor(phase))
                    .clipShape(Capsule())
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(MacGardenTheme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(borderColor(for: plant), lineWidth: 2)
        )
    }

    private var sceneLabel: String {
        switch viewModel.sceneVitality {
        case .low:
            return "Needs attention"
        case .medium:
            return "Holding steady"
        case .high:
            return "Thriving"
        }
    }

    private func statusLabel(for plant: PlantScope) -> String {
        switch plant.attentionState {
        case .healthy:
            return "Stable"
        case .needsAttention:
            return "Needs attention"
        case .unknown:
            return "Waiting for data"
        }
    }

    private func symbol(for plant: PlantScope) -> String {
        switch plant.vitality {
        case .low:
            return "🥀"
        case .medium:
            return "🪴"
        case .high:
            return "🌿"
        }
    }

    private func phaseLabel(_ phase: String) -> String {
        switch phase {
        case "germination": return "Germinating"
        case "seedling": return "Seedling"
        case "vegetative": return "Vegetative"
        case "flowering": return "Flowering"
        case "drying": return "Drying"
        case "curing": return "Curing"
        case "processing": return "Processing"
        case "complete": return "Complete"
        default: return phase.capitalized
        }
    }

    private func phaseColor(_ phase: String) -> Color {
        switch phase {
        case "germination", "seedling": return .green
        case "vegetative": return .mint
        case "flowering": return .purple
        case "drying": return .orange
        case "curing": return .brown
        case "processing": return .gray
        case "complete": return .blue
        default: return .secondary
        }
    }

    private func borderColor(for plant: PlantScope) -> Color {
        if viewModel.selectedPlantID == plant.id {
            return MacGardenTheme.ink
        }

        return MacGardenTheme.accent(for: plant.vitality).opacity(0.35)
    }
}
