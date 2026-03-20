import Foundation

/// Checks plant and log data to unlock achievements for a user.
enum AchievementEngine {
    /// Check all achievement conditions and unlock any that are newly met.
    static func checkAndUnlock(userId: String, db: AppDatabase) throws {
        let plants = try db.getPlants(userId: userId)

        // First Seed: user has at least one plant with a phase set
        if !(try db.hasAchievement(userId: userId, key: AchievementDef.firstSeed.key)) {
            if plants.contains(where: { $0.currentPhase != nil }) {
                try db.saveAchievement(Achievement(
                    userId: userId,
                    achievementKey: AchievementDef.firstSeed.key,
                    points: AchievementDef.firstSeed.points
                ))
            }
        }

        // First Harvest: user has a plant in drying or later
        if !(try db.hasAchievement(userId: userId, key: AchievementDef.firstHarvest.key)) {
            let postHarvest: [Phase] = [.drying, .curing, .processing, .complete]
            if plants.contains(where: { p in p.currentPhase.map { postHarvest.contains($0) } ?? false }) {
                try db.saveAchievement(Achievement(
                    userId: userId,
                    achievementKey: AchievementDef.firstHarvest.key,
                    points: AchievementDef.firstHarvest.points
                ))
            }
        }

        // Ten Plants
        if !(try db.hasAchievement(userId: userId, key: AchievementDef.tenPlants.key)) {
            if plants.count >= 10 {
                try db.saveAchievement(Achievement(
                    userId: userId,
                    achievementKey: AchievementDef.tenPlants.key,
                    points: AchievementDef.tenPlants.points
                ))
            }
        }
    }
}
