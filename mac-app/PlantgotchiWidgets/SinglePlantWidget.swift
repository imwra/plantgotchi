import PlantgotchiCore
import SwiftUI
import WidgetKit

struct SinglePlantWidget: Widget {
    let kind = WidgetKind.singlePlant.rawValue

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: GardenWidgetTimelineProvider(kind: .singlePlant)
        ) { entry in
            SinglePlantWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Single Plant")
        .description("Highlights one plant from your garden.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

private struct SinglePlantWidgetView: View {
    let entry: GardenWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(plant?.name ?? "No Plant")
                .font(.headline)
            Text(vitalityLabel(plant?.vitality ?? .medium))
                .font(.system(size: 24, weight: .bold, design: .rounded))
            Text(statusText)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    private var plant: PlantScope? {
        entry.snapshot.plants.first
    }

    private var statusText: String {
        switch plant?.attentionState {
        case .healthy:
            return "Healthy"
        case .needsAttention:
            return "Needs attention"
        case .unknown:
            return "Waiting for data"
        case nil:
            return "No data yet"
        }
    }

    private func vitalityLabel(_ vitality: GardenSnapshot.VitalityLevel) -> String {
        switch vitality {
        case .low:
            return "Low"
        case .medium:
            return "Medium"
        case .high:
            return "High"
        }
    }
}
