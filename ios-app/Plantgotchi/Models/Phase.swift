import Foundation

// MARK: - GrowLogType

/// Every type of event that can be logged during a grow.
enum GrowLogType: String, Codable, CaseIterable, Equatable {
    case phaseChange    = "phase_change"
    case watering       = "watering"
    case feeding        = "feeding"
    case topping        = "topping"
    case fimming        = "fimming"
    case lst            = "lst"
    case defoliation    = "defoliation"
    case transplant     = "transplant"
    case flushing       = "flushing"
    case trichomeCheck  = "trichome_check"
    case measurement    = "measurement"
    case environmental  = "environmental"
    case photo          = "photo"
    case note           = "note"
    case harvest        = "harvest"
    case dryWeight      = "dry_weight"
    case dryCheck       = "dry_check"
    case cureCheck      = "cure_check"
    case processingLog  = "processing_log"

    /// Human-readable label for display.
    var label: String {
        switch self {
        case .phaseChange:   return "Phase Change"
        case .watering:      return "Watering"
        case .feeding:       return "Feeding"
        case .topping:       return "Topping"
        case .fimming:       return "FIMming"
        case .lst:           return "LST"
        case .defoliation:   return "Defoliation"
        case .transplant:    return "Transplant"
        case .flushing:      return "Flushing"
        case .trichomeCheck: return "Trichome Check"
        case .measurement:   return "Measurement"
        case .environmental: return "Environmental"
        case .photo:         return "Photo"
        case .note:          return "Note"
        case .harvest:       return "Harvest"
        case .dryWeight:     return "Dry Weight"
        case .dryCheck:      return "Dry Check"
        case .cureCheck:     return "Cure Check"
        case .processingLog: return "Processing Log"
        }
    }

    /// SF Symbol icon name.
    var iconName: String {
        switch self {
        case .phaseChange:   return "arrow.right.circle"
        case .watering:      return "drop.fill"
        case .feeding:       return "leaf.arrow.circlepath"
        case .topping:       return "scissors"
        case .fimming:       return "scissors.badge.ellipsis"
        case .lst:           return "arrow.triangle.branch"
        case .defoliation:   return "leaf.fill"
        case .transplant:    return "arrow.up.bin.fill"
        case .flushing:      return "water.waves"
        case .trichomeCheck: return "magnifyingglass"
        case .measurement:   return "ruler"
        case .environmental: return "thermometer.medium"
        case .photo:         return "camera"
        case .note:          return "note.text"
        case .harvest:       return "checkmark.seal"
        case .dryWeight:     return "scalemass"
        case .dryCheck:      return "humidity"
        case .cureCheck:     return "clock.arrow.circlepath"
        case .processingLog: return "gearshape"
        }
    }
}

// MARK: - PhaseDefaults

/// Target environmental ranges for a given phase.
struct PhaseDefaults: Equatable {
    let tempMinC: Double
    let tempMaxC: Double
    let rhMin: Double
    let rhMax: Double
    let lightSchedule: String
}

// MARK: - Phase

/// The lifecycle phases of a cannabis plant.
enum Phase: String, Codable, CaseIterable, Equatable {
    case germination  = "germination"
    case seedling     = "seedling"
    case vegetative   = "vegetative"
    case flowering    = "flowering"
    case drying       = "drying"
    case curing       = "curing"
    case processing   = "processing"
    case complete     = "complete"

    /// The next sequential phase, or `nil` if already complete.
    var next: Phase? {
        switch self {
        case .germination: return .seedling
        case .seedling:    return .vegetative
        case .vegetative:  return .flowering
        case .flowering:   return .drying
        case .drying:      return .curing
        case .curing:      return .processing
        case .processing:  return .complete
        case .complete:    return nil
        }
    }

    /// Whether the plant is still alive / growing (germination through flowering).
    var isGrowing: Bool {
        switch self {
        case .germination, .seedling, .vegetative, .flowering:
            return true
        default:
            return false
        }
    }

    /// Whether environmental monitoring is relevant for this phase.
    var hasMonitoring: Bool {
        switch self {
        case .germination, .seedling, .vegetative, .flowering, .drying, .curing:
            return true
        case .processing, .complete:
            return false
        }
    }

    /// Recommended environmental defaults for this phase.
    var defaults: PhaseDefaults {
        switch self {
        case .germination:
            return PhaseDefaults(tempMinC: 22, tempMaxC: 28, rhMin: 70, rhMax: 90, lightSchedule: "18/6")
        case .seedling:
            return PhaseDefaults(tempMinC: 20, tempMaxC: 26, rhMin: 60, rhMax: 70, lightSchedule: "18/6")
        case .vegetative:
            return PhaseDefaults(tempMinC: 20, tempMaxC: 28, rhMin: 40, rhMax: 60, lightSchedule: "18/6")
        case .flowering:
            return PhaseDefaults(tempMinC: 18, tempMaxC: 26, rhMin: 40, rhMax: 50, lightSchedule: "12/12")
        case .drying:
            return PhaseDefaults(tempMinC: 18, tempMaxC: 22, rhMin: 55, rhMax: 65, lightSchedule: "0/24")
        case .curing:
            return PhaseDefaults(tempMinC: 18, tempMaxC: 22, rhMin: 58, rhMax: 65, lightSchedule: "0/24")
        case .processing:
            return PhaseDefaults(tempMinC: 18, tempMaxC: 24, rhMin: 40, rhMax: 60, lightSchedule: "0/24")
        case .complete:
            return PhaseDefaults(tempMinC: 0, tempMaxC: 0, rhMin: 0, rhMax: 0, lightSchedule: "n/a")
        }
    }

    /// Adjusted defaults for late flowering (week 6+): lower RH to prevent bud rot.
    static var lateFlowerDefaults: PhaseDefaults {
        PhaseDefaults(tempMinC: 18, tempMaxC: 26, rhMin: 30, rhMax: 40, lightSchedule: "12/12")
    }

    /// The set of log types available during this phase.
    var availableActions: Set<GrowLogType> {
        let common: Set<GrowLogType> = [.watering, .feeding, .environmental, .photo, .note, .measurement, .phaseChange]
        switch self {
        case .germination:
            return common
        case .seedling:
            return common.union([.transplant])
        case .vegetative:
            return common.union([.topping, .fimming, .lst, .defoliation, .transplant])
        case .flowering:
            return common.union([.defoliation, .flushing, .trichomeCheck, .harvest])
        case .drying:
            return [.dryCheck, .dryWeight, .environmental, .photo, .note, .phaseChange]
        case .curing:
            return [.cureCheck, .environmental, .photo, .note, .phaseChange]
        case .processing:
            return [.processingLog, .photo, .note, .phaseChange]
        case .complete:
            return [.photo, .note]
        }
    }
}
