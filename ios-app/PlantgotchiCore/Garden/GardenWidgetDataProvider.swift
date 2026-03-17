import Foundation

public enum GardenWidgetKind: String, Codable, Equatable {
    case singlePlant
    case subsetGarden
    case wholeGarden
}

public struct GardenWidgetSnapshotEntry: Equatable {
    public let date: Date
    public let snapshot: GardenSnapshot
    public let kind: GardenWidgetKind

    public init(date: Date, snapshot: GardenSnapshot, kind: GardenWidgetKind) {
        self.date = date
        self.snapshot = snapshot
        self.kind = kind
    }
}

public struct GardenWidgetDataProvider {
    private let cache: SnapshotCacheProtocol

    public init(cache: SnapshotCacheProtocol = SnapshotCache()) {
        self.cache = cache
    }

    public func snapshotEntry(kind: GardenWidgetKind) throws -> GardenWidgetSnapshotEntry {
        let snapshot = try cache.load() ?? GardenSnapshot.generatedAt(
            .now,
            wholeGarden: .empty,
            subsets: [],
            plants: []
        )
        return GardenWidgetSnapshotEntry(date: snapshot.generatedAt, snapshot: snapshot, kind: kind)
    }
}
