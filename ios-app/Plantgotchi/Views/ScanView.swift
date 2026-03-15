import SwiftUI

/// BLE sensor scanning and pairing UI.
/// Displays discovered Plantgotchi sensors with signal strength.
/// Tapping a sensor associates it with a plant.
struct ScanView: View {
    @EnvironmentObject private var bleManager: BLEManager
    @Environment(\.dismiss) private var dismiss

    @State private var plants: [Plant] = []
    @State private var selectedSensor: DiscoveredSensor?
    @State private var showPlantPicker = false

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    var body: some View {
        NavigationStack {
            ZStack {
                PlantgotchiTheme.cream
                    .ignoresSafeArea()

                VStack(spacing: 16) {
                    // Status banner
                    statusBanner

                    if bleManager.discoveredSensors.isEmpty {
                        emptyState
                    } else {
                        sensorList
                    }
                }
            }
            .navigationTitle("Scan Sensors")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    scanButton
                }
            }
            .sheet(isPresented: $showPlantPicker) {
                plantPickerSheet
            }
            .onAppear {
                loadPlants()
                if case .idle = bleManager.state {
                    bleManager.startScan()
                }
            }
            .onDisappear {
                bleManager.stopScan()
            }
        }
    }

    // MARK: - Status Banner

    private var statusBanner: some View {
        HStack {
            switch bleManager.state {
            case .scanning:
                ProgressView()
                    .scaleEffect(0.8)
                Text("Scanning for sensors...")
                    .font(PlantgotchiTheme.captionFont)
            case .connecting:
                ProgressView()
                    .scaleEffect(0.8)
                Text("Connecting...")
                    .font(PlantgotchiTheme.captionFont)
            case .connected:
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(PlantgotchiTheme.green)
                Text("Connected to \(bleManager.connectedSensorName ?? "sensor")")
                    .font(PlantgotchiTheme.captionFont)
            case .poweredOff:
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(PlantgotchiTheme.yellow)
                Text("Bluetooth is turned off")
                    .font(PlantgotchiTheme.captionFont)
            case .unauthorized:
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(PlantgotchiTheme.red)
                Text("Bluetooth permission required")
                    .font(PlantgotchiTheme.captionFont)
            case .idle:
                Image(systemName: "antenna.radiowaves.left.and.right")
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                Text("Tap Scan to search for sensors")
                    .font(PlantgotchiTheme.captionFont)
            }
        }
        .foregroundColor(PlantgotchiTheme.text)
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color.white.opacity(0.6))
        .cornerRadius(PlantgotchiTheme.cornerRadius)
        .padding(.horizontal)
    }

    // MARK: - Scan Button

    private var scanButton: some View {
        Group {
            if case .scanning = bleManager.state {
                Button("Stop") { bleManager.stopScan() }
            } else {
                Button("Scan") { bleManager.startScan() }
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "sensor.tag.radiowaves.forward")
                .font(.system(size: 48))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.3))
            Text("No sensors found")
                .font(PlantgotchiTheme.pixelFont(size: 11))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
            Text("Make sure your Plantgotchi sensor is powered on and nearby")
                .font(PlantgotchiTheme.captionFont)
                .foregroundColor(PlantgotchiTheme.text.opacity(0.4))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Spacer()
        }
    }

    // MARK: - Sensor List

    private var sensorList: some View {
        List(bleManager.discoveredSensors) { sensor in
            Button(action: { pairSensor(sensor) }) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(sensor.name)
                            .font(PlantgotchiTheme.bodyFont.weight(.medium))
                            .foregroundColor(PlantgotchiTheme.text)
                        Text(sensor.id.uuidString.prefix(8).uppercased())
                            .font(.caption)
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.4))
                    }

                    Spacer()

                    // Signal strength indicator
                    signalBars(rssi: sensor.rssi)

                    Text("\(sensor.rssi) dBm")
                        .font(.caption)
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                }
                .padding(.vertical, 4)
            }
        }
        .scrollContentBackground(.hidden)
    }

    // MARK: - Signal Bars

    private func signalBars(rssi: Int) -> some View {
        let strength: Int = {
            if rssi >= -50 { return 4 }
            if rssi >= -60 { return 3 }
            if rssi >= -70 { return 2 }
            return 1
        }()

        return HStack(spacing: 2) {
            ForEach(1...4, id: \.self) { bar in
                RoundedRectangle(cornerRadius: 1)
                    .fill(bar <= strength ? PlantgotchiTheme.green : Color.gray.opacity(0.2))
                    .frame(width: 4, height: CGFloat(bar) * 4 + 4)
            }
        }
    }

    // MARK: - Plant Picker

    private var plantPickerSheet: some View {
        NavigationStack {
            List(plants) { plant in
                Button(action: { assignSensorToPlant(plant) }) {
                    HStack {
                        Text(plant.emoji)
                            .font(.title2)
                        Text(plant.name)
                            .font(PlantgotchiTheme.bodyFont)
                            .foregroundColor(PlantgotchiTheme.text)
                    }
                }
            }
            .navigationTitle("Assign to Plant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { showPlantPicker = false }
                }
            }
        }
    }

    // MARK: - Actions

    private func loadPlants() {
        do {
            plants = try AppDatabase.shared.getPlants(userId: userId)
        } catch {
            print("[ScanView] Failed to load plants: \(error)")
        }
    }

    private func pairSensor(_ sensor: DiscoveredSensor) {
        selectedSensor = sensor
        bleManager.connect(to: sensor)
        showPlantPicker = true
    }

    private func assignSensorToPlant(_ plant: Plant) {
        guard let sensor = selectedSensor else { return }
        // Store the sensor-to-plant mapping in UserDefaults
        var mappings = UserDefaults.standard.dictionary(forKey: "sensorPlantMappings") as? [String: String] ?? [:]
        mappings[sensor.id.uuidString] = plant.id
        UserDefaults.standard.set(mappings, forKey: "sensorPlantMappings")

        showPlantPicker = false
        dismiss()
    }
}
