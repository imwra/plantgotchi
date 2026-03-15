import SwiftUI

/// Form for creating a new plant with name, species, emoji, light preference,
/// and moisture/temperature thresholds.
struct AddPlantView: View {
    @Environment(\.dismiss) private var dismiss

    var onSave: (() -> Void)?

    @State private var name = ""
    @State private var species = ""
    @State private var selectedEmoji = "\u{1F331}"
    @State private var lightPreference = "medium"
    @State private var moistureMin: Double = 30
    @State private var moistureMax: Double = 80
    @State private var tempMin: Double = 15
    @State private var tempMax: Double = 30
    @State private var showError = false
    @State private var errorMessage = ""

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    private let emojiOptions = [
        "\u{1F331}", "\u{1F33F}", "\u{1F335}", "\u{1F33B}", "\u{1F337}",
        "\u{1F339}", "\u{1F33A}", "\u{1F338}", "\u{1F340}", "\u{1F333}",
        "\u{1F334}", "\u{1F332}", "\u{1FAB4}", "\u{1F343}", "\u{1F490}",
    ]

    private let lightOptions = ["low", "medium", "high"]

    var body: some View {
        NavigationStack {
            ZStack {
                PlantgotchiTheme.cream
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Emoji picker
                        emojiPickerSection

                        // Name & Species
                        nameSection

                        // Light preference
                        lightSection

                        // Moisture thresholds
                        moistureSection

                        // Temperature thresholds
                        temperatureSection
                    }
                    .padding()
                }
            }
            .navigationTitle("New Plant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { savePlant() }
                        .font(.body.weight(.semibold))
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK") {}
            } message: {
                Text(errorMessage)
            }
        }
    }

    // MARK: - Emoji Picker

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

    // MARK: - Name Section

    private var nameSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("DETAILS")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            TextField("Plant name", text: $name)
                .textFieldStyle(.roundedBorder)
                .font(PlantgotchiTheme.bodyFont)

            TextField("Species (optional)", text: $species)
                .textFieldStyle(.roundedBorder)
                .font(PlantgotchiTheme.bodyFont)
        }
        .plantgotchiCard()
    }

    // MARK: - Light Section

    private var lightSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("LIGHT PREFERENCE")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            Picker("Light", selection: $lightPreference) {
                ForEach(lightOptions, id: \.self) { option in
                    Text(option.capitalized).tag(option)
                }
            }
            .pickerStyle(.segmented)
        }
        .plantgotchiCard()
    }

    // MARK: - Moisture Section

    private var moistureSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("MOISTURE RANGE")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            HStack {
                Image(systemName: "drop.fill")
                    .foregroundColor(PlantgotchiTheme.blue)
                Text("Min: \(Int(moistureMin))%")
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text)
            }
            Slider(value: $moistureMin, in: 0...100, step: 5) {
                Text("Minimum moisture")
            }
            .tint(PlantgotchiTheme.blue)
            .onChange(of: moistureMin) { _, newValue in
                if newValue > moistureMax { moistureMax = newValue }
            }

            HStack {
                Image(systemName: "drop.fill")
                    .foregroundColor(PlantgotchiTheme.blue)
                Text("Max: \(Int(moistureMax))%")
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text)
            }
            Slider(value: $moistureMax, in: 0...100, step: 5) {
                Text("Maximum moisture")
            }
            .tint(PlantgotchiTheme.blue)
            .onChange(of: moistureMax) { _, newValue in
                if newValue < moistureMin { moistureMin = newValue }
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Temperature Section

    private var temperatureSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("TEMPERATURE RANGE")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            HStack {
                Image(systemName: "thermometer.snowflake")
                    .foregroundColor(PlantgotchiTheme.blue)
                Text("Min: \(Int(tempMin))\u{00B0}C")
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text)
            }
            Slider(value: $tempMin, in: -10...50, step: 1) {
                Text("Minimum temperature")
            }
            .tint(PlantgotchiTheme.blue)
            .onChange(of: tempMin) { _, newValue in
                if newValue > tempMax { tempMax = newValue }
            }

            HStack {
                Image(systemName: "thermometer.sun.fill")
                    .foregroundColor(PlantgotchiTheme.red)
                Text("Max: \(Int(tempMax))\u{00B0}C")
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text)
            }
            Slider(value: $tempMax, in: -10...50, step: 1) {
                Text("Maximum temperature")
            }
            .tint(PlantgotchiTheme.red)
            .onChange(of: tempMax) { _, newValue in
                if newValue < tempMin { tempMin = newValue }
            }
        }
        .plantgotchiCard()
    }

    // MARK: - Save

    private func savePlant() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else { return }

        let plant = Plant(
            userId: userId,
            name: trimmedName,
            species: species.isEmpty ? nil : species,
            emoji: selectedEmoji,
            moistureMin: Int(moistureMin),
            moistureMax: Int(moistureMax),
            tempMin: tempMin,
            tempMax: tempMax,
            lightPreference: lightPreference
        )

        do {
            try AppDatabase.shared.savePlant(plant)
            onSave?()
            dismiss()
        } catch {
            errorMessage = "Failed to save plant: \(error.localizedDescription)"
            showError = true
        }
    }
}

#Preview {
    AddPlantView()
}
