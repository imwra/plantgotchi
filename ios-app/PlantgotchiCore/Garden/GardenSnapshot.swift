import Foundation

public struct GardenSnapshot: Codable, Equatable {
    public struct GroupScope: Codable, Equatable {
        public var vitality: VitalityLevel
        public var attentionCount: Int
        public var unknownCount: Int

        public init(
            vitality: VitalityLevel,
            attentionCount: Int = 0,
            unknownCount: Int = 0
        ) {
            self.vitality = vitality
            self.attentionCount = attentionCount
            self.unknownCount = unknownCount
        }

        public static let empty = GroupScope(vitality: .medium)
    }

    public enum VitalityLevel: String, Codable, Equatable {
        case low
        case medium
        case high
    }

    public var generatedAt: Date
    public var wholeGarden: GroupScope
    public var subsets: [SubsetScope]
    public var plants: [PlantScope]

    public init(
        generatedAt: Date,
        wholeGarden: GroupScope,
        subsets: [SubsetScope],
        plants: [PlantScope]
    ) {
        self.generatedAt = generatedAt
        self.wholeGarden = wholeGarden
        self.subsets = subsets
        self.plants = plants
    }

    public static func generatedAt(
        _ date: Date,
        wholeGarden: GroupScope,
        subsets: [SubsetScope],
        plants: [PlantScope]
    ) -> GardenSnapshot {
        GardenSnapshot(
            generatedAt: date,
            wholeGarden: wholeGarden,
            subsets: subsets,
            plants: plants
        )
    }
}
