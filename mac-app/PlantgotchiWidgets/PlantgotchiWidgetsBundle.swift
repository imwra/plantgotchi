import SwiftUI
import WidgetKit

struct PlantgotchiWidgetEntry: TimelineEntry {
    let date: Date
}

struct PlantgotchiWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> PlantgotchiWidgetEntry {
        PlantgotchiWidgetEntry(date: .now)
    }

    func getSnapshot(in context: Context, completion: @escaping (PlantgotchiWidgetEntry) -> Void) {
        completion(PlantgotchiWidgetEntry(date: .now))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PlantgotchiWidgetEntry>) -> Void) {
        completion(
            Timeline(
                entries: [PlantgotchiWidgetEntry(date: .now)],
                policy: .after(.now.addingTimeInterval(900))
            )
        )
    }
}

struct PlantgotchiWidget: Widget {
    let kind = "PlantgotchiWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PlantgotchiWidgetProvider()) { entry in
            Text("Plantgotchi")
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Plantgotchi")
        .description("Mac widget placeholder for the digital garden.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

@main
struct PlantgotchiWidgetsBundle: WidgetBundle {
    var body: some Widget {
        PlantgotchiWidget()
    }
}
