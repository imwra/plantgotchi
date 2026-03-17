import PlantgotchiCore
import SwiftUI
import WidgetKit

struct WholeGardenWidget: Widget {
    let kind = WidgetKind.wholeGarden.rawValue

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: GardenWidgetTimelineProvider(kind: .wholeGarden)
        ) { entry in
            WholeGardenWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Whole Garden")
        .description("Shows the current overall state of your digital garden.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

private struct WholeGardenWidgetView: View {
    let entry: GardenWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Garden")
                .font(.headline)
            Text(vitalityLabel(entry.snapshot.wholeGarden.vitality))
                .font(.system(size: 28, weight: .bold, design: .rounded))
            Text("\(entry.snapshot.wholeGarden.attentionCount) need attention")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
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
