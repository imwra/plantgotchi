import Foundation

// MARK: - Plant View Helpers (ported from website-astro/src/lib/plant-view.ts)

/// Status of a plant based on current sensor readings.
enum PlantStatus: String, Equatable {
    case happy
    case thirsty
    case unknown
}

/// Returns a human-readable light level label.
/// Ported from `getLightLabel()` in plant-view.ts.
func getLightLabel(light: Int?) -> String {
    guard let light = light else { return "unknown" }
    if light < 1000 { return "low" }
    if light <= 2000 { return "medium" }
    return "high"
}

/// Compute a health-point score (0-100) based on how close moisture and temperature
/// are to the midpoint of their acceptable range.
/// Ported from `computeHP()` in plant-view.ts.
func computeHP(
    moisture: Int?,
    temp: Double?,
    moistureMin: Int,
    moistureMax: Int,
    tempMin: Double,
    tempMax: Double
) -> Int {
    var scores: [Double] = []

    if let moisture = moisture {
        let mid = Double(moistureMin + moistureMax) / 2.0
        let half = Double(moistureMax - moistureMin) / 2.0
        let score: Double
        if half == 0 {
            score = moisture == Int(mid) ? 100 : 0
        } else {
            score = max(0, min(100, 100 - (abs(Double(moisture) - mid) / half) * 100))
        }
        scores.append(score)
    }

    if let temp = temp {
        let mid = (tempMin + tempMax) / 2.0
        let half = (tempMax - tempMin) / 2.0
        let score: Double
        if half == 0 {
            score = temp == mid ? 100 : 0
        } else {
            score = max(0, min(100, 100 - (abs(temp - mid) / half) * 100))
        }
        scores.append(score)
    }

    if scores.isEmpty { return 50 }
    return Int((scores.reduce(0, +) / Double(scores.count)).rounded())
}

/// Determine the plant's overall status based on sensor readings and thresholds.
/// Ported from `computeStatus()` in plant-view.ts.
func computeStatus(
    moisture: Int?,
    temp: Double?,
    moistureMin: Int,
    moistureMax: Int,
    tempMin: Double,
    tempMax: Double
) -> PlantStatus {
    if moisture == nil && temp == nil { return .unknown }

    if let moisture = moisture, (moisture < moistureMin || moisture > moistureMax) {
        return .thirsty
    }
    if let temp = temp, (temp < tempMin || temp > tempMax) {
        return .thirsty
    }

    return .happy
}

// MARK: - Plant View (composite)

/// A computed view-model for a plant, combining plant data with latest readings.
struct PlantView {
    let id: String
    let name: String
    let species: String
    let emoji: String
    let moisture: Int?
    let temp: Double?
    let light: Int?
    let lightLabel: String
    let lastWatered: String?
    let status: PlantStatus
    let hp: Int
    let moistureMin: Int
    let moistureMax: Int
    let tempMin: Double
    let tempMax: Double
    let phase: String?
}

/// Build a `PlantView` from a plant, its latest reading, and recent care logs.
/// Ported from `toPlantView()` in plant-view.ts.
func toPlantView(
    plant: Plant,
    latestReading: SensorReading?,
    recentCareLogs: [CareLog]
) -> PlantView {
    let moisture = latestReading?.moisture
    let temp = latestReading?.temperature
    let light = latestReading?.light

    let waterLog = recentCareLogs.first { $0.action == "water" }

    return PlantView(
        id: plant.id,
        name: plant.name,
        species: plant.species ?? "",
        emoji: plant.emoji,
        moisture: moisture,
        temp: temp,
        light: light,
        lightLabel: getLightLabel(light: light),
        lastWatered: waterLog?.createdAt,
        status: computeStatus(
            moisture: moisture,
            temp: temp,
            moistureMin: plant.moistureMin,
            moistureMax: plant.moistureMax,
            tempMin: plant.tempMin,
            tempMax: plant.tempMax
        ),
        hp: computeHP(
            moisture: moisture,
            temp: temp,
            moistureMin: plant.moistureMin,
            moistureMax: plant.moistureMax,
            tempMin: plant.tempMin,
            tempMax: plant.tempMax
        ),
        moistureMin: plant.moistureMin,
        moistureMax: plant.moistureMax,
        tempMin: plant.tempMin,
        tempMax: plant.tempMax,
        phase: plant.currentPhase?.rawValue
    )
}

// MARK: - Rule Engine (ported from website-astro/src/lib/agents/rules.ts)

/// Resolved thresholds used by the rule engine.
struct ResolvedThresholds {
    let tempMin: Double
    let tempMax: Double
    let moistureMin: Int
    let moistureMax: Int
}

/// Offline rule engine. Evaluates a plant + reading against threshold rules
/// and returns any generated recommendations. No network required.
enum RuleEngine {

    // MARK: - Threshold Resolution

    /// Returns effective thresholds for a plant, taking its current phase into account.
    /// - If the plant has a phase with monitoring: use phase defaults for temp, plant-level for moisture.
    /// - For flowering phase: if phaseStartedAt is >= 6 weeks ago, use lateFlowerDefaults for temp.
    /// - If no phase (nil): fall back to plant-level thresholds (backward compat).
    static func resolveThresholds(plant: Plant) -> ResolvedThresholds {
        guard let phase = plant.currentPhase else {
            // No phase set — backward compat: use plant-level thresholds
            return ResolvedThresholds(
                tempMin: plant.tempMin,
                tempMax: plant.tempMax,
                moistureMin: plant.moistureMin,
                moistureMax: plant.moistureMax
            )
        }

        guard phase.hasMonitoring else {
            // Non-monitored phases still return plant-level (won't be used since
            // evaluatePlant returns early, but keeps the API consistent)
            return ResolvedThresholds(
                tempMin: plant.tempMin,
                tempMax: plant.tempMax,
                moistureMin: plant.moistureMin,
                moistureMax: plant.moistureMax
            )
        }

        // Determine which phase defaults to use for temperature
        let phaseDefaults: PhaseDefaults
        if phase == .flowering, let startStr = plant.phaseStartedAt {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            let startDate = formatter.date(from: startStr)
                ?? ISO8601DateFormatter().date(from: startStr)
            if let start = startDate {
                let sixWeeks = TimeInterval(6 * 7 * 24 * 60 * 60)
                if Date().timeIntervalSince(start) >= sixWeeks {
                    phaseDefaults = Phase.lateFlowerDefaults
                } else {
                    phaseDefaults = phase.defaults
                }
            } else {
                phaseDefaults = phase.defaults
            }
        } else {
            phaseDefaults = phase.defaults
        }

        return ResolvedThresholds(
            tempMin: phaseDefaults.tempMinC,
            tempMax: phaseDefaults.tempMaxC,
            moistureMin: plant.moistureMin,
            moistureMax: plant.moistureMax
        )
    }

    // MARK: - Transition Suggestions

    /// Returns lifecycle transition suggestions based on phase duration and plant type.
    static func transitionSuggestions(plant: Plant) -> [Recommendation] {
        guard let phase = plant.currentPhase,
              let startStr = plant.phaseStartedAt else {
            return []
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let startDate = formatter.date(from: startStr)
                ?? ISO8601DateFormatter().date(from: startStr) else {
            return []
        }

        let daysInPhase = Int(Date().timeIntervalSince(startDate) / 86400)
        var recs: [Recommendation] = []

        switch phase {
        case .vegetative:
            if plant.plantType == .photo, daysInPhase >= 42 {
                recs.append(Recommendation(
                    plantId: plant.id,
                    source: "rules",
                    message: "\(plant.name) has been in veg for \(daysInPhase) days \u{2014} ready to flip to flower?",
                    severity: "info"
                ))
            }
            if plant.plantType == .auto, daysInPhase >= 21 {
                recs.append(Recommendation(
                    plantId: plant.id,
                    source: "rules",
                    message: "\(plant.name) has been in veg for \(daysInPhase) days \u{2014} most autos start flowering around now",
                    severity: "info"
                ))
            }
        case .drying:
            if daysInPhase >= 7 {
                recs.append(Recommendation(
                    plantId: plant.id,
                    source: "rules",
                    message: "\(plant.name) has been drying for \(daysInPhase) days \u{2014} check if small stems snap cleanly",
                    severity: "info"
                ))
            }
        default:
            break
        }

        return recs
    }

    // MARK: - Evaluate

    /// Evaluate a plant against a sensor reading and return recommendations.
    /// Phase-aware: skips sensor checks for non-monitored phases and uses
    /// phase-specific thresholds when available.
    static func evaluatePlant(
        plant: Plant,
        reading: SensorReading
    ) -> [Recommendation] {
        // Skip all sensor checks for non-monitored phases
        if let phase = plant.currentPhase, !phase.hasMonitoring {
            return []
        }

        let thresholds = resolveThresholds(plant: plant)
        var recs: [Recommendation] = []

        // Moisture too low
        if let moisture = reading.moisture, moisture < thresholds.moistureMin {
            recs.append(Recommendation(
                plantId: plant.id,
                source: "rules",
                message: "\(plant.name) needs water! Soil moisture at \(moisture)% (minimum: \(thresholds.moistureMin)%)",
                severity: moisture < 20 ? "urgent" : "warning"
            ))
        }

        // Moisture too high
        if let moisture = reading.moisture, moisture > thresholds.moistureMax {
            recs.append(Recommendation(
                plantId: plant.id,
                source: "rules",
                message: "\(plant.name) may be overwatered \u{2014} moisture at \(moisture)% (maximum: \(thresholds.moistureMax)%)",
                severity: "warning"
            ))
        }

        // Temperature too low
        if let temp = reading.temperature, temp < thresholds.tempMin {
            recs.append(Recommendation(
                plantId: plant.id,
                source: "rules",
                message: "Too cold for \(plant.name)! Temperature at \(temp)\u{00B0}C (minimum: \(thresholds.tempMin)\u{00B0}C)",
                severity: temp < thresholds.tempMin - 5 ? "urgent" : "warning"
            ))
        }

        // Temperature too high
        if let temp = reading.temperature, temp > thresholds.tempMax {
            recs.append(Recommendation(
                plantId: plant.id,
                source: "rules",
                message: "Too hot for \(plant.name)! Temperature at \(temp)\u{00B0}C (maximum: \(thresholds.tempMax)\u{00B0}C)",
                severity: temp > thresholds.tempMax + 5 ? "urgent" : "warning"
            ))
        }

        // Low battery
        if let battery = reading.battery, battery < 15 {
            recs.append(Recommendation(
                plantId: plant.id,
                source: "rules",
                message: "Sensor battery low for \(plant.name) (\(battery)%) \u{2014} charge soon",
                severity: battery < 5 ? "urgent" : "warning"
            ))
        }

        // High-light plant in low light — only in growing phases or when phase is nil (backward compat)
        let applyLightRule = plant.currentPhase == nil || (plant.currentPhase?.isGrowing ?? false)
        if applyLightRule, let light = reading.light, plant.lightPreference == "high", light < 1000 {
            recs.append(Recommendation(
                plantId: plant.id,
                source: "rules",
                message: "\(plant.name) prefers bright light but only getting \(light) lux \u{2014} consider moving to a sunnier spot",
                severity: "info"
            ))
        }

        // Append transition suggestions
        recs.append(contentsOf: transitionSuggestions(plant: plant))

        return recs
    }

    /// Process a reading: evaluate rules and persist any recommendations to the database.
    static func processReading(plant: Plant, reading: SensorReading, db: AppDatabase) throws {
        let recs = evaluatePlant(plant: plant, reading: reading)
        for rec in recs {
            try db.addRecommendation(rec)
        }
    }
}
