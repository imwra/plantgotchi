import XCTest
@testable import Plantgotchi

final class DatabaseTests: XCTestCase {

    var db: AppDatabase!

    override func setUpWithError() throws {
        db = try AppDatabase.makeEmpty()
    }

    // MARK: - Plant CRUD

    func testInsertAndFetchPlant() throws {
        let plant = Plant(
            id: "plant-1",
            userId: "user-1",
            name: "Fern",
            species: "Boston Fern",
            emoji: "\u{1F33F}",
            moistureMin: 40,
            moistureMax: 70,
            tempMin: 18.0,
            tempMax: 28.0,
            lightPreference: "medium"
        )
        try db.savePlant(plant)

        let fetched = try db.getPlant(id: "plant-1")
        XCTAssertNotNil(fetched)
        XCTAssertEqual(fetched?.name, "Fern")
        XCTAssertEqual(fetched?.species, "Boston Fern")
        XCTAssertEqual(fetched?.moistureMin, 40)
        XCTAssertEqual(fetched?.tempMax, 28.0)
    }

    func testGetPlantsForUser() throws {
        try db.savePlant(Plant(id: "p1", userId: "u1", name: "Aloe"))
        try db.savePlant(Plant(id: "p2", userId: "u1", name: "Basil"))
        try db.savePlant(Plant(id: "p3", userId: "u2", name: "Cactus"))

        let userPlants = try db.getPlants(userId: "u1")
        XCTAssertEqual(userPlants.count, 2)
        // Ordered by name
        XCTAssertEqual(userPlants[0].name, "Aloe")
        XCTAssertEqual(userPlants[1].name, "Basil")
    }

    func testDeletePlant() throws {
        try db.savePlant(Plant(id: "p1", userId: "u1", name: "Aloe"))
        try db.deletePlant(id: "p1")
        let fetched = try db.getPlant(id: "p1")
        XCTAssertNil(fetched)
    }

    // MARK: - Sensor Readings

    func testInsertAndFetchLatestReading() throws {
        try db.savePlant(Plant(id: "p1", userId: "u1", name: "Fern"))

        let reading1 = SensorReading(
            plantId: "p1",
            sensorId: "sensor-A",
            moisture: 55,
            temperature: 22.5,
            light: 1500,
            battery: 85
        )
        try db.addSensorReading(reading1)

        let latest = try db.getLatestReading(plantId: "p1")
        XCTAssertNotNil(latest)
        XCTAssertEqual(latest?.moisture, 55)
        XCTAssertEqual(latest?.temperature, 22.5)
        XCTAssertEqual(latest?.light, 1500)
        XCTAssertEqual(latest?.battery, 85)
        XCTAssertEqual(latest?.sensorId, "sensor-A")
    }

    // MARK: - Care Logs

    func testInsertAndFetchCareLog() throws {
        try db.savePlant(Plant(id: "p1", userId: "u1", name: "Fern"))

        let log = CareLog(
            id: "log-1",
            plantId: "p1",
            userId: "u1",
            action: "water",
            notes: "Watered generously"
        )
        try db.addCareLog(log)

        let logs = try db.getCareLogs(plantId: "p1")
        XCTAssertEqual(logs.count, 1)
        XCTAssertEqual(logs[0].action, "water")
        XCTAssertEqual(logs[0].notes, "Watered generously")
    }

    // MARK: - Recommendations

    func testInsertAndFetchRecommendation() throws {
        try db.savePlant(Plant(id: "p1", userId: "u1", name: "Fern"))

        let rec = Recommendation(
            id: "rec-1",
            plantId: "p1",
            source: "rules",
            message: "Fern needs water!",
            severity: "warning"
        )
        try db.addRecommendation(rec)

        let recs = try db.getRecommendations(plantId: "p1")
        XCTAssertEqual(recs.count, 1)
        XCTAssertEqual(recs[0].message, "Fern needs water!")
        XCTAssertEqual(recs[0].severity, "warning")
        XCTAssertFalse(recs[0].actedOn)
    }

    func testMarkRecommendationActedOn() throws {
        try db.savePlant(Plant(id: "p1", userId: "u1", name: "Fern"))
        try db.addRecommendation(Recommendation(
            id: "rec-1",
            plantId: "p1",
            source: "rules",
            message: "Water now!",
            severity: "urgent"
        ))

        try db.markRecommendationActedOn(id: "rec-1")

        let recs = try db.getRecommendations(plantId: "p1")
        XCTAssertTrue(recs[0].actedOn)
    }
}
