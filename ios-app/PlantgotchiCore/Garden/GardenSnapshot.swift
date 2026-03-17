import Foundation

public struct GardenSnapshot: Equatable {
    public struct GardenScope: Equatable {
        public var vitality: VitalityLevel

        public init(vitality: VitalityLevel) {
            self.vitality = vitality
        }

        public static let empty = GardenScope(vitality: .medium)
    }

    public enum VitalityLevel: String, Equatable {
        case low
        case medium
        case high
    }

    public var generatedAt: Date
    public var wholeGarden: GardenScope
    public var subsets: [GardenScope]
    public var plants: [GardenScope]

    public init(
        generatedAt: Date,
        wholeGarden: GardenScope,
        subsets: [GardenScope],
        plants: [GardenScope]
    ) {
        self.generatedAt = generatedAt
        self.wholeGarden = wholeGarden
        self.subsets = subsets
        self.plants = plants
    }

    public static func generatedAt(
        _ date: Date,
        wholeGarden: GardenScope,
        subsets: [GardenScope],
        plants: [GardenScope]
    ) -> GardenSnapshot {
        GardenSnapshot(
            generatedAt: date,
            wholeGarden: wholeGarden,
            subsets: subsets,
            plants: plants
        )
    }
}
