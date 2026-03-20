#if os(iOS)
import SwiftUI

/// Multi-step form for creating a new plant.
/// Step 0: Name, emoji, strain picker
/// Step 1: Plant type (Photo vs Auto)
/// Step 2: Environment (Indoor vs Outdoor)
/// Step 3: Moisture/temp sliders, light preference
struct AddPlantView: View {
    @Environment(\.dismiss) private var dismiss

    var onSave: (() -> Void)?

    // MARK: - Step State

    @State private var currentStep = 0
    private let totalSteps = 4

    // MARK: - Step 0: Name, Emoji, Strain

    @State private var name = ""
    @State private var species = ""
    @State private var selectedEmoji = "\u{1F331}"
    @State private var showStrainPicker = false
    @State private var selectedStrain: StrainProfile?
    @State private var customStrainName = ""
    @State private var strainType: StrainType = .hybrid

    // MARK: - Step 1: Plant Type

    @State private var plantType: PlantType = .photo

    // MARK: - Step 2: Environment

    @State private var environment: GrowEnvironment = .indoor

    // MARK: - Step 3: Thresholds

    @State private var lightPreference = "medium"
    @State private var moistureMin: Double = 30
    @State private var moistureMax: Double = 80
    @State private var tempMin: Double = 15
    @State private var tempMax: Double = 30

    // MARK: - Error

    @State private var showError = false
    @State private var errorMessage = ""

    @EnvironmentObject private var authService: AuthService
    private var userId: String { authService.userId ?? "default-user" }

    private let emojiOptions = [
        "\u{1F331}", "\u{1F33F}", "\u{1F335}", "\u{1F33B}", "\u{1F337}",
        "\u{1F339}", "\u{1F33A}", "\u{1F338}", "\u{1F340}", "\u{1F333}",
        "\u{1F334}", "\u{1F332}", "\u{1FAB4}", "\u{1F343}", "\u{1F490}",
    ]

    private let lightOptions = ["low", "medium", "high"]

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ZStack {
                PlantgotchiTheme.cream
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    // Step indicator
                    stepIndicator
                        .padding(.top, 8)
                        .padding(.bottom, 16)

                    ScrollView {
                        VStack(spacing: 24) {
                            switch currentStep {
                            case 0: step0NameAndStrain
                            case 1: step1PlantType
                            case 2: step2Environment
                            case 3: step3Thresholds
                            default: EmptyView()
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle(S.newPlant)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if currentStep == 0 {
                        Button(S.cancel) { dismiss() }
                    } else {
                        Button(S.back) {
                            withAnimation { currentStep -= 1 }
                        }
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    if currentStep < totalSteps - 1 {
                        Button(S.next) {
                            withAnimation { currentStep += 1 }
                        }
                        .font(.body.weight(.semibold))
                        .disabled(currentStep == 0 && name.trimmingCharacters(in: .whitespaces).isEmpty)
                    } else {
                        Button(S.save) { savePlant() }
                            .font(.body.weight(.semibold))
                            .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
            }
            .alert(S.error, isPresented: $showError) {
                Button(S.ok) {}
            } message: {
                Text(errorMessage)
            }
            .sheet(isPresented: $showStrainPicker) {
                StrainPickerView(
                    selectedStrain: $selectedStrain,
                    customStrainName: $customStrainName,
                    strainType: $strainType
                )
            }
        }
    }

    // MARK: - Step Indicator

    private var stepIndicator: some View {
        VStack(spacing: 8) {
            Text(S.stepOf(currentStep + 1, total: totalSteps))
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            HStack(spacing: 6) {
                ForEach(0..<totalSteps, id: \.self) { step in
                    Capsule()
                        .fill(step <= currentStep ? PlantgotchiTheme.green : PlantgotchiTheme.text.opacity(0.15))
                        .frame(height: 4)
                }
            }
            .padding(.horizontal, 32)
        }
    }

    // MARK: - Step 0: Name, Emoji, Strain

    private var step0NameAndStrain: some View {
        VStack(spacing: 24) {
            emojiPickerSection
            nameSection
            strainSection
        }
    }

    private var emojiPickerSection: some View {
        VStack(spacing: 12) {
            Text(selectedEmoji)
                .font(.system(size: 64))

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(emojiOptions, id: \.self) { emoji in
                        Button(action: { selectedEmoji = emoji }) {
                            Text(emoji)
                                .font(.system(size: 28))
                                .padding(8)
                                .background(
                                    selectedEmoji == emoji
                                        ? PlantgotchiTheme.green.opacity(0.2)
                                        : Color.clear
                                )
                                .cornerRadius(8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(
                                            selectedEmoji == emoji
                                                ? PlantgotchiTheme.green
                                                : Color.clear,
                                            lineWidth: 2
                                        )
                                )
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
        }
        .plantgotchiCard()
    }

    private var nameSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.details)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            TextField(S.plantName, text: $name)
                .textFieldStyle(.roundedBorder)
                .font(PlantgotchiTheme.bodyFont)

            TextField(S.speciesOptional, text: $species)
                .textFieldStyle(.roundedBorder)
                .font(PlantgotchiTheme.bodyFont)
        }
        .plantgotchiCard()
    }

    private var strainSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.strain)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Button {
                showStrainPicker = true
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        if let strain = selectedStrain {
                            Text(strain.name)
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(PlantgotchiTheme.text)
                            if let type = strain.type {
                                Text(typeLabelString(type))
                                    .font(PlantgotchiTheme.captionFont)
                                    .foregroundColor(PlantgotchiTheme.green)
                            }
                        } else {
                            Text(S.selectStrain)
                                .font(PlantgotchiTheme.bodyFont)
                                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                        }
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.3))
                }
                .padding(12)
                .background(Color.white)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(PlantgotchiTheme.text.opacity(0.15), lineWidth: 1)
                )
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Step 1: Plant Type

    private var step1PlantType: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.plantType)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Picker(S.plantType, selection: $plantType) {
                Text(S.photo).tag(PlantType.photo)
                Text(S.auto).tag(PlantType.auto)
            }
            .pickerStyle(.segmented)

            Text(plantType == .photo
                 ? (LocaleManager.shared.locale == .ptBR
                    ? "Fotoperiodicidade: requer mudanca de ciclo de luz para florir."
                    : "Photoperiod: requires light cycle change to flower.")
                 : (LocaleManager.shared.locale == .ptBR
                    ? "Autoflorescente: floresce automaticamente com base na idade."
                    : "Autoflower: flowers automatically based on age."))
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
                .padding(.top, 4)
        }
        .plantgotchiCard()
    }

    // MARK: - Step 2: Environment

    private var step2Environment: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.environment)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Picker(S.environment, selection: $environment) {
                Text(S.indoor).tag(GrowEnvironment.indoor)
                Text(S.outdoor).tag(GrowEnvironment.outdoor)
            }
            .pickerStyle(.segmented)

            HStack(spacing: 12) {
                Image(systemName: environment == .indoor ? "lamp.desk.fill" : "sun.max.fill")
                    .font(.title2)
                    .foregroundColor(environment == .indoor ? PlantgotchiTheme.purple : PlantgotchiTheme.yellow)

                Text(environment == .indoor
                     ? (LocaleManager.shared.locale == .ptBR
                        ? "Ambiente controlado com iluminacao artificial."
                        : "Controlled environment with artificial lighting.")
                     : (LocaleManager.shared.locale == .ptBR
                        ? "Luz solar natural, sujeito a condicoes climaticas."
                        : "Natural sunlight, subject to weather conditions."))
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
            }
            .padding(.top, 4)
        }
        .plantgotchiCard()
    }

    // MARK: - Step 3: Thresholds

    private var step3Thresholds: some View {
        VStack(spacing: 24) {
            lightSection
            moistureSection
            temperatureSection
        }
    }

    private var lightSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.lightPreference)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Picker(S.light, selection: $lightPreference) {
                Text(S.lightLow).tag("low")
                Text(S.lightMedium).tag("medium")
                Text(S.lightHigh).tag("high")
            }
            .pickerStyle(.segmented)
        }
        .plantgotchiCard()
    }

    private var moistureSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.moistureRange)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            HStack {
                Image(systemName: "drop.fill")
                    .foregroundColor(PlantgotchiTheme.blue)
                Text(S.minValue(Int(moistureMin), unit: "%"))
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text)
            }
            Slider(value: $moistureMin, in: 0...100, step: 5)
                .tint(PlantgotchiTheme.blue)
                .onChange(of: moistureMin) { _, newValue in
                    if newValue > moistureMax { moistureMax = newValue }
                }

            HStack {
                Image(systemName: "drop.fill")
                    .foregroundColor(PlantgotchiTheme.blue)
                Text(S.maxValue(Int(moistureMax), unit: "%"))
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text)
            }
            Slider(value: $moistureMax, in: 0...100, step: 5)
                .tint(PlantgotchiTheme.blue)
                .onChange(of: moistureMax) { _, newValue in
                    if newValue < moistureMin { moistureMin = newValue }
                }
        }
        .plantgotchiCard()
    }

    private var temperatureSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(S.temperatureRange)
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            HStack {
                Image(systemName: "thermometer.snowflake")
                    .foregroundColor(PlantgotchiTheme.blue)
                Text(S.minValue(Int(tempMin), unit: "\u{00B0}C"))
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text)
            }
            Slider(value: $tempMin, in: -10...50, step: 1)
                .tint(PlantgotchiTheme.blue)
                .onChange(of: tempMin) { _, newValue in
                    if newValue > tempMax { tempMax = newValue }
                }

            HStack {
                Image(systemName: "thermometer.sun.fill")
                    .foregroundColor(PlantgotchiTheme.red)
                Text(S.maxValue(Int(tempMax), unit: "\u{00B0}C"))
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text)
            }
            Slider(value: $tempMax, in: -10...50, step: 1)
                .tint(PlantgotchiTheme.red)
                .onChange(of: tempMax) { _, newValue in
                    if newValue < tempMin { tempMin = newValue }
                }
        }
        .plantgotchiCard()
    }

    // MARK: - Helpers

    private func typeLabelString(_ type: StrainType) -> String {
        switch type {
        case .indica: return S.indica
        case .sativa: return S.sativa
        case .hybrid: return S.hybrid
        }
    }

    // MARK: - Save

    private func savePlant() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else { return }

        let fmt = ISO8601DateFormatter()
        fmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let now = fmt.string(from: Date())

        Task {
            do {
                let baseURL: String
                if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
                   let config = NSDictionary(contentsOfFile: configPath),
                   let url = config["APIBaseURL"] as? String, !url.isEmpty {
                    baseURL = url
                } else {
                    baseURL = "http://localhost:4321"
                }

                var body: [String: Any] = [
                    "name": trimmedName,
                    "species": species.isEmpty ? NSNull() : species,
                    "emoji": selectedEmoji,
                    "light_preference": lightPreference,
                    "moisture_min": Int(moistureMin),
                    "moisture_max": Int(moistureMax),
                    "temp_min": Int(tempMin),
                    "temp_max": Int(tempMax),
                    "plant_type": plantType.rawValue,
                    "environment": environment.rawValue,
                    "current_phase": Phase.germination.rawValue,
                    "phase_started_at": now,
                ]

                if let strain = selectedStrain {
                    body["strain_id"] = strain.id
                    body["strain_name"] = strain.name
                    if let t = strain.type {
                        body["strain_type"] = t.rawValue
                    }
                } else if !customStrainName.isEmpty {
                    body["strain_name"] = customStrainName
                    body["strain_type"] = strainType.rawValue
                }

                let jsonData = try JSONSerialization.data(withJSONObject: body)

                let client = AuthenticatedHTTPClient(baseURL: baseURL)
                let (data, httpResponse) = try await client.request(
                    path: "/api/plants",
                    method: "POST",
                    body: jsonData
                )

                guard httpResponse.statusCode == 201 else {
                    errorMessage = S.failedToSave
                    showError = true
                    return
                }

                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let plantId = json["id"] as? String {
                    Analytics.track("plant_created", properties: [
                        "plant_id": plantId,
                        "species": species,
                        "emoji": selectedEmoji,
                        "plant_type": plantType.rawValue,
                        "environment": environment.rawValue,
                        "strain_name": customStrainName,
                    ])
                }

                await MainActor.run {
                    onSave?()
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = "\(S.failedToSave): \(error.localizedDescription)"
                    showError = true
                }
            }
        }
    }
}

#Preview {
    AddPlantView()
}
#endif
