import SwiftUI
import PostHog

/// App settings: Turso sync configuration, Claude API key,
/// sensor management, and sign-out.
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var bleManager: BLEManager

    @State private var tursoUrl: String = ""
    @State private var tursoAuthToken: String = ""
    @State private var claudeAPIKey: String = ""
    @State private var userId: String = ""
    @State private var sensorMappings: [String: String] = [:]
    @State private var showSaveConfirmation = false
    @State private var showClearDataAlert = false

    var body: some View {
        NavigationStack {
            ZStack {
                PlantgotchiTheme.cream
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // User
                        userSection

                        // Turso sync
                        tursoSection

                        // Claude API
                        claudeSection

                        // Sensors
                        sensorSection

                        // Danger zone
                        dangerSection

                        // App info
                        infoSection
                    }
                    .padding()
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { saveSettings() }
                        .font(.body.weight(.semibold))
                }
            }
            .alert("Settings Saved", isPresented: $showSaveConfirmation) {
                Button("OK") {}
            }
            .alert("Clear All Data?", isPresented: $showClearDataAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Clear", role: .destructive) { clearData() }
            } message: {
                Text("This will delete all local plant data, sensor readings, and recommendations. This cannot be undone.")
            }
            .onAppear { loadSettings() }
        }
    }

    // MARK: - User Section

    private var userSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("USER")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            TextField("User ID", text: $userId)
                .textFieldStyle(.roundedBorder)
                .font(PlantgotchiTheme.bodyFont)
                .autocapitalization(.none)
                .disableAutocorrection(true)
        }
        .plantgotchiCard()
    }

    // MARK: - Turso Section

    private var tursoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("TURSO CLOUD SYNC")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Text("Connect to your Turso database for multi-device sync.")
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.6))

            TextField("Database URL", text: $tursoUrl)
                .textFieldStyle(.roundedBorder)
                .font(PlantgotchiTheme.bodyFont)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .keyboardType(.URL)

            SecureField("Auth Token", text: $tursoAuthToken)
                .textFieldStyle(.roundedBorder)
                .font(PlantgotchiTheme.bodyFont)

            // Sync status
            HStack {
                Circle()
                    .fill(TursoSync.shared.isConfigured ? PlantgotchiTheme.green : Color.gray)
                    .frame(width: 8, height: 8)
                Text(TursoSync.shared.isConfigured ? "Configured" : "Not configured")
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Claude Section

    private var claudeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("CLAUDE AI ANALYSIS")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Text("Add your Anthropic API key for AI-powered plant care recommendations (runs every 6 hours in background).")
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.6))

            SecureField("Anthropic API Key", text: $claudeAPIKey)
                .textFieldStyle(.roundedBorder)
                .font(PlantgotchiTheme.bodyFont)
        }
        .plantgotchiCard()
    }

    // MARK: - Sensor Section

    private var sensorSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("PAIRED SENSORS")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            if sensorMappings.isEmpty {
                HStack {
                    Image(systemName: "sensor.tag.radiowaves.forward")
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.3))
                    Text("No sensors paired yet")
                        .font(PlantgotchiTheme.captionFont)
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                }
            } else {
                ForEach(Array(sensorMappings.keys.sorted()), id: \.self) { sensorId in
                    HStack {
                        Image(systemName: "sensor.tag.radiowaves.forward")
                            .foregroundColor(PlantgotchiTheme.green)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(sensorId.prefix(8).uppercased())
                                .font(.caption.monospaced())
                                .foregroundColor(PlantgotchiTheme.text)
                            if let plantId = sensorMappings[sensorId] {
                                Text("Plant: \(plantId.prefix(8))...")
                                    .font(.caption2)
                                    .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                            }
                        }

                        Spacer()

                        Button(action: { removeSensorMapping(sensorId) }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(PlantgotchiTheme.red.opacity(0.6))
                        }
                    }
                    .padding(.vertical, 4)
                }
            }

            // BLE connection status
            HStack {
                Circle()
                    .fill(bleManager.state == .idle ? Color.gray : PlantgotchiTheme.green)
                    .frame(width: 8, height: 8)
                Text("BLE: \(bleStateLabel)")
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Danger Section

    private var dangerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("DANGER ZONE")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.red.opacity(0.7))

            Button(action: { showClearDataAlert = true }) {
                HStack {
                    Image(systemName: "trash")
                    Text("Clear All Local Data")
                }
                .font(PlantgotchiTheme.bodyFont)
                .foregroundColor(PlantgotchiTheme.red)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(PlantgotchiTheme.red.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Info Section

    private var infoSection: some View {
        VStack(spacing: 8) {
            Text("Plantgotchi")
                .font(PlantgotchiTheme.pixelFont(size: 10))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.4))
            Text("v1.0.0")
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.3))
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
    }

    // MARK: - Helpers

    private var bleStateLabel: String {
        switch bleManager.state {
        case .idle: return "Idle"
        case .scanning: return "Scanning"
        case .connecting: return "Connecting"
        case .connected: return "Connected"
        case .poweredOff: return "Powered Off"
        case .unauthorized: return "Unauthorized"
        }
    }

    private func loadSettings() {
        tursoUrl = UserDefaults.standard.string(forKey: "tursoUrl") ?? ""
        tursoAuthToken = UserDefaults.standard.string(forKey: "tursoAuthToken") ?? ""
        claudeAPIKey = UserDefaults.standard.string(forKey: "claudeAPIKey") ?? ""
        userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"
        sensorMappings = UserDefaults.standard.dictionary(forKey: "sensorPlantMappings") as? [String: String] ?? [:]
    }

    private func saveSettings() {
        UserDefaults.standard.set(tursoUrl, forKey: "tursoUrl")
        UserDefaults.standard.set(tursoAuthToken, forKey: "tursoAuthToken")
        UserDefaults.standard.set(claudeAPIKey, forKey: "claudeAPIKey")
        UserDefaults.standard.set(userId, forKey: "userId")

        // Update TursoSync with new values
        TursoSync.shared.tursoUrl = tursoUrl
        TursoSync.shared.tursoAuthToken = tursoAuthToken

        // Schedule background agent if API key is set
        if !claudeAPIKey.isEmpty {
            BackgroundAgent.shared.scheduleNextRefresh()
        }

        PostHogSDK.shared.capture("settings_changed")
        showSaveConfirmation = true
    }

    private func removeSensorMapping(_ sensorId: String) {
        sensorMappings.removeValue(forKey: sensorId)
        UserDefaults.standard.set(sensorMappings, forKey: "sensorPlantMappings")
    }

    private func clearData() {
        // Remove the database file
        let fileManager = FileManager.default
        if let appSupportURL = try? fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: false
        ) {
            let dbURL = appSupportURL.appendingPathComponent("plantgotchi.sqlite")
            try? fileManager.removeItem(at: dbURL)
        }

        // Clear sensor mappings
        UserDefaults.standard.removeObject(forKey: "sensorPlantMappings")
        sensorMappings = [:]

        dismiss()
    }
}
