#if os(iOS)
import SwiftUI

/// Dashboard for managing grows (grouping plants by grow session).
struct GrowView: View {
    @State private var grows: [Grow] = []
    @State private var showCreateGrow = false
    @State private var newGrowName = ""
    @State private var newGrowEnvironment: GrowEnvironment = .indoor

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if grows.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "leaf.circle")
                            .font(.system(size: 48))
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.3))
                        Text(S.noGrowsYet)
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                        Text(S.createGrowDesc)
                            .font(PlantgotchiTheme.captionFont)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.3))
                    }
                    .padding(.top, 60)
                } else {
                    ForEach(grows) { grow in
                        growCard(grow)
                    }
                }
            }
            .padding()
        }
        .background(PlantgotchiTheme.background.ignoresSafeArea())
        .navigationTitle(S.grows)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showCreateGrow = true }) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(PlantgotchiTheme.green)
                }
            }
        }
        .sheet(isPresented: $showCreateGrow) {
            createGrowSheet
        }
        .task {
            loadGrows()
        }
    }

    private func growCard(_ grow: Grow) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: grow.environment == .outdoor ? "sun.max.fill" : "lightbulb.fill")
                    .foregroundColor(PlantgotchiTheme.green)
                Text(grow.name)
                    .font(PlantgotchiTheme.pixelFont(size: 11))
                    .foregroundColor(PlantgotchiTheme.text)
                Spacer()
                Text(grow.status.capitalized)
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(grow.status == "active" ? PlantgotchiTheme.green : PlantgotchiTheme.text.opacity(0.4))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background((grow.status == "active" ? PlantgotchiTheme.green : PlantgotchiTheme.text).opacity(0.1))
                    .cornerRadius(4)
            }

            if let notes = grow.notes, !notes.isEmpty {
                Text(notes)
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
            }

            if let startDate = grow.startDate {
                Text(S.started(String(startDate.prefix(10))))
                    .font(.caption2)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.4))
            }
        }
        .plantgotchiCard()
    }

    private var createGrowSheet: some View {
        NavigationStack {
            Form {
                Section(S.growName) {
                    TextField("e.g., Spring 2026 Tent A", text: $newGrowName)
                }
                Section(S.environment) {
                    Picker(S.environment, selection: $newGrowEnvironment) {
                        Text(S.indoor).tag(GrowEnvironment.indoor)
                        Text(S.outdoor).tag(GrowEnvironment.outdoor)
                    }
                    .pickerStyle(.segmented)
                }
            }
            .navigationTitle(S.newGrow)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(S.cancel) { showCreateGrow = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(S.create) {
                        createGrow()
                    }
                    .disabled(newGrowName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func createGrow() {
        let fmt = ISO8601DateFormatter()
        fmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let now = fmt.string(from: Date())
        let grow = Grow(
            userId: userId,
            name: newGrowName.trimmingCharacters(in: .whitespaces),
            environment: newGrowEnvironment,
            startDate: now,
            createdAt: now,
            updatedAt: now
        )
        do {
            try AppDatabase.shared.saveGrow(grow)
            newGrowName = ""
            showCreateGrow = false
            loadGrows()
        } catch {
            print("[GrowView] Failed to create grow: \(error)")
        }
    }

    private func loadGrows() {
        do {
            grows = try AppDatabase.shared.getGrows(userId: userId)
        } catch {
            print("[GrowView] Failed to load grows: \(error)")
        }
    }
}
#endif
