#if os(iOS)
import SwiftUI

/// Journal timeline showing all grow log entries for a plant, with phase filtering.
struct GrowLogView: View {
    let plantId: String

    @State private var logs: [GrowLog] = []
    @State private var selectedPhase: Phase? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.growJournal)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            // Filter chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(label: S.all, isSelected: selectedPhase == nil) {
                        selectedPhase = nil
                    }
                    ForEach(Phase.allCases, id: \.self) { phase in
                        FilterChip(
                            label: S.phaseName(phase.rawValue),
                            isSelected: selectedPhase == phase
                        ) {
                            selectedPhase = phase
                        }
                    }
                }
            }

            // Log entries
            if logs.isEmpty {
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: "note.text")
                            .font(.title2)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.3))
                        Text(S.noJournalEntries)
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                    }
                    .padding(.vertical, 24)
                    Spacer()
                }
            } else {
                ForEach(logs) { log in
                    GrowLogRow(log: log)
                }
            }
        }
        .plantgotchiCard()
        .onAppear { reload() }
        .onChange(of: selectedPhase) { _ in reload() }
    }

    private func reload() {
        do {
            if let phase = selectedPhase {
                logs = try AppDatabase.shared.getGrowLogs(plantId: plantId, phase: phase)
            } else {
                logs = try AppDatabase.shared.getGrowLogs(plantId: plantId)
            }
        } catch {
            print("[GrowLogView] Failed to load logs: \(error)")
        }
    }
}

// MARK: - GrowLogRow

struct GrowLogRow: View {
    let log: GrowLog

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: log.logType.iconName)
                .foregroundColor(PlantgotchiTheme.green)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(log.logType.label)
                        .font(PlantgotchiTheme.bodyFont.weight(.medium))
                        .foregroundColor(PlantgotchiTheme.text)

                    Text(S.phaseName(log.phase.rawValue))
                        .font(.system(size: 9, weight: .medium, design: .rounded))
                        .foregroundColor(PlantgotchiTheme.green)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(PlantgotchiTheme.green.opacity(0.12))
                        .cornerRadius(4)
                }

                if let notes = log.notes, !notes.isEmpty {
                    Text(notes)
                        .font(PlantgotchiTheme.captionFont)
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
                        .lineLimit(2)
                }
            }

            Spacer()

            if let dateStr = log.createdAt {
                Text(relativeDate(dateStr))
                    .font(.caption2)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.4))
            }
        }
        .padding(.vertical, 4)
    }

    private func relativeDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: iso) ?? ISO8601DateFormatter().date(from: iso) {
            let relative = RelativeDateTimeFormatter()
            relative.unitsStyle = .short
            return relative.localizedString(for: date, relativeTo: Date())
        }
        return String(iso.prefix(10))
    }
}

// MARK: - FilterChip

struct FilterChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundColor(isSelected ? .white : PlantgotchiTheme.text)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(isSelected ? PlantgotchiTheme.green : PlantgotchiTheme.text.opacity(0.08))
                .cornerRadius(14)
        }
    }
}
#endif
