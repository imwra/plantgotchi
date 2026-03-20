import SwiftUI

/// A card displaying a plant's summary in the garden grid.
/// Shows emoji, name, moisture bar, HP bar, and status indicator.
struct PlantCardView: View {
    let plantView: PlantView
    @ObservedObject private var themeManager = ThemeManager.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Emoji + Status
            HStack {
                Text(plantView.emoji)
                    .font(.system(size: 36))

                Spacer()

                StatusBadge(status: plantView.status)

                if let phaseName = plantView.phase {
                    Text(phaseName.capitalized)
                        .font(.system(size: 8, weight: .medium, design: .rounded))
                        .foregroundColor(PlantgotchiTheme.green)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(PlantgotchiTheme.green.opacity(0.1))
                        .cornerRadius(4)
                }
            }

            // Name
            Text(themeManager.isRetro ? plantView.name.uppercased() : plantView.name)
                .font(PlantgotchiTheme.pixelFont(size: themeManager.isRetro ? 9 : 11))
                .foregroundColor(PlantgotchiTheme.text)
                .lineLimit(1)

            // Species
            if !plantView.species.isEmpty {
                Text(plantView.species)
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
                    .lineLimit(1)
            }

            Spacer(minLength: 4)

            // Moisture bar
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Image(systemName: "drop.fill")
                        .font(.caption2)
                        .foregroundColor(PlantgotchiTheme.blue)
                    Text(plantView.moisture.map { "\($0)%" } ?? "--")
                        .font(PlantgotchiTheme.captionFont)
                        .foregroundColor(PlantgotchiTheme.text)
                }
                MoistureBar(
                    moisture: plantView.moisture,
                    min: plantView.moistureMin,
                    max: plantView.moistureMax
                )
            }

            // HP bar
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Image(systemName: "heart.fill")
                        .font(.caption2)
                        .foregroundColor(PlantgotchiTheme.red)
                    Text("HP \(plantView.hp)")
                        .font(PlantgotchiTheme.captionFont)
                        .foregroundColor(PlantgotchiTheme.text)
                }
                PixelHPBar(hp: plantView.hp)
            }
        }
        .plantgotchiCard()
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: PlantStatus
    @ObservedObject private var themeManager = ThemeManager.shared

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(PlantgotchiTheme.statusColor(status))
                .frame(width: 8, height: 8)
            Text(themeManager.isRetro ? statusLabel.uppercased() : statusLabel)
                .font(themeManager.isRetro
                    ? .system(size: 8, weight: .bold, design: .monospaced)
                    : .system(size: 9, weight: .medium, design: .rounded))
                .foregroundColor(PlantgotchiTheme.statusColor(status))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(PlantgotchiTheme.statusColor(status).opacity(0.15))
        .cornerRadius(themeManager.isRetro ? 2 : 8)
    }

    private var statusLabel: String {
        switch status {
        case .happy: return S.statusHappy
        case .thirsty: return S.statusThirsty
        case .unknown: return S.statusUnknown
        }
    }
}

#Preview {
    PlantCardView(plantView: PlantView(
        id: "1",
        name: "Fern",
        species: "Boston Fern",
        emoji: "\u{1F33F}",
        moisture: 55,
        temp: 22.5,
        light: 1500,
        lightLabel: "medium",
        lastWatered: nil,
        status: .happy,
        hp: 85,
        moistureMin: 30,
        moistureMax: 80,
        tempMin: 15.0,
        tempMax: 30.0,
        phase: nil
    ))
    .frame(width: 180)
    .padding()
    .background(PlantgotchiTheme.cream)
}
