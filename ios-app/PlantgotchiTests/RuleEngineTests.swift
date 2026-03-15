import XCTest
@testable import Plantgotchi

final class RuleEngineTests: XCTestCase {

    // MARK: - Helper factories

    private func makePlant(
        name: String = "Fern",
        moistureMin: Int = 30,
        moistureMax: Int = 80,
        tempMin: Double = 15.0,
        tempMax: Double = 30.0,
        lightPreference: String = "medium"
    ) -> Plant {
        Plant(
            id: "plant-1",
            userId: "user-1",
            name: name,
            moistureMin: moistureMin,
            moistureMax: moistureMax,
            tempMin: tempMin,
            tempMax: tempMax,
            lightPreference: lightPreference
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

    // MARK: - Moisture Rules

    func testMoistureBelowMin_warning() {
        let plant = makePlant(moistureMin: 30)
        let reading = makeReading(moisture: 25)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].severity, "warning")
        XCTAssertTrue(recs[0].message.contains("needs water"))
    }

    func testMoistureBelowMin_belowCritical_urgent() {
        let plant = makePlant(moistureMin: 30)
        let reading = makeReading(moisture: 15)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].severity, "urgent")
    }

    func testMoistureAboveMax_warning() {
        let plant = makePlant(moistureMax: 80)
        let reading = makeReading(moisture: 90)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].severity, "warning")
        XCTAssertTrue(recs[0].message.contains("overwatered"))
    }

    // MARK: - Temperature Rules

    func testTempBelowMin_warning() {
        let plant = makePlant(tempMin: 15.0)
        let reading = makeReading(temperature: 12.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].severity, "warning")
        XCTAssertTrue(recs[0].message.contains("Too cold"))
    }

    func testTempBelowMin_urgent() {
        let plant = makePlant(tempMin: 15.0)
        let reading = makeReading(temperature: 8.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].severity, "urgent")
    }

    func testTempAboveMax_warning() {
        let plant = makePlant(tempMax: 30.0)
        let reading = makeReading(temperature: 33.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].severity, "warning")
        XCTAssertTrue(recs[0].message.contains("Too hot"))
    }

    func testTempAboveMax_urgent() {
        let plant = makePlant(tempMax: 30.0)
        let reading = makeReading(temperature: 36.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].severity, "urgent")
    }

    // MARK: - Battery Rules

    func testBatteryBelow15_warning() {
        let plant = makePlant()
        let reading = makeReading(battery: 10)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].severity, "warning")
        XCTAssertTrue(recs[0].message.contains("battery low"))
    }

    func testBatteryBelow5_urgent() {
        let plant = makePlant()
        let reading = makeReading(battery: 3)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].severity, "urgent")
    }

    // MARK: - Light Rules

    func testHighLightPlant_lowLight_info() {
        let plant = makePlant(lightPreference: "high")
        let reading = makeReading(light: 500)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].severity, "info")
        XCTAssertTrue(recs[0].message.contains("bright light"))
    }

    func testMediumLightPlant_lowLight_noRecommendation() {
        let plant = makePlant(lightPreference: "medium")
        let reading = makeReading(light: 500)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertTrue(recs.isEmpty)
    }

    // MARK: - All OK

    func testAllOK_emptyRecommendations() {
        let plant = makePlant()
        let reading = makeReading(
            moisture: 55,
            temperature: 22.0,
            light: 1500,
            battery: 80
        )
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertTrue(recs.isEmpty)
    }

    func testNullReadings_emptyRecommendations() {
        let plant = makePlant()
        let reading = makeReading()
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertTrue(recs.isEmpty)
    }

    // MARK: - Multiple recommendations

    func testMultipleIssues() {
        let plant = makePlant(moistureMin: 30, tempMin: 15.0, lightPreference: "high")
        let reading = makeReading(
            moisture: 10,
            temperature: 5.0,
            light: 200,
            battery: 3
        )
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        // moisture urgent + temp urgent + battery urgent + light info = 4
        XCTAssertEqual(recs.count, 4)
    }

    // MARK: - Source

    func testRecommendationSource() {
        let plant = makePlant(moistureMin: 30)
        let reading = makeReading(moisture: 25)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertEqual(recs[0].source, "rules")
    }
}
