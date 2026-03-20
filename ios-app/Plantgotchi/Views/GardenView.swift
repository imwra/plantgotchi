#if os(iOS)
import SwiftUI
import GRDB

/// Main dashboard showing a grid of the user's plants.
/// Pull-to-refresh reloads from the local database.
/// FAB navigates to AddPlantView.
struct GardenView: View {
    @EnvironmentObject private var bleManager: BLEManager
    @EnvironmentObject private var themeManager: ThemeManager
    @ObservedObject private var localeManager = LocaleManager.shared
    @EnvironmentObject private var authService: AuthService
    @State private var plants: [Plant] = []
    @State private var plantViews: [PlantView] = []
    @State private var isLoading = false
    @State private var showAddPlant = false
    @State private var showScan = false
    @State private var showSettings = false
    @State private var showGrows = false
    @State private var showAchievements = false

    private var userId: String { authService.userId ?? "default-user" }

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
                    HStack(spacing: 12) {
                        Button(action: { showGrows = true }) {
                            Image(systemName: "leaf.circle")
                                .foregroundColor(PlantgotchiTheme.text)
                        }
                        Button(action: { showAchievements = true }) {
                            Image(systemName: "trophy")
                                .foregroundColor(PlantgotchiTheme.text)
                        }
                        Button(action: { showSettings = true }) {
                            Image(systemName: "gearshape")
                                .foregroundColor(PlantgotchiTheme.text)
                        }
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
            .sheet(isPresented: $showGrows) {
                NavigationStack {
                    GrowView()
                }
            }
            .sheet(isPresented: $showAchievements) {
                NavigationStack {
                    AchievementsView()
                }
            }
            .onAppear {
                Analytics.track("screen_viewed", properties: ["screen_name": "garden"])
            }
            .task {
                await refreshPlants()
                while !Task.isCancelled {
                    try? await Task.sleep(nanoseconds: 15_000_000_000)
                    guard !Task.isCancelled else { break }
                    await refreshPlants()
                }
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image("Mascot")
                .resizable()
                .interpolation(.none)
                .scaledToFit()
                .frame(width: 100, height: 100)
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

        do {
            let baseURL: String
            if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
               let config = NSDictionary(contentsOfFile: configPath),
               let url = config["APIBaseURL"] as? String, !url.isEmpty {
                baseURL = url
            } else {
                baseURL = "http://localhost:4321"
            }

            let client = AuthenticatedHTTPClient(baseURL: baseURL)
            let (data, httpResponse) = try await client.request(
                path: "/api/plants",
                method: "GET"
            )

            guard httpResponse.statusCode == 200 else {
                print("[GardenView] API returned non-200")
                return
            }

            guard let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
                print("[GardenView] Failed to parse response")
                return
            }

            plants = json.compactMap { entry -> Plant? in
                guard let p = entry["plant"] as? [String: Any],
                      let id = p["id"] as? String,
                      let name = p["name"] as? String else { return nil }
                return Plant(
                    id: id,
                    userId: p["user_id"] as? String ?? "",
                    name: name,
                    species: p["species"] as? String,
                    emoji: p["emoji"] as? String ?? "\u{1F331}",
                    moistureMin: p["moisture_min"] as? Int ?? 30,
                    moistureMax: p["moisture_max"] as? Int ?? 80,
                    tempMin: p["temp_min"] as? Double ?? 15.0,
                    tempMax: p["temp_max"] as? Double ?? 30.0,
                    lightPreference: p["light_preference"] as? String ?? "medium",
                    plantType: (p["plant_type"] as? String).flatMap { PlantType(rawValue: $0) },
                    strainName: p["strain_name"] as? String,
                    strainType: (p["strain_type"] as? String).flatMap { StrainType(rawValue: $0) },
                    environment: (p["environment"] as? String).flatMap { GrowEnvironment(rawValue: $0) },
                    currentPhase: (p["current_phase"] as? String).flatMap { Phase(rawValue: $0) },
                    phaseStartedAt: p["phase_started_at"] as? String,
                    growId: p["grow_id"] as? String
                )
            }
            plantViews = plants.map { plant in
                toPlantView(plant: plant, latestReading: nil, recentCareLogs: [])
            }
            Analytics.track("garden_viewed", properties: ["plant_count": plants.count])
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
