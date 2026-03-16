import XCTest
@testable import Plantgotchi

final class PlantViewTests: XCTestCase {

    // MARK: - getLightLabel

    func testGetLightLabel_null() {
        XCTAssertEqual(getLightLabel(light: nil), "unknown")
    }

    func testGetLightLabel_low() {
        XCTAssertEqual(getLightLabel(light: 500), "low")
        XCTAssertEqual(getLightLabel(light: 999), "low")
    }

    func testGetLightLabel_medium() {
        XCTAssertEqual(getLightLabel(light: 1000), "medium")
        XCTAssertEqual(getLightLabel(light: 1500), "medium")
        XCTAssertEqual(getLightLabel(light: 2000), "medium")
    }

    func testGetLightLabel_high() {
        XCTAssertEqual(getLightLabel(light: 2001), "high")
        XCTAssertEqual(getLightLabel(light: 50000), "high")
    }

    // MARK: - computeHP

    func testComputeHP_perfectMiddle() {
        // Moisture exactly at midpoint, temp exactly at midpoint
        let hp = computeHP(
            moisture: 55,
            temp: 22.5,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(hp, 100)
    }

    func testComputeHP_atMin() {
        // Moisture at moistureMin edge = score 0
        let hp = computeHP(
            moisture: 30,
            temp: nil,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(hp, 0)
    }

    func testComputeHP_atMax() {
        // Moisture at moistureMax edge = score 0
        let hp = computeHP(
            moisture: 80,
            temp: nil,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(hp, 0)
    }

    func testComputeHP_noReadings() {
        let hp = computeHP(
            moisture: nil,
            temp: nil,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(hp, 50)
    }

    func testComputeHP_outsideRange_clampedToZero() {
        let hp = computeHP(
            moisture: 0,
            temp: nil,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(hp, 0)
    }

    // MARK: - computeStatus

    func testComputeStatus_happy() {
        let status = computeStatus(
            moisture: 55,
            temp: 22.0,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(status, .happy)
    }

    func testComputeStatus_thirsty_moistureLow() {
        let status = computeStatus(
            moisture: 20,
            temp: 22.0,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(status, .thirsty)
    }

    func testComputeStatus_thirsty_moistureHigh() {
        let status = computeStatus(
            moisture: 90,
            temp: 22.0,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(status, .thirsty)
    }

    func testComputeStatus_thirsty_tempLow() {
        let status = computeStatus(
            moisture: 55,
            temp: 10.0,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(status, .thirsty)
    }

    func testComputeStatus_thirsty_tempHigh() {
        let status = computeStatus(
            moisture: 55,
            temp: 35.0,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(status, .thirsty)
    }

    func testComputeStatus_unknown() {
        let status = computeStatus(
            moisture: nil,
            temp: nil,
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        XCTAssertEqual(status, .unknown)
    }

    // MARK: - toPlantView

    func testToPlantView_withReading() {
        let plant = Plant(
            id: "p1",
            userId: "u1",
            name: "Fern",
            species: "Boston Fern",
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 15.0,
            tempMax: 30.0
        )
        let reading = SensorReading(
            plantId: "p1",
            sensorId: "s1",
            moisture: 55,
            temperature: 22.5,
            light: 1500,
            battery: 80
        )
        let logs = [
            CareLog(plantId: "p1", userId: "u1", action: "water", createdAt: "2026-03-14T10:00:00")
        ]

        let view = toPlantView(plant: plant, latestReading: reading, recentCareLogs: logs)
        XCTAssertEqual(view.name, "Fern")
        XCTAssertEqual(view.moisture, 55)
        XCTAssertEqual(view.temp, 22.5)
        XCTAssertEqual(view.lightLabel, "medium")
        XCTAssertEqual(view.status, .happy)
        XCTAssertEqual(view.hp, 100)
        XCTAssertEqual(view.lastWatered, "2026-03-14T10:00:00")
    }

    func testToPlantView_noReading() {
        let plant = Plant(id: "p1", userId: "u1", name: "Fern")
        let view = toPlantView(plant: plant, latestReading: nil, recentCareLogs: [])
        XCTAssertNil(view.moisture)
        XCTAssertNil(view.temp)
        XCTAssertEqual(view.status, .unknown)
        XCTAssertEqual(view.hp, 50)
        XCTAssertNil(view.lastWatered)
    }
}
