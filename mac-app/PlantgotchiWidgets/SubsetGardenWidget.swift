import PlantgotchiCore
import SwiftUI
import WidgetKit

struct SubsetGardenWidget: Widget {
    let kind = WidgetKind.subsetGarden.rawValue

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: GardenWidgetTimelineProvider(kind: .subsetGarden)
        ) { entry in
            SubsetGardenWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Plant Group")
        .description("Shows a subset of plants from your garden.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

private struct SubsetGardenWidgetView: View {
    let entry: GardenWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(subset?.name ?? "Plant Group")
                .font(.headline)
            Text(vitalityLabel(subset?.vitality ?? entry.snapshot.wholeGarden.vitality))
                .font(.system(size: 24, weight: .bold, design: .rounded))
            Text(summaryText)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    private var subset: SubsetScope? {
        entry.snapshot.subsets.first
    }

    private var summaryText: String {
        if let subset {
            return "\(subset.attentionCount) need attention"
        }

        return "\(entry.snapshot.plants.count) plants tracked"
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
