public struct GardenVitalityEngine {
    public init() {}

    public func plantScope(from input: PlantScopeInput) -> PlantScope {
        let signals = [
            input.moistureScore,
            input.temperatureScore,
            input.lightScore,
        ].compactMap { $0 }

        guard !signals.isEmpty else {
            return PlantScope(
                id: input.id,
                name: input.name,
                vitality: .medium,
                attentionState: .unknown,
                currentPhase: input.currentPhase,
                strainName: input.strainName,
                environment: input.environment
            )
        }

        let averageSignal = signals.reduce(0, +) / Double(signals.count)
        let weightedScore = (averageSignal * 0.8) + (input.freshnessScore * 0.2)

        let vitality: GardenSnapshot.VitalityLevel
        switch weightedScore {
        case ..<0.34:
            vitality = .low
        case ..<0.67:
            vitality = .medium
        default:
            vitality = .high
        }

        let attentionState: AttentionState = vitality == .low ? .needsAttention : .healthy

        return PlantScope(
            id: input.id,
            name: input.name,
            vitality: vitality,
            attentionState: attentionState,
            currentPhase: input.currentPhase,
            strainName: input.strainName,
            environment: input.environment
        )
    }

    public func wholeGarden(from inputs: [PlantScopeInput]) -> GardenSnapshot.GroupScope {
        let scopes = inputs.map(plantScope(from:))

        let attentionCount = scopes.filter { $0.attentionState == .needsAttention }.count
        let unknownCount = scopes.filter { $0.attentionState == .unknown }.count

        let vitality: GardenSnapshot.VitalityLevel
        if scopes.isEmpty {
            vitality = .medium
        } else if Double(attentionCount) / Double(scopes.count) > 0.34 {
            vitality = .low
        } else if attentionCount == 0 && unknownCount == 0 && scopes.allSatisfy({ $0.vitality == .high }) {
            vitality = .high
        } else {
            vitality = .medium
        }

        return GardenSnapshot.GroupScope(
            vitality: vitality,
            attentionCount: attentionCount,
            unknownCount: unknownCount
        )
    }
}
