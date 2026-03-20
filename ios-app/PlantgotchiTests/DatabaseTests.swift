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

    // MARK: - Plant Lifecycle Fields

    func testInsertAndFetchPlant_withLifecycleFields() throws {
        let plant = Plant(
            id: "plant-lc",
            userId: "user-1",
            name: "Northern Lights",
            plantType: .photo,
            strainId: "strain-1",
            strainName: "Northern Lights",
            strainType: .indica,
            environment: .indoor,
            currentPhase: .vegetative,
            phaseStartedAt: "2026-03-01T00:00:00Z",
            growId: "grow-1"
        )
        try db.savePlant(plant)

        let fetched = try db.getPlant(id: "plant-lc")
        XCTAssertNotNil(fetched)
        XCTAssertEqual(fetched?.plantType, .photo)
        XCTAssertEqual(fetched?.strainName, "Northern Lights")
        XCTAssertEqual(fetched?.strainType, .indica)
        XCTAssertEqual(fetched?.environment, .indoor)
        XCTAssertEqual(fetched?.currentPhase, .vegetative)
        XCTAssertEqual(fetched?.growId, "grow-1")
    }

    func testPlantDefaultValues_backwardCompatible() throws {
        // Create a plant with only the original required fields
        let plant = Plant(id: "p-compat", userId: "u1", name: "Old Fern")
        try db.savePlant(plant)

        let fetched = try db.getPlant(id: "p-compat")
        XCTAssertNotNil(fetched)
        XCTAssertEqual(fetched?.name, "Old Fern")
        XCTAssertNil(fetched?.plantType)
        XCTAssertNil(fetched?.strainId)
        XCTAssertNil(fetched?.strainName)
        XCTAssertNil(fetched?.strainType)
        XCTAssertNil(fetched?.environment)
        XCTAssertNil(fetched?.currentPhase)
        XCTAssertNil(fetched?.phaseStartedAt)
        XCTAssertNil(fetched?.growId)
    }

    // MARK: - v2 Migration Table Existence

    func testV2Migration_growsTableExists() throws {
        let grow = Grow(userId: "u1", name: "Spring 2026")
        try db.saveGrow(grow)
        let fetched = try db.getGrow(id: grow.id)
        XCTAssertNotNil(fetched)
        XCTAssertEqual(fetched?.name, "Spring 2026")
    }

    func testV2Migration_growLogsTableExists() throws {
        try db.savePlant(Plant(id: "p1", userId: "u1", name: "Test"))
        let log = GrowLog(plantId: "p1", userId: "u1", phase: .vegetative, logType: .watering)
        try db.addGrowLog(log)
        let logs = try db.getGrowLogs(plantId: "p1")
        XCTAssertEqual(logs.count, 1)
        XCTAssertEqual(logs[0].logType, .watering)
    }

    func testV2Migration_strainProfilesTableExists() throws {
        let strain = StrainProfile(name: "Blue Dream", type: .hybrid)
        try db.saveStrainProfile(strain)
        let fetched = try db.getStrainProfile(id: strain.id)
        XCTAssertNotNil(fetched)
        XCTAssertEqual(fetched?.name, "Blue Dream")
    }

    func testV2Migration_achievementsTableExists() throws {
        let ach = Achievement(userId: "u1", achievementKey: "first_seed", points: 10)
        try db.saveAchievement(ach)
        let achievements = try db.getAchievements(userId: "u1")
        XCTAssertEqual(achievements.count, 1)
        XCTAssertEqual(achievements[0].achievementKey, "first_seed")
        XCTAssertEqual(achievements[0].points, 10)
    }
}
