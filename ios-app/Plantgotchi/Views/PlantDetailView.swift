import SwiftUI
import PostHog

/// Detailed view for a single plant showing sensor readings, care log,
/// recommendations, and quick-action buttons.
struct PlantDetailView: View {
    let plantId: String

    @State private var plant: Plant?
    @State private var latestReading: SensorReading?
    @State private var careLogs: [CareLog] = []
    @State private var recommendations: [Recommendation] = []
    @State private var plantView: PlantView?

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    var body: some View {
        ScrollView {
            if let plant = plant, let pv = plantView {
                VStack(spacing: 20) {
                    // Header
                    headerSection(plant: plant, pv: pv)

                    // Sensor readings
                    readingsSection(pv: pv)

                    // Quick actions
                    actionsSection(plant: plant)

                    // Recommendations
                    if !recommendations.isEmpty {
                        recommendationsSection
                    }

                    // Care log
                    if !careLogs.isEmpty {
                        careLogSection
                    }
                }
                .padding()
            } else {
                ProgressView()
                    .padding(.top, 100)
            }
        }
        .background(PlantgotchiTheme.background.ignoresSafeArea())
        .navigationTitle(plant?.name ?? S.plant)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadData()
        }
    }

    // MARK: - Header

    private func headerSection(plant: Plant, pv: PlantView) -> some View {
        VStack(spacing: 12) {
            Text(plant.emoji)
                .font(.system(size: 72))

            Text(plant.name)
                .font(PlantgotchiTheme.pixelFont(size: 16))
                .foregroundColor(PlantgotchiTheme.text)

            if let species = plant.species, !species.isEmpty {
                Text(species)
                    .font(PlantgotchiTheme.bodyFont)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
            }

            HStack(spacing: 16) {
                StatusBadge(status: pv.status)

                HStack(spacing: 4) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(PlantgotchiTheme.red)
                    Text("HP \(pv.hp)")
                        .font(PlantgotchiTheme.captionFont)
                        .foregroundColor(PlantgotchiTheme.text)
                }
            }

            PixelHPBar(hp: pv.hp)
                .padding(.horizontal, 40)
        }
    }

    // MARK: - Readings

    private func readingsSection(pv: PlantView) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.sensorReadings)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ReadingTile(
                    icon: "drop.fill",
                    label: S.moisture,
                    value: pv.moisture.map { "\($0)%" } ?? "--",
                    color: PlantgotchiTheme.blue
                )
                ReadingTile(
                    icon: "thermometer.medium",
                    label: S.temperature,
                    value: pv.temp.map { String(format: "%.1f\u{00B0}C", $0) } ?? "--",
                    color: PlantgotchiTheme.red
                )
                ReadingTile(
                    icon: "sun.max.fill",
                    label: S.light,
                    value: pv.light.map { "\($0) lux" } ?? "--",
                    subtitle: S.lightLabel(pv.lightLabel),
                    color: PlantgotchiTheme.yellow
                )
                ReadingTile(
                    icon: "battery.75percent",
                    label: S.battery,
                    value: latestReading?.battery.map { "\($0)%" } ?? "--",
                    color: PlantgotchiTheme.green
                )
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Actions

    private func actionsSection(plant: Plant) -> some View {
        HStack(spacing: 12) {
            ActionButton(
                icon: "drop.fill",
                label: S.water,
                color: PlantgotchiTheme.blue
            ) {
                logCare(action: "water")
            }

            ActionButton(
                icon: "leaf.fill",
                label: S.fertilize,
                color: PlantgotchiTheme.green
            ) {
                logCare(action: "fertilize")
            }

            ActionButton(
                icon: "scissors",
                label: S.prune,
                color: PlantgotchiTheme.purple
            ) {
                logCare(action: "prune")
            }

            ActionButton(
                icon: "arrow.triangle.2.circlepath",
                label: S.repot,
                color: PlantgotchiTheme.yellow
            ) {
                logCare(action: "repot")
            }
        }
    }

    // MARK: - Recommendations

    private var recommendationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.recommendations)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            ForEach(recommendations) { rec in
                HStack(alignment: .top, spacing: 10) {
                    Circle()
                        .fill(PlantgotchiTheme.severityColor(rec.severity))
                        .frame(width: 8, height: 8)
                        .padding(.top, 6)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(rec.message)
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text)

                        if rec.actedOn {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.caption2)
                                    .foregroundColor(PlantgotchiTheme.green)
                                Text(LocaleManager.shared.locale == .ptBR ? "feito" : "done")
                                    .font(.caption2)
                                    .foregroundColor(PlantgotchiTheme.green)
                            }
                        }
                    }

                    Spacer()

                    if !rec.actedOn {
                        Button(action: { markActedOn(rec) }) {
                            Image(systemName: "checkmark")
                                .font(.caption)
                                .foregroundColor(PlantgotchiTheme.green)
                                .padding(6)
                                .background(PlantgotchiTheme.green.opacity(0.1))
                                .clipShape(Circle())
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Care Log

    private var careLogSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.careLog)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            ForEach(careLogs) { log in
                HStack(spacing: 10) {
                    Image(systemName: careIcon(log.action))
                        .foregroundColor(PlantgotchiTheme.green)
                        .frame(width: 24)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(S.careAction(log.action))
                            .font(PlantgotchiTheme.bodyFont.weight(.medium))
                            .foregroundColor(PlantgotchiTheme.text)
                        if let notes = log.notes, !notes.isEmpty {
                            Text(notes)
                                .font(PlantgotchiTheme.captionFont)
                                .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
                        }
                    }

                    Spacer()

                    if let date = log.createdAt {
                        Text(formatDate(date))
                            .font(.caption2)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.4))
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Data

    @MainActor
    private func loadData() async {
        let db = AppDatabase.shared
        do {
            plant = try db.getPlant(id: plantId)
            latestReading = try db.getLatestReading(plantId: plantId)
            careLogs = try db.getCareLogs(plantId: plantId, limit: 20)
            recommendations = try db.getRecommendations(plantId: plantId, limit: 10)

            if let plant = plant {
                plantView = toPlantView(
                    plant: plant,
                    latestReading: latestReading,
                    recentCareLogs: careLogs
                )
            }
            PostHogSDK.shared.capture("recommendation_viewed", properties: [
                "plant_id": plantId,
                "recommendation_count": recommendations.count,
            ])
        } catch {
            print("[PlantDetailView] Failed to load: \(error)")
        }
    }

    private func logCare(action: String) {
        let log = CareLog(
            plantId: plantId,
            userId: userId,
            action: action
        )
        do {
            try AppDatabase.shared.addCareLog(log)
            PostHogSDK.shared.capture("care_logged", properties: [
                "plant_id": plantId,
                "action": action,
            ])
            Task { await loadData() }
        } catch {
            print("[PlantDetailView] Failed to log care: \(error)")
        }
    }

    private func markActedOn(_ rec: Recommendation) {
        do {
            try AppDatabase.shared.markRecommendationActedOn(id: rec.id)
            Task { await loadData() }
        } catch {
            print("[PlantDetailView] Failed to mark acted on: \(error)")
        }
    }

    // MARK: - Helpers

    private func careIcon(_ action: String) -> String {
        switch action {
        case "water": return "drop.fill"
        case "fertilize": return "leaf.fill"
        case "prune": return "scissors"
        case "repot": return "arrow.triangle.2.circlepath"
        default: return "hand.raised.fill"
        }
    }

    private func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: iso) {
            let relative = RelativeDateTimeFormatter()
            relative.unitsStyle = .short
            relative.locale = LocaleManager.shared.locale == .ptBR
                ? Locale(identifier: "pt_BR")
                : Locale(identifier: "en_US")
            return relative.localizedString(for: date, relativeTo: Date())
        }
        return String(iso.prefix(10))
    }
}

// MARK: - Sub-Views

struct ReadingTile: View {
    let icon: String
    let label: String
    let value: String
    var subtitle: String? = nil
    let color: Color

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text(value)
                .font(PlantgotchiTheme.pixelFont(size: 11))
                .foregroundColor(PlantgotchiTheme.text)

            Text(label)
                .font(.caption2)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(color.opacity(0.8))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(color.opacity(0.08))
        .cornerRadius(8)
    }
}

struct ActionButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                Text(label)
                    .font(.caption2)
                    .foregroundColor(PlantgotchiTheme.text)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(color.opacity(0.1))
            .cornerRadius(8)
        }
    }
}
