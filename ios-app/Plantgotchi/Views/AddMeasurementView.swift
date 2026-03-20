#if os(iOS)
import SwiftUI

/// Sheet view for logging plant measurements (height, pH, EC/PPM, weight).
struct AddMeasurementView: View {
    let plant: Plant
    var onSave: (() -> Void)?

    @Environment(\.dismiss) private var dismiss

    @State private var measurementType: MeasurementType = .height
    @State private var value: String = ""
    @State private var selectedUnit: String = "in"

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    enum MeasurementType: String, CaseIterable {
        case height = "height"
        case ph = "ph"
        case ecPpm = "ec_ppm"
        case weight = "weight"

        var label: String {
            switch self {
            case .height: return "Height"
            case .ph: return "pH"
            case .ecPpm: return "EC / PPM"
            case .weight: return "Weight"
            }
        }

        var iconName: String {
            switch self {
            case .height: return "ruler"
            case .ph: return "drop.triangle"
            case .ecPpm: return "waveform.path.ecg"
            case .weight: return "scalemass"
            }
        }

        var units: [String]? {
            switch self {
            case .height: return ["in", "cm"]
            case .ph: return nil
            case .ecPpm: return ["ppm", "ec"]
            case .weight: return ["g", "oz"]
            }
        }

        var defaultUnit: String {
            switch self {
            case .height: return "in"
            case .ph: return ""
            case .ecPpm: return "ppm"
            case .weight: return "g"
            }
        }
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Measurement Type") {
                    Picker("Type", selection: $measurementType) {
                        ForEach(MeasurementType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.iconName)
                                Text(type.label)
                            }
                            .tag(type)
                        }
                    }
                    .pickerStyle(.menu)
                }

                Section("Value") {
                    TextField("Enter value", text: $value)
                        .keyboardType(.decimalPad)

                    if let units = measurementType.units {
                        Picker("Unit", selection: $selectedUnit) {
                            ForEach(units, id: \.self) { unit in
                                Text(unit).tag(unit)
                            }
                        }
                        .pickerStyle(.segmented)
                    }
                }

                Section {
                    Button {
                        save()
                    } label: {
                        HStack {
                            Spacer()
                            Text("Save Measurement")
                                .font(.system(size: 15, weight: .semibold, design: .rounded))
                                .foregroundColor(.white)
                            Spacer()
                        }
                        .padding(.vertical, 8)
                        .background(isValid ? PlantgotchiTheme.green : PlantgotchiTheme.text.opacity(0.3))
                        .cornerRadius(8)
                    }
                    .disabled(!isValid)
                    .listRowBackground(Color.clear)
                }
            }
            .navigationTitle("Log Measurement")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onChange(of: measurementType) { newType in
                selectedUnit = newType.defaultUnit
            }
        }
    }

    private var isValid: Bool {
        guard let _ = Double(value) else { return false }
        return true
    }

    private func save() {
        guard let numericValue = Double(value) else { return }

        var dataDict: [String: Any] = [
            "type": measurementType.rawValue,
            "value": numericValue
        ]
        if let units = measurementType.units, !selectedUnit.isEmpty {
            dataDict["unit"] = selectedUnit
        }

        let jsonData = try? JSONSerialization.data(withJSONObject: dataDict)
        let jsonString = jsonData.flatMap { String(data: $0, encoding: .utf8) }

        let log = GrowLog(
            plantId: plant.id,
            userId: userId,
            phase: plant.currentPhase ?? .germination,
            logType: .measurement,
            data: jsonString,
            createdAt: ISO8601DateFormatter().string(from: Date())
        )

        do {
            try AppDatabase.shared.addGrowLog(log)
            Analytics.track("grow_log_created", properties: [
                "plant_id": plant.id,
                "log_type": "measurement",
                "measurement_type": measurementType.rawValue
            ])
            onSave?()
            dismiss()
        } catch {
            print("[AddMeasurementView] Failed to save: \(error)")
        }
    }
}
#endif
