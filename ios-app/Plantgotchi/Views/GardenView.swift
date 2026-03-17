#if os(iOS)
import SwiftUI
import GRDB
import PostHog

/// Main dashboard showing a grid of the user's plants.
/// Pull-to-refresh reloads from the local database.
/// FAB navigates to AddPlantView.
struct GardenView: View {
    @EnvironmentObject private var bleManager: BLEManager
    @EnvironmentObject private var themeManager: ThemeManager
    @ObservedObject private var localeManager = LocaleManager.shared
    @State private var plants: [Plant] = []
    @State private var plantViews: [PlantView] = []
    @State private var isLoading = false
    @State private var showAddPlant = false
    @State private var showScan = false
    @State private var showSettings = false

    /// In a real app, this would come from authentication.
    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    private let columns = [
        GridItem(.flexible(), spacing: PlantgotchiTheme.spacing),
        GridItem(.flexible(), spacing: PlantgotchiTheme.spacing),
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                PlantgotchiTheme.background
                    .ignoresSafeArea()

                if plantViews.isEmpty && !isLoading {
                    emptyState
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: PlantgotchiTheme.spacing) {
                            ForEach(plantViews, id: \.id) { pv in
                                NavigationLink(
                                    destination: PlantDetailView(plantId: pv.id)
                                ) {
                                    PlantCardView(plantView: pv)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await refreshPlants()
                    }
                }

                // Floating action button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: { showAddPlant = true }) {
                            Image(systemName: "plus")
                                .font(.title2.weight(.bold))
                                .foregroundColor(.white)
                                .frame(width: 56, height: 56)
                                .background(PlantgotchiTheme.green)
                                .clipShape(Circle())
                                .shadow(color: PlantgotchiTheme.green.opacity(0.4), radius: 8, x: 0, y: 4)
                        }
                        .padding(.trailing, 24)
                        .padding(.bottom, 24)
                    }
                }
            }
            .navigationTitle(S.myGarden)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { showScan = true }) {
                        Image(systemName: "sensor.tag.radiowaves.forward")
                            .foregroundColor(PlantgotchiTheme.text)
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showSettings = true }) {
                        Image(systemName: "gearshape")
                            .foregroundColor(PlantgotchiTheme.text)
                    }
                }
            }
            .sheet(isPresented: $showAddPlant) {
                AddPlantView(onSave: {
                    Task { await refreshPlants() }
                })
            }
            .sheet(isPresented: $showScan) {
                ScanView()
            }
            .sheet(isPresented: $showSettings, onDismiss: {
                Task { await refreshPlants() }
            }) {
                SettingsView()
            }
            .task {
                await refreshPlants()
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            Text("\u{1F331}")
                .font(.system(size: 64))
            Text(S.noPlantsYet)
                .font(PlantgotchiTheme.pixelFont(size: 14))
                .foregroundColor(PlantgotchiTheme.text)
            Text(S.tapToAdd)
                .font(PlantgotchiTheme.bodyFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
        }
    }

    // MARK: - Data Loading

    @MainActor
    private func refreshPlants() async {
        isLoading = true
        defer { isLoading = false }

        let db = AppDatabase.shared
        do {
            plants = try db.getPlants(userId: userId)
            plantViews = try plants.map { plant in
                let reading = try db.getLatestReading(plantId: plant.id)
                let logs = try db.getCareLogs(plantId: plant.id, limit: 5)
                return toPlantView(plant: plant, latestReading: reading, recentCareLogs: logs)
            }
            PostHogSDK.shared.capture("garden_viewed", properties: [
                "plant_count": plantViews.count,
            ])
        } catch {
            print("[GardenView] Failed to load plants: \(error)")
        }
    }
}

#Preview {
    GardenView()
        .environmentObject(BLEManager())
        .environmentObject(ThemeManager.shared)
}
#endif
