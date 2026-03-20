import XCTest
@testable import Plantgotchi

final class PhaseAwareRuleEngineTests: XCTestCase {

    // MARK: - Helper factories

    private func makePlant(
        name: String = "TestPlant",
        moistureMin: Int = 30,
        moistureMax: Int = 80,
        tempMin: Double = 15.0,
        tempMax: Double = 28.0,
        lightPreference: String = "medium",
        plantType: PlantType? = nil,
        currentPhase: Phase? = nil,
        phaseStartedAt: String? = nil
    ) -> Plant {
        Plant(
            id: "plant-1",
            userId: "user-1",
            name: name,
            moistureMin: moistureMin,
            moistureMax: moistureMax,
            tempMin: tempMin,
            tempMax: tempMax,
            lightPreference: lightPreference,
            plantType: plantType,
            currentPhase: currentPhase,
            phaseStartedAt: phaseStartedAt
        )
    }

    private func makeReading(
        moisture: Int? = nil,
        temperature: Double? = nil,
        light: Int? = nil,
        battery: Int? = nil
    ) -> SensorReading {
        SensorReading(
            plantId: "plant-1",
            sensorId: "sensor-A",
            moisture: moisture,
            temperature: temperature,
            light: light,
            battery: battery
        )
    }

    /// Returns an ISO 8601 date string for a date `daysAgo` days in the past.
    private func dateString(daysAgo: Int) -> String {
        let date = Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date())!
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }

    // MARK: - Phase-Aware Threshold Tests

    func testSeedling_lowTemp_warning() {
        // Seedling phase defaults: tempMin = 20, tempMax = 26
        // Temperature of 19 is below seedling min of 20 but above plant-level min of 15
        let plant = makePlant(
            tempMin: 15.0,
            tempMax: 30.0,
            currentPhase: .seedling,
            phaseStartedAt: dateString(daysAgo: 3)
        )
        let reading = makeReading(temperature: 19.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)

        let tempRecs = recs.filter { $0.message.contains("Too cold") }
        XCTAssertEqual(tempRecs.count, 1, "Should warn about temp below seedling min")
        XCTAssertEqual(tempRecs[0].severity, "warning")
    }

    func testFlowering_usesFloweringThresholds() {
        // Flowering phase defaults: tempMin = 18, tempMax = 26
        // Plant-level tempMax = 28. Temp of 27 should trigger warning with phase thresholds
        // but would be OK with plant-level thresholds.
        let plant = makePlant(
            tempMin: 15.0,
            tempMax: 28.0,
            currentPhase: .flowering,
            phaseStartedAt: dateString(daysAgo: 7)
        )
        let reading = makeReading(temperature: 27.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)

        let tempRecs = recs.filter { $0.message.contains("Too hot") }
        XCTAssertEqual(tempRecs.count, 1, "Should warn about temp above flowering max of 26")
    }

    func testCompletedPhase_noSensorAlerts() {
        let plant = makePlant(
            moistureMin: 30,
            tempMin: 15.0,
            tempMax: 30.0,
            currentPhase: .complete
        )
        // Extreme values that would normally trigger alerts
        let reading = makeReading(moisture: 5, temperature: 50.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)

        XCTAssertTrue(recs.isEmpty, "Complete phase should produce no sensor alerts")
    }

    func testProcessingPhase_noSensorAlerts() {
        let plant = makePlant(
            moistureMin: 30,
            tempMin: 15.0,
            tempMax: 30.0,
            currentPhase: .processing
        )
        // Extreme values that would normally trigger alerts
        let reading = makeReading(moisture: 5, temperature: 50.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)

        XCTAssertTrue(recs.isEmpty, "Processing phase should produce no sensor alerts")
    }

    func testNilPhase_usesPlantLevelThresholds() {
        // No phase set — should use plant-level thresholds (backward compat)
        let plant = makePlant(
            tempMin: 15.0,
            tempMax: 30.0
            // currentPhase is nil by default
        )
        // 14 is below plant-level min of 15
        let reading = makeReading(temperature: 14.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)

        let tempRecs = recs.filter { $0.message.contains("Too cold") }
        XCTAssertEqual(tempRecs.count, 1)
        XCTAssertTrue(tempRecs[0].message.contains("15.0"), "Should reference plant-level min of 15.0")
    }

    // MARK: - Transition Suggestion Tests

    func testVegTransitionSuggestion_after6Weeks() {
        // Photo plant in veg for >= 42 days should suggest flipping to flower
        let plant = makePlant(
            plantType: .photo,
            currentPhase: .vegetative,
            phaseStartedAt: dateString(daysAgo: 43)
        )
        let reading = makeReading(temperature: 24.0) // Normal reading, no alerts
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)

        let suggestions = recs.filter { $0.message.contains("ready to flip to flower") }
        XCTAssertEqual(suggestions.count, 1, "Should suggest flipping to flower after 42+ days")
        XCTAssertEqual(suggestions[0].severity, "info")
    }

    func testAutoVegTransitionSuggestion_after3Weeks() {
        let plant = makePlant(
            plantType: .auto,
            currentPhase: .vegetative,
            phaseStartedAt: dateString(daysAgo: 22)
        )
        let reading = makeReading(temperature: 24.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)

        let suggestions = recs.filter { $0.message.contains("most autos start flowering") }
        XCTAssertEqual(suggestions.count, 1)
    }

    func testDryingTransitionSuggestion_after7Days() {
        let plant = makePlant(
            currentPhase: .drying,
            phaseStartedAt: dateString(daysAgo: 8)
        )
        let reading = makeReading(temperature: 20.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)

        let suggestions = recs.filter { $0.message.contains("small stems snap cleanly") }
        XCTAssertEqual(suggestions.count, 1)
    }

    // MARK: - resolveThresholds direct tests

    func testResolveThresholds_nilPhase_returnsPlantLevel() {
        let plant = makePlant(moistureMin: 20, moistureMax: 90, tempMin: 10.0, tempMax: 35.0)
        let thresholds = RuleEngine.resolveThresholds(plant: plant)
        XCTAssertEqual(thresholds.tempMin, 10.0)
        XCTAssertEqual(thresholds.tempMax, 35.0)
        XCTAssertEqual(thresholds.moistureMin, 20)
        XCTAssertEqual(thresholds.moistureMax, 90)
    }

    func testResolveThresholds_seedling_usesPhaseTemp() {
        let plant = makePlant(
            moistureMin: 25,
            moistureMax: 85,
            tempMin: 10.0,
            tempMax: 35.0,
            currentPhase: .seedling,
            phaseStartedAt: dateString(daysAgo: 1)
        )
        let thresholds = RuleEngine.resolveThresholds(plant: plant)
        // Seedling defaults: tempMin=20, tempMax=26
        XCTAssertEqual(thresholds.tempMin, 20.0)
        XCTAssertEqual(thresholds.tempMax, 26.0)
        // Moisture stays plant-level
        XCTAssertEqual(thresholds.moistureMin, 25)
        XCTAssertEqual(thresholds.moistureMax, 85)
    }

    func testResolveThresholds_lateFlowering_usesLateFlowerDefaults() {
        let plant = makePlant(
            currentPhase: .flowering,
            phaseStartedAt: dateString(daysAgo: 50) // Well past 6 weeks (42 days)
        )
        let thresholds = RuleEngine.resolveThresholds(plant: plant)
        // Late flower defaults: tempMin=18, tempMax=26
        XCTAssertEqual(thresholds.tempMin, Phase.lateFlowerDefaults.tempMinC)
        XCTAssertEqual(thresholds.tempMax, Phase.lateFlowerDefaults.tempMaxC)
    }

    // MARK: - Light rule phase awareness

    func testLightRule_notAppliedInDryingPhase() {
        let plant = makePlant(
            lightPreference: "high",
            currentPhase: .drying,
            phaseStartedAt: dateString(daysAgo: 2)
        )
        let reading = makeReading(light: 500)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)

        let lightRecs = recs.filter { $0.message.contains("bright light") }
        XCTAssertTrue(lightRecs.isEmpty, "Light rule should not apply in drying phase")
    }

    func testLightRule_appliedInVegetativePhase() {
        let plant = makePlant(
            lightPreference: "high",
            currentPhase: .vegetative,
            phaseStartedAt: dateString(daysAgo: 5)
        )
        let reading = makeReading(light: 500)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)

        let lightRecs = recs.filter { $0.message.contains("bright light") }
        XCTAssertEqual(lightRecs.count, 1, "Light rule should apply in vegetative (growing) phase")
    }
}
