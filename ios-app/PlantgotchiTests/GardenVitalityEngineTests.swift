import XCTest
@testable import PlantgotchiCore

final class GardenVitalityEngineTests: XCTestCase {
    func test_marksPlantLowWhenMoistureAndFreshnessArePoor() {
        let plant = PlantScopeInput(
            id: "p1",
            name: "Monstera",
            moistureScore: 0.15,
            temperatureScore: 0.45,
            lightScore: 0.40,
            freshnessScore: 0.20
        )

        let result = GardenVitalityEngine().plantScope(from: plant)

        XCTAssertEqual(result.vitality, .low)
        XCTAssertEqual(result.attentionState, .needsAttention)
    }

    func test_marksWholeGardenMediumWhenAttentionPlantsStayBelowThreshold() {
        let scopes = [
            PlantScopeInput(
                id: "a",
                name: "A",
                moistureScore: 0.95,
                temperatureScore: 0.85,
                lightScore: 0.80,
                freshnessScore: 1.0
            ),
            PlantScopeInput(
                id: "b",
                name: "B",
                moistureScore: 0.45,
                temperatureScore: 0.55,
                lightScore: 0.50,
                freshnessScore: 0.75
            ),
        ]

        let result = GardenVitalityEngine().wholeGarden(from: scopes)

        XCTAssertEqual(result.vitality, .medium)
        XCTAssertEqual(result.attentionCount, 0)
        XCTAssertEqual(result.unknownCount, 0)
    }

    func test_marksWholeGardenLowWhenOnlyPlantNeedsAttention() {
        let result = GardenVitalityEngine().wholeGarden(
            from: [
                PlantScopeInput(
                    id: "solo",
                    name: "Solo",
                    moistureScore: 0.10,
                    temperatureScore: 0.20,
                    lightScore: 0.15,
                    freshnessScore: 0.10
                ),
            ]
        )

        XCTAssertEqual(result.vitality, .low)
        XCTAssertEqual(result.attentionCount, 1)
    }

    func test_treatsUnknownDataSeparatelyFromNeedsAttention() {
        let stale = PlantScopeInput(
            id: "c",
            name: "C",
            moistureScore: nil,
            temperatureScore: nil,
            lightScore: nil,
            freshnessScore: 0.10
        )

        let result = GardenVitalityEngine().plantScope(from: stale)
        let wholeGarden = GardenVitalityEngine().wholeGarden(from: [stale])

        XCTAssertEqual(result.attentionState, .unknown)
        XCTAssertEqual(wholeGarden.attentionCount, 0)
        XCTAssertEqual(wholeGarden.unknownCount, 1)
    }
}
