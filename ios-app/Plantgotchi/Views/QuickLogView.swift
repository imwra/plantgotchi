#if os(iOS)
import SwiftUI

/// Phase-aware quick action buttons for logging grow events.
struct QuickLogView: View {
    let plant: Plant
    var onLog: (() -> Void)?

    @State private var showMeasurementSheet = false

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    private var availableActions: [GrowLogType] {
        let actions = plant.currentPhase?.availableActions ?? [.watering, .feeding, .note, .photo]
        return actions
            .filter { $0 != .phaseChange && $0 != .measurement }
            .sorted { $0.label < $1.label }
    }

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            LazyVGrid(columns: columns, spacing: 10) {
                ForEach(availableActions, id: \.self) { logType in
                    ActionButton(
                        icon: logType.iconName,
                        label: logType.label,
                        color: colorForLogType(logType)
                    ) {
                        createLog(logType: logType)
                    }
                }
            }

            // Separate Measure button
            if plant.currentPhase?.availableActions.contains(.measurement) ?? false {
                Button {
                    showMeasurementSheet = true
                } label: {
                    HStack {
                        Image(systemName: "ruler")
                        Text("Log Measurement")
                    }
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundColor(PlantgotchiTheme.purple)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(PlantgotchiTheme.purple.opacity(0.1))
                    .cornerRadius(8)
                }
            }
        }
        .plantgotchiCard()
        .sheet(isPresented: $showMeasurementSheet) {
            AddMeasurementView(plant: plant) {
                onLog?()
            }
        }
    }

    private func createLog(logType: GrowLogType) {
        let log = GrowLog(
            plantId: plant.id,
            userId: userId,
            phase: plant.currentPhase ?? .germination,
            logType: logType,
            createdAt: ISO8601DateFormatter().string(from: Date())
        )

        do {
            try AppDatabase.shared.addGrowLog(log)
            Analytics.track("grow_log_created", properties: [
                "plant_id": plant.id,
                "log_type": logType.rawValue,
                "phase": (plant.currentPhase ?? .germination).rawValue
            ])
            onLog?()
        } catch {
            print("[QuickLogView] Failed to log: \(error)")
        }
    }

    private func colorForLogType(_ logType: GrowLogType) -> Color {
        switch logType {
        case .watering:     return PlantgotchiTheme.blue
        case .feeding:      return PlantgotchiTheme.green
        case .topping, .fimming, .defoliation:
                            return PlantgotchiTheme.red
        case .lst:          return PlantgotchiTheme.yellow
        case .transplant:   return PlantgotchiTheme.yellow
        case .flushing:     return PlantgotchiTheme.blue
        case .trichomeCheck: return PlantgotchiTheme.purple
        case .environmental: return PlantgotchiTheme.red
        case .photo:        return PlantgotchiTheme.purple
        case .note:         return PlantgotchiTheme.text.opacity(0.7)
        case .harvest:      return PlantgotchiTheme.green
        case .dryWeight, .dryCheck: return PlantgotchiTheme.yellow
        case .cureCheck:    return PlantgotchiTheme.purple
        case .processingLog: return PlantgotchiTheme.text.opacity(0.7)
        default:            return PlantgotchiTheme.green
        }
    }
}
#endif
