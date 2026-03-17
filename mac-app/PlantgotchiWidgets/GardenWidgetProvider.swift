import Foundation
import PlantgotchiCore
import WidgetKit

struct GardenWidgetProvider {
    private let dataProvider: GardenWidgetDataProvider

    init(cache: SnapshotCacheProtocol = SnapshotCache()) {
        self.dataProvider = GardenWidgetDataProvider(cache: cache)
    }

    func snapshotEntry(kind: WidgetKind) async throws -> GardenWidgetEntry {
        let entry = try dataProvider.snapshotEntry(kind: kind.coreKind)
        return GardenWidgetEntry(
            date: entry.date,
            snapshot: entry.snapshot,
            kind: kind
        )
    }
}

struct GardenWidgetTimelineProvider: TimelineProvider {
    let kind: WidgetKind
    let provider: GardenWidgetProvider

    init(kind: WidgetKind, provider: GardenWidgetProvider = GardenWidgetProvider()) {
        self.kind = kind
        self.provider = provider
    }

    func placeholder(in context: Context) -> GardenWidgetEntry {
        GardenWidgetEntry(
            date: .now,
            snapshot: GardenSnapshot.generatedAt(.now, wholeGarden: .empty, subsets: [], plants: []),
            kind: kind
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (GardenWidgetEntry) -> Void) {
        Task {
            let entry = (try? await provider.snapshotEntry(kind: kind)) ?? placeholder(in: context)
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GardenWidgetEntry>) -> Void) {
        Task {
            let entry = (try? await provider.snapshotEntry(kind: kind)) ?? placeholder(in: context)
            completion(
                Timeline(
                    entries: [entry],
                    policy: .after(entry.date.addingTimeInterval(900))
                )
            )
        }
    }
}

private extension WidgetKind {
    var coreKind: GardenWidgetKind {
        switch self {
        case .singlePlant:
            return .singlePlant
        case .subsetGarden:
            return .subsetGarden
        case .wholeGarden:
            return .wholeGarden
        }
    }
}
