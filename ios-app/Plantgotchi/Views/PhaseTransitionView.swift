#if os(iOS)
import SwiftUI

/// A sheet view for confirming a plant phase transition.
/// Shows current and target phase, recommended thresholds, and optional notes.
struct PhaseTransitionView: View {
    let plant: Plant
    let targetPhase: Phase
    var onComplete: (() -> Void)?

    @Environment(\.dismiss) private var dismiss
    @State private var notes: String = ""

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Phase transition visualization
                    transitionHeader

                    // Recommended thresholds for target phase
                    thresholdsSection

                    // Notes
                    notesSection
                }
                .padding()
            }
            .background(PlantgotchiTheme.background.ignoresSafeArea())
            .navigationTitle("Phase Transition")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Confirm") {
                        confirmTransition()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }

    // MARK: - Transition Header

    private var transitionHeader: some View {
        VStack(spacing: 16) {
            Text(plant.emoji)
                .font(.system(size: 48))

            Text(plant.name)
                .font(PlantgotchiTheme.pixelFont(size: 14))
                .foregroundColor(PlantgotchiTheme.text)

            HStack(spacing: 16) {
                // Current phase
                VStack(spacing: 4) {
                    Text("Current")
                        .font(.caption2)
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                    Text((plant.currentPhase?.rawValue ?? "none").capitalized)
                        .font(PlantgotchiTheme.pixelFont(size: 11))
                        .foregroundColor(PlantgotchiTheme.green)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(PlantgotchiTheme.green.opacity(0.1))
                        .cornerRadius(8)
                }

                // Arrow
                Image(systemName: "arrow.right")
                    .font(.title3.weight(.semibold))
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.4))

                // Target phase
                VStack(spacing: 4) {
                    Text("Target")
                        .font(.caption2)
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                    Text(targetPhase.rawValue.capitalized)
                        .font(PlantgotchiTheme.pixelFont(size: 11))
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(PlantgotchiTheme.green)
                        .cornerRadius(8)
                }
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Thresholds

    private var thresholdsSection: some View {
        let defaults = targetPhase.defaults

        return VStack(alignment: .leading, spacing: 12) {
            Text("Recommended Thresholds")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                thresholdTile(
                    icon: "thermometer.medium",
                    label: "Temperature",
                    value: "\(Int(defaults.tempMinC))-\(Int(defaults.tempMaxC))\u{00B0}C",
                    color: PlantgotchiTheme.red
                )
                thresholdTile(
                    icon: "humidity",
                    label: "Humidity",
                    value: "\(Int(defaults.rhMin))-\(Int(defaults.rhMax))%",
                    color: PlantgotchiTheme.blue
                )
                thresholdTile(
                    icon: "sun.max.fill",
                    label: "Light Schedule",
                    value: defaults.lightSchedule,
                    color: PlantgotchiTheme.yellow
                )
                thresholdTile(
                    icon: "leaf.fill",
                    label: "Monitoring",
                    value: targetPhase.hasMonitoring ? "Active" : "Off",
                    color: PlantgotchiTheme.green
                )
            }
        }
        .plantgotchiCard()
    }

    private func thresholdTile(icon: String, label: String, value: String, color: Color) -> some View {
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
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(color.opacity(0.08))
        .cornerRadius(8)
    }

    // MARK: - Notes

    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Notes (optional)")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            TextEditor(text: $notes)
                .font(PlantgotchiTheme.bodyFont)
                .frame(minHeight: 80)
                .padding(8)
                .background(PlantgotchiTheme.text.opacity(0.05))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(PlantgotchiTheme.text.opacity(0.1), lineWidth: 1)
                )
        }
        .plantgotchiCard()
    }

    // MARK: - Actions

    private func confirmTransition() {
        do {
            try AppDatabase.shared.transitionPlantPhase(
                plantId: plant.id,
                to: targetPhase,
                userId: userId,
                notes: notes.isEmpty ? nil : notes
            )
            Analytics.track("phase_transitioned", properties: [
                "plant_id": plant.id,
                "from_phase": plant.currentPhase?.rawValue ?? "none",
                "to_phase": targetPhase.rawValue
            ])
            onComplete?()
            dismiss()
        } catch {
            print("[PhaseTransitionView] Failed to transition phase: \(error)")
        }
    }
}
#endif
