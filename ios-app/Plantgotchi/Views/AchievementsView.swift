#if os(iOS)
import SwiftUI

/// View showing unlocked achievements and total points.
struct AchievementsView: View {
    @State private var achievements: [Achievement] = []
    @State private var totalPoints: Int = 0

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Points header
                VStack(spacing: 8) {
                    Image(systemName: "star.circle.fill")
                        .font(.system(size: 48))
                        .foregroundColor(PlantgotchiTheme.yellow)
                    Text("\(totalPoints)")
                        .font(PlantgotchiTheme.pixelFont(size: 20))
                        .foregroundColor(PlantgotchiTheme.text)
                    Text("Total Points")
                        .font(PlantgotchiTheme.captionFont)
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                }
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity)
                .plantgotchiCard()

                // All achievements
                VStack(alignment: .leading, spacing: 12) {
                    Text("Achievements")
                        .font(PlantgotchiTheme.pixelFont(size: 9))
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

                    ForEach(AchievementDef.allCases, id: \.rawValue) { def in
                        let unlocked = achievements.contains { $0.achievementKey == def.key }
                        achievementRow(def: def, unlocked: unlocked)
                    }
                }
                .plantgotchiCard()
            }
            .padding()
        }
        .background(PlantgotchiTheme.background.ignoresSafeArea())
        .navigationTitle("Achievements")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            loadAchievements()
        }
    }

    private func achievementRow(def: AchievementDef, unlocked: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: unlocked ? "trophy.fill" : "trophy")
                .font(.title3)
                .foregroundColor(unlocked ? PlantgotchiTheme.yellow : PlantgotchiTheme.text.opacity(0.2))
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text(def.label)
                    .font(PlantgotchiTheme.bodyFont.weight(.medium))
                    .foregroundColor(unlocked ? PlantgotchiTheme.text : PlantgotchiTheme.text.opacity(0.3))
                Text("\(def.points) pts")
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(unlocked ? PlantgotchiTheme.green : PlantgotchiTheme.text.opacity(0.2))
            }

            Spacer()

            if unlocked {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(PlantgotchiTheme.green)
            }
        }
        .padding(.vertical, 4)
        .opacity(unlocked ? 1.0 : 0.6)
    }

    private func loadAchievements() {
        do {
            achievements = try AppDatabase.shared.getAchievements(userId: userId)
            totalPoints = try AppDatabase.shared.getTotalPoints(userId: userId)
        } catch {
            print("[AchievementsView] Failed to load: \(error)")
        }
    }
}
#endif
