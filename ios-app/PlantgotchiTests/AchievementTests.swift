import XCTest
@testable import Plantgotchi

final class AchievementTests: XCTestCase {
    var db: AppDatabase!

    override func setUpWithError() throws {
        db = try AppDatabase.makeEmpty()
    }

    func testFirstSeedUnlocks() throws {
        try db.savePlant(Plant(
            id: "p1", userId: "u1", name: "Test",
            plantType: .photo, currentPhase: .germination
        ))
        let log = GrowLog(plantId: "p1", userId: "u1", phase: .germination, logType: .phaseChange)
        try db.addGrowLog(log)

        try AchievementEngine.checkAndUnlock(userId: "u1", db: db)

        let achievements = try db.getAchievements(userId: "u1")
        XCTAssertTrue(achievements.contains { $0.achievementKey == "first_seed" })
    }

    func testFirstSeedDoesNotDuplicate() throws {
        try db.savePlant(Plant(
            id: "p1", userId: "u1", name: "Test",
            plantType: .photo, currentPhase: .germination
        ))
        let log = GrowLog(plantId: "p1", userId: "u1", phase: .germination, logType: .phaseChange)
        try db.addGrowLog(log)

        try AchievementEngine.checkAndUnlock(userId: "u1", db: db)
        try AchievementEngine.checkAndUnlock(userId: "u1", db: db)

        let achievements = try db.getAchievements(userId: "u1")
        let seedAchievements = achievements.filter { $0.achievementKey == "first_seed" }
        XCTAssertEqual(seedAchievements.count, 1)
    }

    func testTotalPoints() throws {
        try db.saveAchievement(Achievement(userId: "u1", achievementKey: "first_seed", points: 10))
        try db.saveAchievement(Achievement(userId: "u1", achievementKey: "first_harvest", points: 50))

        let total = try db.getTotalPoints(userId: "u1")
        XCTAssertEqual(total, 60)
    }

    func testFirstHarvestUnlocks() throws {
        try db.savePlant(Plant(
            id: "p1", userId: "u1", name: "Test",
            plantType: .photo, currentPhase: .drying
        ))

        try AchievementEngine.checkAndUnlock(userId: "u1", db: db)

        let achievements = try db.getAchievements(userId: "u1")
        XCTAssertTrue(achievements.contains { $0.achievementKey == "first_harvest" })
    }

    func testNoAchievementsForEmptyUser() throws {
        try AchievementEngine.checkAndUnlock(userId: "u1", db: db)
        let achievements = try db.getAchievements(userId: "u1")
        XCTAssertTrue(achievements.isEmpty)
    }
}
