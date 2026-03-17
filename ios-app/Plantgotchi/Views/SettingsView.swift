import SwiftUI
import PostHog

/// App settings: Turso sync configuration, Claude API key,
/// sensor management, and sign-out.
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var bleManager: BLEManager

    @State private var userId: String = ""
    @State private var sensorMappings: [String: String] = [:]
    @State private var showSaveConfirmation = false
    @State private var showClearDataAlert = false
    @State private var isDemoMode = !UserDefaults.standard.bool(forKey: "demoModeExplicitlyOff")
    @State private var showDemoLoadedAlert = false
    @ObservedObject private var themeManager = ThemeManager.shared
    @ObservedObject private var localeManager = LocaleManager.shared

    var body: some View {
        NavigationStack {
            ZStack {
                PlantgotchiTheme.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        userSection
                        sensorSection
                        languageSection
                        themeSection
                        demoSection
                        dangerSection
                        infoSection
                    }
                    .padding()
                }
            }
            .navigationTitle(S.settings)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(S.close) { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(S.save) { saveSettings() }
                        .font(.body.weight(.semibold))
                }

            }
            .alert(S.settingsSaved, isPresented: $showSaveConfirmation) {
                Button(S.ok) {}
            }
            .alert(S.demoLoaded, isPresented: $showDemoLoadedAlert) {
                Button(S.ok) {}
            } message: {
                Text(S.demoLoadedMsg)
            }
            .alert(S.clearDataTitle, isPresented: $showClearDataAlert) {
                Button(S.cancel, role: .cancel) {}
                Button(S.clear, role: .destructive) { clearData() }
            } message: {
                Text(S.clearDataMsg)
            }
            .onAppear { loadSettings() }
        }
    }

    // MARK: - User Section

    private var userSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.user)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            TextField(S.userId, text: $userId)
                .textFieldStyle(.roundedBorder)
                .font(PlantgotchiTheme.bodyFont)
                .autocapitalization(.none)
                .disableAutocorrection(true)
        }
        .plantgotchiCard()
    }

    // MARK: - Sensor Section

    private var sensorSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.pairedSensors)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            if sensorMappings.isEmpty {
                HStack {
                    Image(systemName: "sensor.tag.radiowaves.forward")
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.3))
                    Text(S.noSensorsPaired)
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
                                Text("\(S.plant): \(plantId.prefix(8))...")
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

    // MARK: - Language Section

    private var languageSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.language)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Text(S.languageDesc)
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.6))

            Picker(S.language, selection: $localeManager.locale) {
                Text("Portugues (BR)").tag(AppLocale.ptBR)
                Text("English").tag(AppLocale.en)
            }
            .pickerStyle(.segmented)
        }
        .plantgotchiCard()
    }

    // MARK: - Theme Section

    private var themeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.theme)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Text(S.themeDesc)
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.6))

            Toggle(isOn: $themeManager.isRetro) {
                HStack {
                    Image(systemName: "gamecontroller.fill")
                        .foregroundColor(PlantgotchiTheme.purple)
                    Text(S.retroMode)
                        .font(PlantgotchiTheme.bodyFont)
                        .foregroundColor(PlantgotchiTheme.text)
                }
            }
            .tint(PlantgotchiTheme.retroGreen)
        }
        .plantgotchiCard()
    }

    // MARK: - Demo Section

    private var demoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.demoMode)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Text(S.demoDesc)
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.6))

            Toggle(isOn: $isDemoMode) {
                HStack {
                    Image(systemName: "sparkles")
                        .foregroundColor(PlantgotchiTheme.green)
                    Text(S.demoData)
                        .font(PlantgotchiTheme.bodyFont)
                }
            }
            .tint(PlantgotchiTheme.green)
            .onChange(of: isDemoMode) { _, newValue in
                toggleDemoMode(enabled: newValue)
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Danger Section

    private var dangerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.dangerZone)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.red.opacity(0.7))

            Button(action: { showClearDataAlert = true }) {
                HStack {
                    Image(systemName: "trash")
                    Text(S.clearAllData)
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
        VStack(spacing: 12) {
            if let uiImage = UIImage(named: "AppIcon60x60@2x.png")
                ?? UIImage(named: "AppIcon60x60@2x") {
                Image(uiImage: uiImage)
                    .resizable()
                    .frame(width: 64, height: 64)
                    .cornerRadius(14)
                    .shadow(color: PlantgotchiTheme.text.opacity(0.15), radius: 4, x: 0, y: 2)
            }

            Text("Plantgotchi")
                .font(PlantgotchiTheme.pixelFont(size: 12))
                .foregroundColor(PlantgotchiTheme.text)

            Text("v1.0.0")
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Text(LocaleManager.shared.locale == .ptBR
                ? "Monitor inteligente para suas plantas com sensores BLE e recomendacoes de cuidados com IA."
                : "Smart plant monitor with BLE sensors and AI-powered care recommendations.")
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16)
        }
        .frame(maxWidth: .infinity)
        .plantgotchiCard()
    }

    // MARK: - Helpers

    private var bleStateLabel: String {
        switch bleManager.state {
        case .idle: return S.bleIdle
        case .scanning: return S.bleScanning
        case .connecting: return S.bleConnecting
        case .connected: return S.bleConnected
        case .poweredOff: return S.blePoweredOff
        case .unauthorized: return S.bleUnauthorized
        }
    }

    private func loadSettings() {
        userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"
        sensorMappings = UserDefaults.standard.dictionary(forKey: "sensorPlantMappings") as? [String: String] ?? [:]
    }

    private func saveSettings() {
        UserDefaults.standard.set(userId, forKey: "userId")
        PostHogSDK.shared.capture("settings_changed")
        showSaveConfirmation = true
    }

    private func removeSensorMapping(_ sensorId: String) {
        sensorMappings.removeValue(forKey: sensorId)
        UserDefaults.standard.set(sensorMappings, forKey: "sensorPlantMappings")
    }

    private func toggleDemoMode(enabled: Bool) {
        let uid = userId.isEmpty ? "default-user" : userId
        UserDefaults.standard.set(!enabled, forKey: "demoModeExplicitlyOff")

        do {
            if enabled {
                try AppDatabase.shared.loadDemoData(userId: uid)
                PostHogSDK.shared.capture("demo_mode_enabled")
                showDemoLoadedAlert = true
            } else {
                try AppDatabase.shared.clearAllData(userId: uid)
                PostHogSDK.shared.capture("demo_mode_disabled")
            }
        } catch {
            print("[SettingsView] Demo mode toggle failed: \(error)")
        }
    }

    private func clearData() {
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

        UserDefaults.standard.removeObject(forKey: "sensorPlantMappings")
        sensorMappings = [:]

        dismiss()
    }
}
