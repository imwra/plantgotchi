# Cannabis Lifecycle Tracking — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full cannabis lifecycle tracking to Plantgotchi — phases, grow journal, strain profiles, achievements, and phase-aware rule engine.

**Architecture:** Extend the existing Plant model with lifecycle fields, add new models (Grow, GrowLog, StrainProfile, Achievement, Phase enum), make the RuleEngine phase-aware, and build new views for the journal, phase transitions, and stats. All changes are additive — existing functionality is preserved.

**Tech Stack:** Swift, SwiftUI, GRDB (SQLite), XCTest. iOS-first (mac-app and web follow later).

**Spec:** `docs/superpowers/specs/2026-03-20-cannabis-lifecycle-design.md`

**Design divergence:** The spec uses a single `training` log_type with a `method` field in the JSON data. This plan promotes training sub-types (topping, fimming, lst, defoliation, etc.) to top-level `GrowLogType` enum cases. This is more ergonomic for SwiftUI (filtering, icons, labels) and avoids JSON parsing for common operations. Web/mac implementations should use the same vocabulary when they adopt this model.

---

## File Structure

### New files to create

| File | Responsibility |
|------|---------------|
| `ios-app/Plantgotchi/Models/Phase.swift` | Phase enum, phase defaults (thresholds, available actions), phase metadata |
| `ios-app/Plantgotchi/Models/Grow.swift` | Grow model + GRDB records |
| `ios-app/Plantgotchi/Models/GrowLog.swift` | GrowLog model + GRDB records, log type enum |
| `ios-app/Plantgotchi/Models/StrainProfile.swift` | StrainProfile model + GRDB records |
| `ios-app/Plantgotchi/Models/Achievement.swift` | Achievement model + GRDB records, achievement definitions |
| `ios-app/Plantgotchi/Views/PhaseTransitionView.swift` | Confirm phase change with notes/photo |
| `ios-app/Plantgotchi/Views/GrowLogView.swift` | Journal timeline with filters |
| `ios-app/Plantgotchi/Views/QuickLogView.swift` | Quick-log action sheet, phase-aware actions |
| `ios-app/Plantgotchi/Views/StrainPickerView.swift` | Search/select or create custom strain |
| `ios-app/Plantgotchi/Views/AddMeasurementView.swift` | Log height, pH, weight measurements |
| `ios-app/PlantgotchiTests/PhaseTests.swift` | Phase enum, defaults, threshold resolution |
| `ios-app/PlantgotchiTests/GrowLogTests.swift` | GrowLog DB CRUD |
| `ios-app/PlantgotchiTests/StrainProfileTests.swift` | StrainProfile DB CRUD |
| `ios-app/PlantgotchiTests/AchievementTests.swift` | Achievement DB CRUD and unlock logic |
| `ios-app/PlantgotchiTests/PhaseAwareRuleEngineTests.swift` | Phase-aware rule engine tests |

### Existing files to modify

| File | Changes |
|------|---------|
| `ios-app/Plantgotchi/Models/Plant.swift` | Add lifecycle fields (plant_type, strain_id, strain_name, strain_type, environment, current_phase, phase_started_at, grow_id) |
| `ios-app/Plantgotchi/Database/Schema.swift` | Add v2 migration with new tables, ALTER plants, indexes |
| `ios-app/Plantgotchi/Database/AppDatabase.swift` | Add CRUD methods for Grow, GrowLog, StrainProfile, Achievement |
| `ios-app/Plantgotchi/Agents/RuleEngine.swift` | Make phase-aware: load thresholds from phase → strain → plant, add phase-specific rules |
| `ios-app/Plantgotchi/Views/AddPlantView.swift` | Multi-step flow with strain picker, plant type, environment, starting phase |
| `ios-app/Plantgotchi/Views/PlantDetailView.swift` | Add phase banner, phase timeline bar, journal tab, phase-aware quick actions |
| `ios-app/Plantgotchi/Views/PlantCardView.swift` | Add phase badge to card |
| `ios-app/PlantgotchiTests/DatabaseTests.swift` | Add tests for new DB methods |
| `ios-app/PlantgotchiTests/RuleEngineTests.swift` | Update makePlant helper for new fields |

---

## Chunk 1: Data Foundation (Models, Schema, Database)

### Task 1: Phase Enum and Defaults

**Files:**
- Create: `ios-app/Plantgotchi/Models/Phase.swift`
- Create: `ios-app/PlantgotchiTests/PhaseTests.swift`

- [ ] **Step 1: Write failing tests for Phase enum**

```swift
// ios-app/PlantgotchiTests/PhaseTests.swift
import XCTest
@testable import Plantgotchi

final class PhaseTests: XCTestCase {

    func testAllPhasesExist() {
        let all = Phase.allCases
        XCTAssertEqual(all.count, 8)
        XCTAssertTrue(all.contains(.germination))
        XCTAssertTrue(all.contains(.seedling))
        XCTAssertTrue(all.contains(.vegetative))
        XCTAssertTrue(all.contains(.flowering))
        XCTAssertTrue(all.contains(.drying))
        XCTAssertTrue(all.contains(.curing))
        XCTAssertTrue(all.contains(.processing))
        XCTAssertTrue(all.contains(.complete))
    }

    func testPhaseOrder() {
        XCTAssertTrue(Phase.germination.next == .seedling)
        XCTAssertTrue(Phase.seedling.next == .vegetative)
        XCTAssertTrue(Phase.vegetative.next == .flowering)
        XCTAssertTrue(Phase.flowering.next == .drying)
        XCTAssertTrue(Phase.drying.next == .curing)
        XCTAssertTrue(Phase.curing.next == .processing)
        XCTAssertTrue(Phase.processing.next == .complete)
        XCTAssertNil(Phase.complete.next)
    }

    func testPhaseDefaults_vegetative() {
        let defaults = Phase.vegetative.defaults
        XCTAssertEqual(defaults.tempMinC, 21.0)
        XCTAssertEqual(defaults.tempMaxC, 29.0)
        XCTAssertEqual(defaults.rhMin, 40)
        XCTAssertEqual(defaults.rhMax, 60)
        XCTAssertEqual(defaults.lightSchedule, "18/6")
    }

    func testPhaseDefaults_flowering() {
        let defaults = Phase.flowering.defaults
        XCTAssertEqual(defaults.tempMinC, 18.0)
        XCTAssertEqual(defaults.tempMaxC, 27.0)
        XCTAssertEqual(defaults.lightSchedule, "12/12")
    }

    func testPhaseDefaults_completeHasNoMonitoring() {
        let defaults = Phase.complete.defaults
        XCTAssertNil(defaults.tempMinC)
        XCTAssertNil(defaults.tempMaxC)
    }

    func testAvailableActions_vegetative() {
        let actions = Phase.vegetative.availableActions
        XCTAssertTrue(actions.contains(.watering))
        XCTAssertTrue(actions.contains(.feeding))
        XCTAssertTrue(actions.contains(.topping))
        XCTAssertTrue(actions.contains(.lst))
        XCTAssertTrue(actions.contains(.defoliation))
        XCTAssertTrue(actions.contains(.measurement))
        XCTAssertFalse(actions.contains(.flushing))
    }

    func testAvailableActions_flowering() {
        let actions = Phase.flowering.availableActions
        XCTAssertTrue(actions.contains(.watering))
        XCTAssertTrue(actions.contains(.feeding))
        XCTAssertTrue(actions.contains(.defoliation))
        XCTAssertTrue(actions.contains(.flushing))
        XCTAssertFalse(actions.contains(.topping))
    }

    func testAvailableActions_drying() {
        let actions = Phase.drying.availableActions
        XCTAssertTrue(actions.contains(.dryCheck))
        XCTAssertTrue(actions.contains(.measurement))
        XCTAssertFalse(actions.contains(.watering))
    }

    func testIsGrowingPhase() {
        XCTAssertTrue(Phase.germination.isGrowing)
        XCTAssertTrue(Phase.vegetative.isGrowing)
        XCTAssertTrue(Phase.flowering.isGrowing)
        XCTAssertFalse(Phase.drying.isGrowing)
        XCTAssertFalse(Phase.complete.isGrowing)
    }

    func testLateFlowerThresholds() {
        let late = Phase.flowering.lateFlowerDefaults
        XCTAssertEqual(late.tempMaxC, 24.0)
        XCTAssertEqual(late.rhMax, 40)
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ios-app && swift test --filter PhaseTests 2>&1 | head -20`
Expected: Compilation error — `Phase` not defined

- [ ] **Step 3: Implement Phase enum**

```swift
// ios-app/Plantgotchi/Models/Phase.swift
import Foundation

/// The lifecycle phases a cannabis plant moves through.
enum Phase: String, CaseIterable, Codable {
    case germination
    case seedling
    case vegetative
    case flowering
    case drying
    case curing
    case processing
    case complete

    /// The next phase in the lifecycle, or nil if terminal.
    var next: Phase? {
        let all = Phase.allCases
        guard let idx = all.firstIndex(of: self), idx + 1 < all.count else { return nil }
        return all[idx + 1]
    }

    /// Whether this is a growing (pre-harvest) phase.
    var isGrowing: Bool {
        switch self {
        case .germination, .seedling, .vegetative, .flowering: return true
        default: return false
        }
    }

    /// Whether sensor monitoring is active in this phase.
    var hasMonitoring: Bool {
        switch self {
        case .processing, .complete: return false
        default: return true
        }
    }

    /// Default environmental thresholds for this phase.
    var defaults: PhaseDefaults {
        switch self {
        case .germination:
            return PhaseDefaults(tempMinC: 24.0, tempMaxC: 27.0, rhMin: 70, rhMax: 80, lightSchedule: "18/6")
        case .seedling:
            return PhaseDefaults(tempMinC: 22.0, tempMaxC: 27.0, rhMin: 65, rhMax: 70, lightSchedule: "18/6")
        case .vegetative:
            return PhaseDefaults(tempMinC: 21.0, tempMaxC: 29.0, rhMin: 40, rhMax: 60, lightSchedule: "18/6")
        case .flowering:
            return PhaseDefaults(tempMinC: 18.0, tempMaxC: 27.0, rhMin: 35, rhMax: 50, lightSchedule: "12/12")
        case .drying:
            return PhaseDefaults(tempMinC: 16.0, tempMaxC: 21.0, rhMin: 55, rhMax: 65, lightSchedule: "dark")
        case .curing:
            return PhaseDefaults(tempMinC: 16.0, tempMaxC: 21.0, rhMin: 58, rhMax: 65, lightSchedule: "dark")
        case .processing, .complete:
            return PhaseDefaults(tempMinC: nil, tempMaxC: nil, rhMin: nil, rhMax: nil, lightSchedule: nil)
        }
    }

    /// Late-flower thresholds (week 6+), tighter ranges to prevent mold.
    var lateFlowerDefaults: PhaseDefaults {
        PhaseDefaults(tempMinC: 18.0, tempMaxC: 24.0, rhMin: 30, rhMax: 40, lightSchedule: "12/12")
    }

    /// Actions available to log during this phase.
    var availableActions: Set<GrowLogType> {
        switch self {
        case .germination:
            return [.watering, .note, .photo, .measurement]
        case .seedling:
            return [.watering, .feeding, .note, .photo, .measurement]
        case .vegetative:
            return [.watering, .feeding, .topping, .fimming, .lst, .defoliation,
                    .transplant, .note, .photo, .measurement]
        case .flowering:
            return [.watering, .feeding, .defoliation, .flushing, .trichomeCheck,
                    .note, .photo, .measurement]
        case .drying:
            return [.dryCheck, .measurement, .note, .photo]
        case .curing:
            return [.cureCheck, .measurement, .note, .photo]
        case .processing:
            return [.processingLog, .measurement, .note, .photo]
        case .complete:
            return [.note, .photo]
        }
    }
}

/// Environmental thresholds for a phase.
struct PhaseDefaults: Equatable {
    let tempMinC: Double?
    let tempMaxC: Double?
    let rhMin: Int?
    let rhMax: Int?
    let lightSchedule: String?
}

/// Types of grow log entries.
enum GrowLogType: String, CaseIterable, Codable {
    case phaseChange = "phase_change"
    case watering
    case feeding
    case topping
    case fimming
    case lst
    case defoliation
    case transplant
    case flushing
    case trichomeCheck = "trichome_check"
    case measurement
    case environmental
    case photo
    case note
    case harvest
    case dryWeight = "dry_weight"
    case dryCheck = "dry_check"
    case cureCheck = "cure_check"
    case processingLog = "processing"

    /// Human-readable label for display.
    var label: String {
        switch self {
        case .phaseChange: return "Phase Change"
        case .watering: return "Watering"
        case .feeding: return "Feeding"
        case .topping: return "Topping"
        case .fimming: return "FIMing"
        case .lst: return "LST"
        case .defoliation: return "Defoliation"
        case .transplant: return "Transplant"
        case .flushing: return "Flushing"
        case .trichomeCheck: return "Trichome Check"
        case .measurement: return "Measurement"
        case .environmental: return "Environmental"
        case .photo: return "Photo"
        case .note: return "Note"
        case .harvest: return "Harvest"
        case .dryWeight: return "Dry Weight"
        case .dryCheck: return "Dry Check"
        case .cureCheck: return "Cure Check"
        case .processingLog: return "Processing"
        }
    }

    /// SF Symbol icon name.
    var iconName: String {
        switch self {
        case .phaseChange: return "arrow.right.circle.fill"
        case .watering: return "drop.fill"
        case .feeding: return "leaf.fill"
        case .topping: return "scissors"
        case .fimming: return "scissors"
        case .lst: return "arrow.triangle.branch"
        case .defoliation: return "leaf.arrow.triangle.circlepath"
        case .transplant: return "arrow.triangle.2.circlepath"
        case .flushing: return "drop.triangle.fill"
        case .trichomeCheck: return "magnifyingglass"
        case .measurement: return "ruler"
        case .environmental: return "thermometer.medium"
        case .photo: return "camera.fill"
        case .note: return "note.text"
        case .harvest: return "scissors"
        case .dryWeight: return "scalemass"
        case .dryCheck: return "hand.point.up.fill"
        case .cureCheck: return "cylinder.fill"
        case .processingLog: return "gearshape.fill"
        }
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ios-app && swift test --filter PhaseTests 2>&1 | tail -5`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add ios-app/Plantgotchi/Models/Phase.swift ios-app/PlantgotchiTests/PhaseTests.swift
git commit -m "feat: add Phase enum with lifecycle defaults and available actions"
```

---

### Task 2: Extend Plant Model

**Files:**
- Modify: `ios-app/Plantgotchi/Models/Plant.swift`
- Modify: `ios-app/PlantgotchiTests/DatabaseTests.swift`

- [ ] **Step 1: Write failing test for extended Plant fields**

Add to `ios-app/PlantgotchiTests/DatabaseTests.swift`:

```swift
func testInsertAndFetchPlant_withLifecycleFields() throws {
    let plant = Plant(
        id: "plant-lc",
        userId: "user-1",
        name: "Northern Lights",
        species: "Cannabis indica",
        emoji: "🌿",
        plantType: .photo,
        strainName: "Northern Lights",
        strainType: .indica,
        environment: .indoor,
        currentPhase: .vegetative,
        phaseStartedAt: "2026-03-01T00:00:00Z"
    )
    try db.savePlant(plant)

    let fetched = try db.getPlant(id: "plant-lc")
    XCTAssertNotNil(fetched)
    XCTAssertEqual(fetched?.plantType, .photo)
    XCTAssertEqual(fetched?.strainName, "Northern Lights")
    XCTAssertEqual(fetched?.strainType, .indica)
    XCTAssertEqual(fetched?.environment, .indoor)
    XCTAssertEqual(fetched?.currentPhase, .vegetative)
    XCTAssertEqual(fetched?.phaseStartedAt, "2026-03-01T00:00:00Z")
}

func testPlantDefaultValues_backwardCompatible() throws {
    // Old-style plant creation still works
    let plant = Plant(id: "old-plant", userId: "user-1", name: "Old Fern")
    try db.savePlant(plant)

    let fetched = try db.getPlant(id: "old-plant")
    XCTAssertNotNil(fetched)
    XCTAssertNil(fetched?.plantType)
    XCTAssertNil(fetched?.currentPhase)
    XCTAssertNil(fetched?.strainName)
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ios-app && swift test --filter DatabaseTests 2>&1 | head -20`
Expected: Compilation error — `plantType`, `currentPhase` etc. not defined on Plant

- [ ] **Step 3: Extend Plant model with lifecycle fields**

Update `ios-app/Plantgotchi/Models/Plant.swift`:

```swift
import Foundation
import GRDB

/// Plant type for cannabis.
enum PlantType: String, Codable {
    case photo
    case auto
}

/// Strain genetic type.
enum StrainType: String, Codable {
    case indica
    case sativa
    case hybrid
}

/// Growing environment.
enum GrowEnvironment: String, Codable {
    case indoor
    case outdoor
}

/// A plant owned by a user, matching the `plants` table in the web schema.
struct Plant: Codable, Identifiable, Equatable {
    var id: String
    var userId: String
    var name: String
    var species: String?
    var emoji: String
    var photoUrl: String?
    var moistureMin: Int
    var moistureMax: Int
    var tempMin: Double
    var tempMax: Double
    var lightPreference: String
    var createdAt: String?
    var updatedAt: String?
    // Lifecycle fields
    var plantType: PlantType?
    var strainId: String?
    var strainName: String?
    var strainType: StrainType?
    var environment: GrowEnvironment?
    var currentPhase: Phase?
    var phaseStartedAt: String?
    var growId: String?

    /// Create a new plant with defaults matching the SQL schema.
    init(
        id: String = UUID().uuidString,
        userId: String,
        name: String,
        species: String? = nil,
        emoji: String = "🌱",
        photoUrl: String? = nil,
        moistureMin: Int = 30,
        moistureMax: Int = 80,
        tempMin: Double = 15.0,
        tempMax: Double = 30.0,
        lightPreference: String = "medium",
        createdAt: String? = nil,
        updatedAt: String? = nil,
        plantType: PlantType? = nil,
        strainId: String? = nil,
        strainName: String? = nil,
        strainType: StrainType? = nil,
        environment: GrowEnvironment? = nil,
        currentPhase: Phase? = nil,
        phaseStartedAt: String? = nil,
        growId: String? = nil
    ) {
        self.id = id
        self.userId = userId
        self.name = name
        self.species = species
        self.emoji = emoji
        self.photoUrl = photoUrl
        self.moistureMin = moistureMin
        self.moistureMax = moistureMax
        self.tempMin = tempMin
        self.tempMax = tempMax
        self.lightPreference = lightPreference
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.plantType = plantType
        self.strainId = strainId
        self.strainName = strainName
        self.strainType = strainType
        self.environment = environment
        self.currentPhase = currentPhase
        self.phaseStartedAt = phaseStartedAt
        self.growId = growId
    }
}

// MARK: - GRDB TableRecord + FetchableRecord + PersistableRecord

extension Plant: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "plants"

    /// Map Swift camelCase properties to SQL snake_case columns.
    enum Columns: String, ColumnExpression {
        case id
        case userId = "user_id"
        case name
        case species
        case emoji
        case photoUrl = "photo_url"
        case moistureMin = "moisture_min"
        case moistureMax = "moisture_max"
        case tempMin = "temp_min"
        case tempMax = "temp_max"
        case lightPreference = "light_preference"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case plantType = "plant_type"
        case strainId = "strain_id"
        case strainName = "strain_name"
        case strainType = "strain_type"
        case environment
        case currentPhase = "current_phase"
        case phaseStartedAt = "phase_started_at"
        case growId = "grow_id"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case species
        case emoji
        case photoUrl = "photo_url"
        case moistureMin = "moisture_min"
        case moistureMax = "moisture_max"
        case tempMin = "temp_min"
        case tempMax = "temp_max"
        case lightPreference = "light_preference"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case plantType = "plant_type"
        case strainId = "strain_id"
        case strainName = "strain_name"
        case strainType = "strain_type"
        case environment
        case currentPhase = "current_phase"
        case phaseStartedAt = "phase_started_at"
        case growId = "grow_id"
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ios-app && swift test --filter DatabaseTests 2>&1 | tail -5`
Expected: All tests pass (schema migration needed first — see Task 4)

- [ ] **Step 5: Commit**

```bash
git add ios-app/Plantgotchi/Models/Plant.swift ios-app/PlantgotchiTests/DatabaseTests.swift
git commit -m "feat: extend Plant model with lifecycle fields"
```

---

### Task 3: New Models — Grow, GrowLog, StrainProfile, Achievement

**Files:**
- Create: `ios-app/Plantgotchi/Models/Grow.swift`
- Create: `ios-app/Plantgotchi/Models/GrowLog.swift`
- Create: `ios-app/Plantgotchi/Models/StrainProfile.swift`
- Create: `ios-app/Plantgotchi/Models/Achievement.swift`

- [ ] **Step 1: Create Grow model**

```swift
// ios-app/Plantgotchi/Models/Grow.swift
import Foundation
import GRDB

struct Grow: Codable, Identifiable, Equatable {
    var id: String
    var userId: String
    var name: String
    var environment: GrowEnvironment?
    var startDate: String?
    var endDate: String?
    var notes: String?
    var status: String  // "active" or "complete"
    var createdAt: String?
    var updatedAt: String?

    init(
        id: String = UUID().uuidString,
        userId: String,
        name: String,
        environment: GrowEnvironment? = nil,
        startDate: String? = nil,
        endDate: String? = nil,
        notes: String? = nil,
        status: String = "active",
        createdAt: String? = nil,
        updatedAt: String? = nil
    ) {
        self.id = id
        self.userId = userId
        self.name = name
        self.environment = environment
        self.startDate = startDate
        self.endDate = endDate
        self.notes = notes
        self.status = status
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

extension Grow: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "grows"

    enum Columns: String, ColumnExpression {
        case id, userId = "user_id", name, environment
        case startDate = "start_date", endDate = "end_date"
        case notes, status
        case createdAt = "created_at", updatedAt = "updated_at"
    }

    enum CodingKeys: String, CodingKey {
        case id, userId = "user_id", name, environment
        case startDate = "start_date", endDate = "end_date"
        case notes, status
        case createdAt = "created_at", updatedAt = "updated_at"
    }
}
```

- [ ] **Step 2: Create GrowLog model**

```swift
// ios-app/Plantgotchi/Models/GrowLog.swift
import Foundation
import GRDB

struct GrowLog: Codable, Identifiable, Equatable {
    var id: String
    var plantId: String
    var userId: String
    var phase: Phase
    var logType: GrowLogType
    var data: String?       // JSON blob
    var photoUrl: String?
    var notes: String?
    var createdAt: String?

    init(
        id: String = UUID().uuidString,
        plantId: String,
        userId: String,
        phase: Phase,
        logType: GrowLogType,
        data: String? = nil,
        photoUrl: String? = nil,
        notes: String? = nil,
        createdAt: String? = nil
    ) {
        self.id = id
        self.plantId = plantId
        self.userId = userId
        self.phase = phase
        self.logType = logType
        self.data = data
        self.photoUrl = photoUrl
        self.notes = notes
        self.createdAt = createdAt
    }
}

extension GrowLog: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "grow_logs"

    enum Columns: String, ColumnExpression {
        case id
        case plantId = "plant_id"
        case userId = "user_id"
        case phase
        case logType = "log_type"
        case data
        case photoUrl = "photo_url"
        case notes
        case createdAt = "created_at"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case plantId = "plant_id"
        case userId = "user_id"
        case phase
        case logType = "log_type"
        case data
        case photoUrl = "photo_url"
        case notes
        case createdAt = "created_at"
    }
}
```

- [ ] **Step 3: Create StrainProfile model**

```swift
// ios-app/Plantgotchi/Models/StrainProfile.swift
import Foundation
import GRDB

struct StrainProfile: Codable, Identifiable, Equatable {
    var id: String
    var name: String
    var type: StrainType?
    var flowerWeeksMin: Int?
    var flowerWeeksMax: Int?
    var difficulty: String?
    var thresholdsByPhase: String?  // JSON
    var notes: String?
    var isCustom: Bool
    var userId: String?
    var createdAt: String?

    init(
        id: String = UUID().uuidString,
        name: String,
        type: StrainType? = nil,
        flowerWeeksMin: Int? = nil,
        flowerWeeksMax: Int? = nil,
        difficulty: String? = nil,
        thresholdsByPhase: String? = nil,
        notes: String? = nil,
        isCustom: Bool = false,
        userId: String? = nil,
        createdAt: String? = nil
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.flowerWeeksMin = flowerWeeksMin
        self.flowerWeeksMax = flowerWeeksMax
        self.difficulty = difficulty
        self.thresholdsByPhase = thresholdsByPhase
        self.notes = notes
        self.isCustom = isCustom
        self.userId = userId
        self.createdAt = createdAt
    }
}

extension StrainProfile: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "strain_profiles"

    enum Columns: String, ColumnExpression {
        case id, name, type
        case flowerWeeksMin = "flower_weeks_min"
        case flowerWeeksMax = "flower_weeks_max"
        case difficulty
        case thresholdsByPhase = "thresholds_by_phase"
        case notes
        case isCustom = "is_custom"
        case userId = "user_id"
        case createdAt = "created_at"
    }

    enum CodingKeys: String, CodingKey {
        case id, name, type
        case flowerWeeksMin = "flower_weeks_min"
        case flowerWeeksMax = "flower_weeks_max"
        case difficulty
        case thresholdsByPhase = "thresholds_by_phase"
        case notes
        case isCustom = "is_custom"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}
```

- [ ] **Step 4: Create Achievement model**

```swift
// ios-app/Plantgotchi/Models/Achievement.swift
import Foundation
import GRDB

struct Achievement: Codable, Identifiable, Equatable {
    var id: String
    var userId: String
    var achievementKey: String
    var points: Int
    var unlockedAt: String
    var metadata: String?  // JSON

    init(
        id: String = UUID().uuidString,
        userId: String,
        achievementKey: String,
        points: Int,
        unlockedAt: String? = nil,
        metadata: String? = nil
    ) {
        self.id = id
        self.userId = userId
        self.achievementKey = achievementKey
        self.points = points
        self.unlockedAt = unlockedAt ?? ISO8601DateFormatter().string(from: Date())
        self.metadata = metadata
    }
}

extension Achievement: TableRecord, FetchableRecord, PersistableRecord {
    static let databaseTableName = "achievements"

    enum Columns: String, ColumnExpression {
        case id
        case userId = "user_id"
        case achievementKey = "achievement_key"
        case points
        case unlockedAt = "unlocked_at"
        case metadata
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case achievementKey = "achievement_key"
        case points
        case unlockedAt = "unlocked_at"
        case metadata
    }
}

/// Known achievement definitions.
enum AchievementDef {
    case firstSeed
    case firstHarvest
    case tenPlants
    case firstTop
    case firstLST
    case speedGrow
    case firstGram
    case bigYield100g
    case weekStreak
    case fiveStrains

    var key: String {
        switch self {
        case .firstSeed: return "first_seed"
        case .firstHarvest: return "first_harvest"
        case .tenPlants: return "ten_plants"
        case .firstTop: return "first_top"
        case .firstLST: return "first_lst"
        case .speedGrow: return "speed_grow_90d"
        case .firstGram: return "first_gram"
        case .bigYield100g: return "big_yield_100g"
        case .weekStreak: return "week_streak"
        case .fiveStrains: return "five_strains"
        }
    }

    var points: Int {
        switch self {
        case .firstSeed: return 10
        case .firstHarvest: return 50
        case .tenPlants: return 30
        case .firstTop: return 20
        case .firstLST: return 20
        case .speedGrow: return 100
        case .firstGram: return 25
        case .bigYield100g: return 75
        case .weekStreak: return 15
        case .fiveStrains: return 40
        }
    }

    var label: String {
        switch self {
        case .firstSeed: return "First Seed"
        case .firstHarvest: return "First Harvest"
        case .tenPlants: return "Green Thumb"
        case .firstTop: return "Top Chef"
        case .firstLST: return "Plant Whisperer"
        case .speedGrow: return "Speed Grower"
        case .firstGram: return "First Gram"
        case .bigYield100g: return "Heavy Hitter"
        case .weekStreak: return "Dedicated Grower"
        case .fiveStrains: return "Strain Collector"
        }
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add ios-app/Plantgotchi/Models/Grow.swift ios-app/Plantgotchi/Models/GrowLog.swift \
        ios-app/Plantgotchi/Models/StrainProfile.swift ios-app/Plantgotchi/Models/Achievement.swift
git commit -m "feat: add Grow, GrowLog, StrainProfile, Achievement models"
```

---

### Task 4: Database Schema Migration v2

**Files:**
- Modify: `ios-app/Plantgotchi/Database/Schema.swift`

- [ ] **Step 1: Write failing test for v2 tables**

Add to `ios-app/PlantgotchiTests/DatabaseTests.swift`:

```swift
func testV2Migration_growsTableExists() throws {
    let grow = Grow(userId: "user-1", name: "Spring 2026")
    try db.saveGrow(grow)
    let fetched = try db.getGrow(id: grow.id)
    XCTAssertNotNil(fetched)
    XCTAssertEqual(fetched?.name, "Spring 2026")
}

func testV2Migration_growLogsTableExists() throws {
    try db.savePlant(Plant(id: "p1", userId: "u1", name: "Test"))
    let log = GrowLog(
        plantId: "p1", userId: "u1",
        phase: .vegetative, logType: .watering,
        notes: "Heavy watering"
    )
    try db.addGrowLog(log)
    let logs = try db.getGrowLogs(plantId: "p1")
    XCTAssertEqual(logs.count, 1)
    XCTAssertEqual(logs[0].logType, .watering)
    XCTAssertEqual(logs[0].phase, .vegetative)
}

func testV2Migration_strainProfilesTableExists() throws {
    let strain = StrainProfile(name: "Northern Lights", type: .indica, flowerWeeksMin: 7, flowerWeeksMax: 9)
    try db.saveStrainProfile(strain)
    let fetched = try db.getStrainProfile(id: strain.id)
    XCTAssertNotNil(fetched)
    XCTAssertEqual(fetched?.name, "Northern Lights")
}

func testV2Migration_achievementsTableExists() throws {
    let achievement = Achievement(userId: "u1", achievementKey: "first_seed", points: 10)
    try db.saveAchievement(achievement)
    let achievements = try db.getAchievements(userId: "u1")
    XCTAssertEqual(achievements.count, 1)
    XCTAssertEqual(achievements[0].achievementKey, "first_seed")
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ios-app && swift test --filter DatabaseTests 2>&1 | head -20`
Expected: Compilation error — `saveGrow`, `addGrowLog`, etc. not defined

- [ ] **Step 3: Add v2 migration to Schema.swift**

Add after the existing `v1_create_tables` migration in `ios-app/Plantgotchi/Database/Schema.swift`:

```swift
migrator.registerMigration("v2_cannabis_lifecycle") { db in
    // Extend plants table with lifecycle columns
    try db.execute(sql: "ALTER TABLE plants ADD COLUMN plant_type TEXT")
    try db.execute(sql: "ALTER TABLE plants ADD COLUMN strain_id TEXT")
    try db.execute(sql: "ALTER TABLE plants ADD COLUMN strain_name TEXT")
    try db.execute(sql: "ALTER TABLE plants ADD COLUMN strain_type TEXT")
    try db.execute(sql: "ALTER TABLE plants ADD COLUMN environment TEXT")
    try db.execute(sql: "ALTER TABLE plants ADD COLUMN current_phase TEXT")
    try db.execute(sql: "ALTER TABLE plants ADD COLUMN phase_started_at TEXT")
    try db.execute(sql: "ALTER TABLE plants ADD COLUMN grow_id TEXT")

    // Grows table
    try db.execute(sql: """
        CREATE TABLE IF NOT EXISTS grows (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            environment TEXT,
            start_date TEXT,
            end_date TEXT,
            notes TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
        """)

    // Grow logs table
    try db.execute(sql: """
        CREATE TABLE IF NOT EXISTS grow_logs (
            id TEXT PRIMARY KEY,
            plant_id TEXT NOT NULL REFERENCES plants(id),
            user_id TEXT NOT NULL,
            phase TEXT NOT NULL,
            log_type TEXT NOT NULL,
            data TEXT,
            photo_url TEXT,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
        """)

    // Strain profiles table
    try db.execute(sql: """
        CREATE TABLE IF NOT EXISTS strain_profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT,
            flower_weeks_min INTEGER,
            flower_weeks_max INTEGER,
            difficulty TEXT,
            thresholds_by_phase TEXT,
            notes TEXT,
            is_custom INTEGER DEFAULT 0,
            user_id TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
        """)

    // Achievements table
    try db.execute(sql: """
        CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            achievement_key TEXT NOT NULL,
            points INTEGER NOT NULL,
            unlocked_at TEXT NOT NULL,
            metadata TEXT,
            UNIQUE(user_id, achievement_key)
        )
        """)

    // Indexes
    try db.execute(sql: """
        CREATE INDEX IF NOT EXISTS idx_grow_logs_plant_time
        ON grow_logs(plant_id, created_at DESC)
        """)
    try db.execute(sql: """
        CREATE INDEX IF NOT EXISTS idx_grow_logs_plant_phase
        ON grow_logs(plant_id, phase, created_at DESC)
        """)
    try db.execute(sql: """
        CREATE INDEX IF NOT EXISTS idx_achievements_user
        ON achievements(user_id, achievement_key)
        """)
    try db.execute(sql: """
        CREATE INDEX IF NOT EXISTS idx_grows_user_status
        ON grows(user_id, status)
        """)
    try db.execute(sql: """
        CREATE INDEX IF NOT EXISTS idx_strain_profiles_name
        ON strain_profiles(name)
        """)
    try db.execute(sql: """
        CREATE INDEX IF NOT EXISTS idx_strain_profiles_user
        ON strain_profiles(user_id)
        """)

    // Migrate existing care_logs into grow_logs with action name mapping
    try db.execute(sql: """
        INSERT INTO grow_logs (id, plant_id, user_id, phase, log_type, notes, created_at)
        SELECT id, plant_id, user_id, 'vegetative',
            CASE action
                WHEN 'water' THEN 'watering'
                WHEN 'fertilize' THEN 'feeding'
                WHEN 'prune' THEN 'defoliation'
                WHEN 'repot' THEN 'transplant'
                ELSE 'note'
            END,
            notes, created_at
        FROM care_logs
        """)
}
```

- [ ] **Step 4: Add CRUD methods to AppDatabase.swift**

Add to `ios-app/Plantgotchi/Database/AppDatabase.swift`:

```swift
// MARK: - Grow Queries

func saveGrow(_ grow: Grow) throws {
    try dbQueue.write { db in try grow.save(db) }
}

func getGrow(id: String) throws -> Grow? {
    try dbQueue.read { db in try Grow.fetchOne(db, key: id) }
}

func getGrows(userId: String) throws -> [Grow] {
    try dbQueue.read { db in
        try Grow
            .filter(Grow.Columns.userId == userId)
            .order(Grow.Columns.createdAt.desc)
            .fetchAll(db)
    }
}

func getActiveGrows(userId: String) throws -> [Grow] {
    try dbQueue.read { db in
        try Grow
            .filter(Grow.Columns.userId == userId)
            .filter(Grow.Columns.status == "active")
            .order(Grow.Columns.createdAt.desc)
            .fetchAll(db)
    }
}

// MARK: - Grow Log Queries

func addGrowLog(_ log: GrowLog) throws {
    try dbQueue.write { db in try log.insert(db) }
}

func getGrowLogs(plantId: String, limit: Int = 50) throws -> [GrowLog] {
    try dbQueue.read { db in
        try GrowLog
            .filter(GrowLog.Columns.plantId == plantId)
            .order(GrowLog.Columns.createdAt.desc)
            .limit(limit)
            .fetchAll(db)
    }
}

func getGrowLogs(plantId: String, phase: Phase) throws -> [GrowLog] {
    try dbQueue.read { db in
        try GrowLog
            .filter(GrowLog.Columns.plantId == plantId)
            .filter(GrowLog.Columns.phase == phase.rawValue)
            .order(GrowLog.Columns.createdAt.desc)
            .fetchAll(db)
    }
}

func getGrowLogs(plantId: String, logType: GrowLogType) throws -> [GrowLog] {
    try dbQueue.read { db in
        try GrowLog
            .filter(GrowLog.Columns.plantId == plantId)
            .filter(GrowLog.Columns.logType == logType.rawValue)
            .order(GrowLog.Columns.createdAt.desc)
            .fetchAll(db)
    }
}

// MARK: - Strain Profile Queries

func saveStrainProfile(_ strain: StrainProfile) throws {
    try dbQueue.write { db in try strain.save(db) }
}

func getStrainProfile(id: String) throws -> StrainProfile? {
    try dbQueue.read { db in try StrainProfile.fetchOne(db, key: id) }
}

func searchStrainProfiles(query: String) throws -> [StrainProfile] {
    try dbQueue.read { db in
        try StrainProfile
            .filter(StrainProfile.Columns.name.like("%\(query)%"))
            .order(StrainProfile.Columns.name)
            .fetchAll(db)
    }
}

func getBuiltInStrains() throws -> [StrainProfile] {
    try dbQueue.read { db in
        try StrainProfile
            .filter(StrainProfile.Columns.isCustom == false)
            .order(StrainProfile.Columns.name)
            .fetchAll(db)
    }
}

// MARK: - Achievement Queries

func saveAchievement(_ achievement: Achievement) throws {
    try dbQueue.write { db in try achievement.save(db) }
}

func getAchievements(userId: String) throws -> [Achievement] {
    try dbQueue.read { db in
        try Achievement
            .filter(Achievement.Columns.userId == userId)
            .order(Achievement.Columns.unlockedAt.desc)
            .fetchAll(db)
    }
}

func hasAchievement(userId: String, key: String) throws -> Bool {
    try dbQueue.read { db in
        try Achievement
            .filter(Achievement.Columns.userId == userId)
            .filter(Achievement.Columns.achievementKey == key)
            .fetchCount(db) > 0
    }
}

func getTotalPoints(userId: String) throws -> Int {
    try dbQueue.read { db in
        let row = try Row.fetchOne(db, sql: """
            SELECT COALESCE(SUM(points), 0) as total
            FROM achievements WHERE user_id = ?
            """, arguments: [userId])
        return row?["total"] as? Int ?? 0
    }
}

// MARK: - Phase Transition

func transitionPlantPhase(
    plantId: String,
    userId: String,
    to newPhase: Phase,
    reason: String? = nil,
    notes: String? = nil
) throws {
    try dbQueue.write { db in
        guard var plant = try Plant.fetchOne(db, key: plantId) else { return }
        let oldPhase = plant.currentPhase

        // Log the phase change
        var dataDict: [String: String] = ["to": newPhase.rawValue]
        if let old = oldPhase { dataDict["from"] = old.rawValue }
        if let reason = reason { dataDict["reason"] = reason }
        let jsonData = try JSONSerialization.data(withJSONObject: dataDict)

        let log = GrowLog(
            plantId: plantId,
            userId: userId,
            phase: newPhase,
            logType: .phaseChange,
            data: String(data: jsonData, encoding: .utf8),
            notes: notes
        )
        try log.insert(db)

        // Update plant
        plant.currentPhase = newPhase
        plant.phaseStartedAt = ISO8601DateFormatter().string(from: Date())
        try plant.update(db)
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd ios-app && swift test --filter DatabaseTests 2>&1 | tail -10`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add ios-app/Plantgotchi/Database/Schema.swift ios-app/Plantgotchi/Database/AppDatabase.swift \
        ios-app/PlantgotchiTests/DatabaseTests.swift
git commit -m "feat: add v2 schema migration and CRUD for grows, grow_logs, strains, achievements"
```

---

## Chunk 2: Phase-Aware Rule Engine

### Task 5: Phase-Aware Rule Engine

**Files:**
- Modify: `ios-app/Plantgotchi/Agents/RuleEngine.swift`
- Create: `ios-app/PlantgotchiTests/PhaseAwareRuleEngineTests.swift`
- Modify: `ios-app/PlantgotchiTests/RuleEngineTests.swift` (update helper)

- [ ] **Step 1: Write failing tests for phase-aware rules**

```swift
// ios-app/PlantgotchiTests/PhaseAwareRuleEngineTests.swift
import XCTest
@testable import Plantgotchi

final class PhaseAwareRuleEngineTests: XCTestCase {

    private func makePlant(
        phase: Phase = .vegetative,
        plantType: PlantType = .photo,
        phaseStartedAt: String? = nil
    ) -> Plant {
        Plant(
            id: "plant-1", userId: "user-1", name: "Test Plant",
            moistureMin: 35, moistureMax: 65,
            tempMin: 20.0, tempMax: 28.0,
            lightPreference: "high",
            plantType: plantType,
            strainName: "Northern Lights",
            strainType: .indica,
            environment: .indoor,
            currentPhase: phase,
            phaseStartedAt: phaseStartedAt
        )
    }

    private func makeReading(
        moisture: Int? = nil,
        temperature: Double? = nil,
        light: Int? = nil,
        battery: Int? = nil
    ) -> SensorReading {
        SensorReading(
            plantId: "plant-1", sensorId: "sensor-A",
            moisture: moisture, temperature: temperature,
            light: light, battery: battery
        )
    }

    // Phase-specific threshold tests

    func testSeedling_lowHumidity_warning() {
        // Seedling phase wants 65-70% RH — we simulate via temp thresholds
        // that are phase-specific
        let plant = makePlant(phase: .seedling)
        let reading = makeReading(temperature: 18.0) // below seedling min of 22°C
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertTrue(recs.contains { $0.message.contains("cold") || $0.message.contains("Cool") })
    }

    func testFlowering_usesFloweringThresholds() {
        let plant = makePlant(phase: .flowering)
        // Flowering max is 27°C (phase default), not 28°C (plant-level)
        let reading = makeReading(temperature: 27.5)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertTrue(recs.contains { $0.message.contains("hot") || $0.message.contains("Hot") })
    }

    func testCompletedPhase_noSensorAlerts() {
        let plant = makePlant(phase: .complete)
        let reading = makeReading(moisture: 5, temperature: 50.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        // Complete phase skips sensor checks
        XCTAssertTrue(recs.isEmpty)
    }

    func testProcessingPhase_noSensorAlerts() {
        let plant = makePlant(phase: .processing)
        let reading = makeReading(moisture: 5, temperature: 50.0)
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertTrue(recs.isEmpty)
    }

    func testNilPhase_usesPlantLevelThresholds() {
        // Backward compat: plants without a phase use existing thresholds
        var plant = makePlant()
        plant.currentPhase = nil
        let reading = makeReading(moisture: 25) // below 35 min
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertTrue(recs.contains { $0.message.contains("water") })
    }

    // Transition suggestions

    func testVegTransitionSuggestion_after6Weeks() {
        let sixWeeksAgo = ISO8601DateFormatter().string(
            from: Date().addingTimeInterval(-6 * 7 * 24 * 3600)
        )
        let plant = makePlant(phase: .vegetative, plantType: .photo, phaseStartedAt: sixWeeksAgo)
        let reading = makeReading(moisture: 50, temperature: 24.0) // all OK
        let recs = RuleEngine.evaluatePlant(plant: plant, reading: reading)
        XCTAssertTrue(recs.contains { $0.message.contains("flip") || $0.message.contains("flower") })
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ios-app && swift test --filter PhaseAwareRuleEngineTests 2>&1 | head -20`
Expected: Tests fail — RuleEngine doesn't handle phase logic yet

- [ ] **Step 3: Update RuleEngine to be phase-aware**

Replace the `evaluatePlant` method in `ios-app/Plantgotchi/Agents/RuleEngine.swift` and add phase-aware logic. Keep the existing method signature but make it phase-aware internally:

```swift
// Add at top of RuleEngine enum, replacing the existing evaluatePlant:

/// Resolve effective thresholds: phase defaults > strain overrides > plant-level
static func resolveThresholds(plant: Plant) -> (tempMin: Double, tempMax: Double, moistureMin: Int, moistureMax: Int) {
    // If plant has a phase with monitoring, use phase defaults
    if let phase = plant.currentPhase, phase.hasMonitoring {
        let defaults = phase.defaults

        // Check for late flower sub-range
        let effectiveDefaults: PhaseDefaults
        if phase == .flowering, let startedAt = plant.phaseStartedAt,
           let startDate = ISO8601DateFormatter().date(from: startedAt) {
            let weeksInPhase = Calendar.current.dateComponents([.weekOfYear], from: startDate, to: Date()).weekOfYear ?? 0
            effectiveDefaults = weeksInPhase >= 6 ? phase.lateFlowerDefaults : defaults
        } else {
            effectiveDefaults = defaults
        }

        return (
            tempMin: effectiveDefaults.tempMinC ?? plant.tempMin,
            tempMax: effectiveDefaults.tempMaxC ?? plant.tempMax,
            moistureMin: plant.moistureMin,
            moistureMax: plant.moistureMax
        )
    }

    // Fallback: use plant-level thresholds (backward compat)
    return (plant.tempMin, plant.tempMax, plant.moistureMin, plant.moistureMax)
}

/// Evaluate a plant against a sensor reading and return recommendations.
static func evaluatePlant(
    plant: Plant,
    reading: SensorReading
) -> [Recommendation] {
    // Skip sensor checks for non-monitored phases
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
            message: "\(plant.name) may be overwatered — moisture at \(moisture)% (maximum: \(thresholds.moistureMax)%)",
            severity: "warning"
        ))
    }

    // Temperature too low
    if let temp = reading.temperature, temp < thresholds.tempMin {
        recs.append(Recommendation(
            plantId: plant.id,
            source: "rules",
            message: "Too cold for \(plant.name)! Temperature at \(temp)°C (minimum: \(thresholds.tempMin)°C)",
            severity: temp < thresholds.tempMin - 5 ? "urgent" : "warning"
        ))
    }

    // Temperature too high
    if let temp = reading.temperature, temp > thresholds.tempMax {
        recs.append(Recommendation(
            plantId: plant.id,
            source: "rules",
            message: "Too hot for \(plant.name)! Temperature at \(temp)°C (maximum: \(thresholds.tempMax)°C)",
            severity: temp > thresholds.tempMax + 5 ? "urgent" : "warning"
        ))
    }

    // Low battery (phase-independent)
    if let battery = reading.battery, battery < 15 {
        recs.append(Recommendation(
            plantId: plant.id,
            source: "rules",
            message: "Sensor battery low for \(plant.name) (\(battery)%) — charge soon",
            severity: battery < 5 ? "urgent" : "warning"
        ))
    }

    // High-light plant in low light (growing phases only)
    if let phase = plant.currentPhase, phase.isGrowing,
       let light = reading.light, plant.lightPreference == "high", light < 1000 {
        recs.append(Recommendation(
            plantId: plant.id,
            source: "rules",
            message: "\(plant.name) prefers bright light but only getting \(light) lux — consider moving to a sunnier spot",
            severity: "info"
        ))
    } else if plant.currentPhase == nil,
              let light = reading.light, plant.lightPreference == "high", light < 1000 {
        // Backward compat for plants without phase
        recs.append(Recommendation(
            plantId: plant.id,
            source: "rules",
            message: "\(plant.name) prefers bright light but only getting \(light) lux — consider moving to a sunnier spot",
            severity: "info"
        ))
    }

    // Phase-specific transition suggestions
    recs.append(contentsOf: transitionSuggestions(plant: plant))

    return recs
}

/// Transition a plant from Flowering to Drying (harvest), logging both
/// a phase_change and a harvest entry with wet weight.
static func harvestPlant(
    plantId: String,
    userId: String,
    wetWeightG: Double?,
    notes: String?,
    db: AppDatabase
) throws {
    try db.dbQueue.write { dbConn in
        guard var plant = try Plant.fetchOne(dbConn, key: plantId) else { return }

        // Phase change log
        let phaseData = try JSONSerialization.data(withJSONObject: [
            "from": Phase.flowering.rawValue,
            "to": Phase.drying.rawValue,
            "reason": "harvest",
        ])
        let phaseLog = GrowLog(
            plantId: plantId, userId: userId, phase: .drying,
            logType: .phaseChange,
            data: String(data: phaseData, encoding: .utf8),
            notes: notes
        )
        try phaseLog.insert(dbConn)

        // Harvest log with wet weight
        if let weight = wetWeightG {
            let harvestData = try JSONSerialization.data(withJSONObject: ["wet_weight_g": weight])
            let harvestLog = GrowLog(
                plantId: plantId, userId: userId, phase: .drying,
                logType: .harvest,
                data: String(data: harvestData, encoding: .utf8)
            )
            try harvestLog.insert(dbConn)
        }

        // Update plant phase
        plant.currentPhase = .drying
        plant.phaseStartedAt = ISO8601DateFormatter().string(from: Date())
        try plant.update(dbConn)
    }
}

/// Generate transition suggestions based on time in current phase.
static func transitionSuggestions(plant: Plant) -> [Recommendation] {
    guard let phase = plant.currentPhase,
          let startedStr = plant.phaseStartedAt,
          let startDate = ISO8601DateFormatter().date(from: startedStr) else {
        return []
    }

    let daysInPhase = Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 0

    switch phase {
    case .vegetative where plant.plantType == .photo && daysInPhase >= 42:
        return [Recommendation(
            plantId: plant.id,
            source: "rules",
            message: "You've been in veg for \(daysInPhase / 7) weeks — ready to flip to flower?",
            severity: "info"
        )]
    case .vegetative where plant.plantType == .auto && daysInPhase >= 21:
        return [Recommendation(
            plantId: plant.id,
            source: "rules",
            message: "Your auto is at day \(daysInPhase) — most autos start showing flowers around now. Watch for pistils.",
            severity: "info"
        )]
    case .drying where daysInPhase >= 7:
        return [Recommendation(
            plantId: plant.id,
            source: "rules",
            message: "Day \(daysInPhase) of drying — check if small stems snap cleanly. If so, time to jar up for curing.",
            severity: "info"
        )]
    default:
        return []
    }
}
```

- [ ] **Step 4: Update existing RuleEngineTests.swift helper**

Update the `makePlant` helper in `ios-app/PlantgotchiTests/RuleEngineTests.swift` to not set a phase (backward compat path):

The existing tests should still pass without changes since `makePlant` creates plants without `currentPhase` (nil), which falls back to plant-level thresholds.

- [ ] **Step 5: Run all rule engine tests**

Run: `cd ios-app && swift test --filter "RuleEngine" 2>&1 | tail -10`
Expected: Both `RuleEngineTests` and `PhaseAwareRuleEngineTests` pass

- [ ] **Step 6: Commit**

```bash
git add ios-app/Plantgotchi/Agents/RuleEngine.swift \
        ios-app/PlantgotchiTests/PhaseAwareRuleEngineTests.swift
git commit -m "feat: make RuleEngine phase-aware with transition suggestions"
```

---

## Chunk 3: Updated AddPlantView (Multi-Step Flow)

### Task 6: AddPlantView — Multi-Step Cannabis Flow

**Files:**
- Modify: `ios-app/Plantgotchi/Views/AddPlantView.swift`
- Create: `ios-app/Plantgotchi/Views/StrainPickerView.swift`

- [ ] **Step 1: Create StrainPickerView**

```swift
// ios-app/Plantgotchi/Views/StrainPickerView.swift
#if os(iOS)
import SwiftUI

/// Search and select a strain profile, or create a custom one.
struct StrainPickerView: View {
    @Binding var selectedStrain: StrainProfile?
    @Binding var customStrainName: String
    @Binding var strainType: StrainType?
    @Environment(\.dismiss) private var dismiss

    @State private var searchText = ""
    @State private var results: [StrainProfile] = []
    @State private var showCreateCustom = false

    var body: some View {
        NavigationStack {
            List {
                if !searchText.isEmpty {
                    Section {
                        ForEach(results) { strain in
                            Button(action: { select(strain) }) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(strain.name)
                                            .font(PlantgotchiTheme.bodyFont.weight(.medium))
                                            .foregroundColor(PlantgotchiTheme.text)
                                        if let type = strain.type {
                                            Text(type.rawValue.capitalized)
                                                .font(PlantgotchiTheme.captionFont)
                                                .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
                                        }
                                    }
                                    Spacer()
                                    if let weeks = strain.flowerWeeksMin, let max = strain.flowerWeeksMax {
                                        Text("\(weeks)-\(max)w flower")
                                            .font(.caption2)
                                            .foregroundColor(PlantgotchiTheme.green)
                                    }
                                }
                            }
                        }
                    }
                }

                Section {
                    Button(action: { showCreateCustom = true }) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(PlantgotchiTheme.green)
                            Text("Custom Strain")
                                .foregroundColor(PlantgotchiTheme.text)
                        }
                    }
                }
            }
            .searchable(text: $searchText, prompt: "Search strains...")
            .onChange(of: searchText) { _, query in
                search(query)
            }
            .navigationTitle("Select Strain")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .sheet(isPresented: $showCreateCustom) {
                createCustomSheet
            }
            .onAppear { search("") }
        }
    }

    private func select(_ strain: StrainProfile) {
        selectedStrain = strain
        customStrainName = strain.name
        strainType = strain.type
        dismiss()
    }

    private func search(_ query: String) {
        do {
            if query.isEmpty {
                results = try AppDatabase.shared.getBuiltInStrains()
            } else {
                results = try AppDatabase.shared.searchStrainProfiles(query: query)
            }
        } catch {
            results = []
        }
    }

    private var createCustomSheet: some View {
        NavigationStack {
            Form {
                TextField("Strain Name", text: $customStrainName)

                Picker("Type", selection: $strainType) {
                    Text("Unknown").tag(StrainType?.none)
                    Text("Indica").tag(StrainType?.some(.indica))
                    Text("Sativa").tag(StrainType?.some(.sativa))
                    Text("Hybrid").tag(StrainType?.some(.hybrid))
                }
            }
            .navigationTitle("Custom Strain")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        // Save custom strain to DB
                        let custom = StrainProfile(
                            name: customStrainName,
                            type: strainType,
                            isCustom: true,
                            userId: UserDefaults.standard.string(forKey: "userId") ?? "default-user"
                        )
                        try? AppDatabase.shared.saveStrainProfile(custom)
                        selectedStrain = custom
                        showCreateCustom = false
                        dismiss()
                    }
                    .disabled(customStrainName.isEmpty)
                }
            }
        }
    }
}
#endif
```

- [ ] **Step 2: Update AddPlantView with multi-step flow**

Replace the content of `ios-app/Plantgotchi/Views/AddPlantView.swift` with a step-based flow. The key changes:

1. Add step tracking: `@State private var step = 0` (0=basics, 1=type, 2=environment, 3=thresholds)
2. Step 0: name, emoji picker, strain picker button
3. Step 1: photo vs auto toggle
4. Step 2: indoor vs outdoor toggle
5. Step 3: moisture/temp thresholds (pre-filled from strain if selected)
6. On save: set `currentPhase = .germination`, `phaseStartedAt = now`, and include all new fields in the API payload

The full implementation should preserve the existing save mechanism (API call) but add the new fields to the request body:

```swift
let body: [String: Any] = [
    "name": trimmedName,
    "species": species.isEmpty ? NSNull() : species,
    "emoji": selectedEmoji,
    "light_preference": lightPreference,
    "moisture_min": Int(moistureMin),
    "moisture_max": Int(moistureMax),
    "temp_min": Int(tempMin),
    "temp_max": Int(tempMax),
    "plant_type": plantType.rawValue,
    "strain_name": strainName.isEmpty ? NSNull() : strainName,
    "strain_type": strainType?.rawValue ?? NSNull(),
    "strain_id": selectedStrain?.id ?? NSNull(),
    "environment": environment.rawValue,
    "current_phase": Phase.germination.rawValue,
    "phase_started_at": ISO8601DateFormatter().string(from: Date()),
]
```

- [ ] **Step 3: Commit**

```bash
git add ios-app/Plantgotchi/Views/AddPlantView.swift ios-app/Plantgotchi/Views/StrainPickerView.swift
git commit -m "feat: multi-step AddPlantView with strain picker, type, environment"
```

---

## Chunk 4: Plant Detail — Phase Banner, Journal, Quick Actions

### Task 7: Phase Banner and Phase Timeline on PlantDetailView

**Files:**
- Modify: `ios-app/Plantgotchi/Views/PlantDetailView.swift`

- [ ] **Step 1: Add phase banner section to PlantDetailView**

Add a new section between the header and readings sections that shows:
- Current phase name and icon
- Days in phase (calculated from `phaseStartedAt`)
- "Advance Phase" button that opens PhaseTransitionView
- Phase timeline bar showing all phases the plant has been through

```swift
// Add to PlantDetailView body, after headerSection:
if let plant = plant, plant.currentPhase != nil {
    phaseBannerSection(plant: plant)
}
```

```swift
private func phaseBannerSection(plant: Plant) -> some View {
    VStack(alignment: .leading, spacing: 12) {
        HStack {
            Text(plant.currentPhase?.rawValue.capitalized ?? "")
                .font(PlantgotchiTheme.pixelFont(size: 12))
                .foregroundColor(PlantgotchiTheme.green)

            Spacer()

            if let started = plant.phaseStartedAt,
               let date = ISO8601DateFormatter().date(from: started) {
                let days = Calendar.current.dateComponents([.day], from: date, to: Date()).day ?? 0
                Text("Day \(days)")
                    .font(PlantgotchiTheme.captionFont)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
            }
        }

        // Phase timeline bar
        phaseTimelineBar(current: plant.currentPhase ?? .germination)

        if let next = plant.currentPhase?.next {
            Button(action: { showPhaseTransition = true }) {
                HStack {
                    Image(systemName: "arrow.right.circle.fill")
                    Text("Advance to \(next.rawValue.capitalized)")
                }
                .font(PlantgotchiTheme.captionFont.weight(.medium))
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(PlantgotchiTheme.green)
                .cornerRadius(8)
            }
        }
    }
    .plantgotchiCard()
}

private func phaseTimelineBar(current: Phase) -> some View {
    let allPhases = Phase.allCases
    let currentIdx = allPhases.firstIndex(of: current) ?? 0
    return HStack(spacing: 2) {
        ForEach(Array(allPhases.enumerated()), id: \.element) { idx, phase in
            RoundedRectangle(cornerRadius: 2)
                .fill(idx == currentIdx
                    ? PlantgotchiTheme.green
                    : idx < currentIdx
                        ? PlantgotchiTheme.green.opacity(0.3)
                        : PlantgotchiTheme.text.opacity(0.1))
                .frame(height: 6)
        }
    }
}
```

Add state: `@State private var showPhaseTransition = false`

- [ ] **Step 2: Add phase badge to PlantCardView**

In `ios-app/Plantgotchi/Views/PlantCardView.swift`, add a phase badge below the status badge:

```swift
// After StatusBadge in the HStack:
if let phaseName = plantView.phase {
    Text(phaseName.capitalized)
        .font(.system(size: 8, weight: .medium, design: .rounded))
        .foregroundColor(PlantgotchiTheme.green)
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(PlantgotchiTheme.green.opacity(0.1))
        .cornerRadius(4)
}
```

This requires adding a `phase: String?` field to `PlantView` and updating `toPlantView()` in `RuleEngine.swift`:

In `PlantView` struct (RuleEngine.swift), add after `hp`:
```swift
let phase: String?
```

In `toPlantView()`, add to the return:
```swift
phase: plant.currentPhase?.rawValue
```

Update all existing call sites and the `#Preview` in `PlantCardView.swift` to include `phase: nil`.

- [ ] **Step 3: Commit**

```bash
git add ios-app/Plantgotchi/Views/PlantDetailView.swift ios-app/Plantgotchi/Views/PlantCardView.swift \
        ios-app/Plantgotchi/Agents/RuleEngine.swift
git commit -m "feat: add phase banner, timeline bar, and phase badge on plant cards"
```

---

### Task 8: PhaseTransitionView

**Files:**
- Create: `ios-app/Plantgotchi/Views/PhaseTransitionView.swift`

- [ ] **Step 1: Create PhaseTransitionView**

```swift
// ios-app/Plantgotchi/Views/PhaseTransitionView.swift
#if os(iOS)
import SwiftUI

/// Confirm a phase transition with optional notes and photo.
struct PhaseTransitionView: View {
    let plant: Plant
    let targetPhase: Phase
    var onComplete: (() -> Void)?

    @Environment(\.dismiss) private var dismiss
    @State private var notes = ""
    @State private var showError = false
    @State private var errorMessage = ""

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Phase change visualization
                    HStack(spacing: 16) {
                        VStack {
                            Text(plant.currentPhase?.rawValue.capitalized ?? "—")
                                .font(PlantgotchiTheme.pixelFont(size: 10))
                                .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
                            Text("Current")
                                .font(.caption2)
                                .foregroundColor(PlantgotchiTheme.text.opacity(0.4))
                        }

                        Image(systemName: "arrow.right")
                            .foregroundColor(PlantgotchiTheme.green)

                        VStack {
                            Text(targetPhase.rawValue.capitalized)
                                .font(PlantgotchiTheme.pixelFont(size: 10))
                                .foregroundColor(PlantgotchiTheme.green)
                            Text("Next")
                                .font(.caption2)
                                .foregroundColor(PlantgotchiTheme.green.opacity(0.6))
                        }
                    }
                    .padding()
                    .plantgotchiCard()

                    // Phase info
                    if let defaults = targetPhase.defaults.tempMinC {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Recommended for \(targetPhase.rawValue.capitalized)")
                                .font(PlantgotchiTheme.pixelFont(size: 9))
                                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

                            if let min = targetPhase.defaults.tempMinC,
                               let max = targetPhase.defaults.tempMaxC {
                                HStack {
                                    Image(systemName: "thermometer.medium")
                                    Text("\(Int(min))–\(Int(max))°C")
                                }
                                .font(PlantgotchiTheme.captionFont)
                            }

                            if let schedule = targetPhase.defaults.lightSchedule {
                                HStack {
                                    Image(systemName: "sun.max.fill")
                                    Text("Light: \(schedule)")
                                }
                                .font(PlantgotchiTheme.captionFont)
                            }
                        }
                        .plantgotchiCard()
                    }

                    // Notes
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Notes (optional)")
                            .font(PlantgotchiTheme.pixelFont(size: 9))
                            .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                        TextEditor(text: $notes)
                            .frame(minHeight: 80)
                            .font(PlantgotchiTheme.bodyFont)
                            .padding(8)
                            .background(PlantgotchiTheme.cream)
                            .cornerRadius(8)
                    }
                    .plantgotchiCard()
                }
                .padding()
            }
            .background(PlantgotchiTheme.background.ignoresSafeArea())
            .navigationTitle("Advance Phase")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Confirm") { confirmTransition() }
                        .font(.body.weight(.semibold))
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK") {}
            } message: {
                Text(errorMessage)
            }
        }
    }

    private func confirmTransition() {
        do {
            try AppDatabase.shared.transitionPlantPhase(
                plantId: plant.id,
                userId: userId,
                to: targetPhase,
                notes: notes.isEmpty ? nil : notes
            )
            Analytics.track("phase_transitioned", properties: [
                "plant_id": plant.id,
                "from": plant.currentPhase?.rawValue ?? "none",
                "to": targetPhase.rawValue,
            ])
            onComplete?()
            dismiss()
        } catch {
            errorMessage = "Failed to advance phase: \(error.localizedDescription)"
            showError = true
        }
    }
}
#endif
```

- [ ] **Step 2: Wire PhaseTransitionView into PlantDetailView**

Add `.sheet(isPresented: $showPhaseTransition)` to PlantDetailView:

```swift
.sheet(isPresented: $showPhaseTransition) {
    if let plant = plant, let next = plant.currentPhase?.next {
        PhaseTransitionView(plant: plant, targetPhase: next) {
            Task { await loadData() }
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add ios-app/Plantgotchi/Views/PhaseTransitionView.swift ios-app/Plantgotchi/Views/PlantDetailView.swift
git commit -m "feat: add PhaseTransitionView for confirming phase advances"
```

---

### Task 9: GrowLogView and QuickLogView

**Files:**
- Create: `ios-app/Plantgotchi/Views/GrowLogView.swift`
- Create: `ios-app/Plantgotchi/Views/QuickLogView.swift`
- Create: `ios-app/Plantgotchi/Views/AddMeasurementView.swift`
- Modify: `ios-app/Plantgotchi/Views/PlantDetailView.swift`

- [ ] **Step 1: Create GrowLogView (journal timeline)**

```swift
// ios-app/Plantgotchi/Views/GrowLogView.swift
#if os(iOS)
import SwiftUI

/// Timeline journal view for a plant's grow logs.
struct GrowLogView: View {
    let plantId: String
    @State private var logs: [GrowLog] = []
    @State private var filterType: GrowLogType? = nil
    @State private var filterPhase: Phase? = nil

    var body: some View {
        VStack(spacing: 0) {
            // Filter chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(label: "All", isActive: filterType == nil && filterPhase == nil) {
                        filterType = nil; filterPhase = nil; reload()
                    }
                    ForEach(Phase.allCases, id: \.self) { phase in
                        FilterChip(label: phase.rawValue.capitalized, isActive: filterPhase == phase) {
                            filterPhase = phase; filterType = nil; reload()
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
            }

            if logs.isEmpty {
                Spacer()
                Text("No journal entries yet")
                    .font(PlantgotchiTheme.bodyFont)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.5))
                Spacer()
            } else {
                List(logs) { log in
                    GrowLogRow(log: log)
                }
                .listStyle(.plain)
            }
        }
        .onAppear { reload() }
    }

    private func reload() {
        do {
            if let phase = filterPhase {
                logs = try AppDatabase.shared.getGrowLogs(plantId: plantId, phase: phase)
            } else if let type = filterType {
                logs = try AppDatabase.shared.getGrowLogs(plantId: plantId, logType: type)
            } else {
                logs = try AppDatabase.shared.getGrowLogs(plantId: plantId)
            }
        } catch {
            logs = []
        }
    }
}

struct GrowLogRow: View {
    let log: GrowLog

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: log.logType.iconName)
                .foregroundColor(PlantgotchiTheme.green)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(log.logType.label)
                        .font(PlantgotchiTheme.bodyFont.weight(.medium))
                        .foregroundColor(PlantgotchiTheme.text)

                    Text(log.phase.rawValue.capitalized)
                        .font(.system(size: 8, weight: .medium))
                        .foregroundColor(PlantgotchiTheme.green)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(PlantgotchiTheme.green.opacity(0.1))
                        .cornerRadius(3)
                }

                if let notes = log.notes, !notes.isEmpty {
                    Text(notes)
                        .font(PlantgotchiTheme.captionFont)
                        .foregroundColor(PlantgotchiTheme.text.opacity(0.6))
                }
            }

            Spacer()

            if let date = log.createdAt {
                Text(formatDate(date))
                    .font(.caption2)
                    .foregroundColor(PlantgotchiTheme.text.opacity(0.4))
            }
        }
        .padding(.vertical, 4)
    }

    private func formatDate(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: iso) {
            let relative = RelativeDateTimeFormatter()
            relative.unitsStyle = .short
            return relative.localizedString(for: date, relativeTo: Date())
        }
        return String(iso.prefix(10))
    }
}

struct FilterChip: View {
    let label: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.caption.weight(isActive ? .semibold : .regular))
                .foregroundColor(isActive ? .white : PlantgotchiTheme.text)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(isActive ? PlantgotchiTheme.green : PlantgotchiTheme.text.opacity(0.08))
                .cornerRadius(12)
        }
    }
}
#endif
```

- [ ] **Step 2: Create QuickLogView (phase-aware actions)**

```swift
// ios-app/Plantgotchi/Views/QuickLogView.swift
#if os(iOS)
import SwiftUI

/// Quick-log action buttons, filtered to current phase.
struct QuickLogView: View {
    let plant: Plant
    var onLog: (() -> Void)?

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"
    @State private var showMeasurement = false

    var body: some View {
        let actions = plant.currentPhase?.availableActions ?? [.watering, .feeding, .note, .photo]
        let displayActions = actions.sorted { $0.rawValue < $1.rawValue }
            .filter { $0 != .phaseChange && $0 != .measurement }

        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Log")
                .font(PlantgotchiTheme.pixelFont(size: 9))
                .foregroundColor(PlantgotchiTheme.text.opacity(0.5))

            LazyVGrid(columns: [
                GridItem(.flexible()), GridItem(.flexible()),
                GridItem(.flexible()), GridItem(.flexible())
            ], spacing: 8) {
                ForEach(displayActions, id: \.rawValue) { action in
                    ActionButton(
                        icon: action.iconName,
                        label: action.label,
                        color: PlantgotchiTheme.green
                    ) {
                        logAction(action)
                    }
                }

                if actions.contains(.measurement) {
                    ActionButton(
                        icon: GrowLogType.measurement.iconName,
                        label: "Measure",
                        color: PlantgotchiTheme.blue
                    ) {
                        showMeasurement = true
                    }
                }
            }
        }
        .plantgotchiCard()
        .sheet(isPresented: $showMeasurement) {
            AddMeasurementView(plant: plant, onSave: onLog)
        }
    }

    private func logAction(_ action: GrowLogType) {
        guard let phase = plant.currentPhase else { return }
        let log = GrowLog(
            plantId: plant.id,
            userId: userId,
            phase: phase,
            logType: action
        )
        do {
            try AppDatabase.shared.addGrowLog(log)
            Analytics.track("grow_logged", properties: [
                "plant_id": plant.id,
                "action": action.rawValue,
                "phase": phase.rawValue,
            ])
            onLog?()
        } catch {
            print("[QuickLogView] Failed to log: \(error)")
        }
    }
}
#endif
```

- [ ] **Step 3: Create AddMeasurementView**

```swift
// ios-app/Plantgotchi/Views/AddMeasurementView.swift
#if os(iOS)
import SwiftUI

/// Log a measurement (height, pH, weight, etc.)
struct AddMeasurementView: View {
    let plant: Plant
    var onSave: (() -> Void)?

    @Environment(\.dismiss) private var dismiss
    @State private var measurementType = "height"
    @State private var value = ""
    @State private var unit = "in"

    private let userId = UserDefaults.standard.string(forKey: "userId") ?? "default-user"

    private let types = [
        ("height", "Height", ["in", "cm"]),
        ("ph", "pH", [""]),
        ("ec", "EC/PPM", ["ppm", "ec"]),
        ("weight", "Weight", ["g", "oz"]),
    ]

    var body: some View {
        NavigationStack {
            Form {
                Picker("Type", selection: $measurementType) {
                    ForEach(types, id: \.0) { t in
                        Text(t.1).tag(t.0)
                    }
                }
                .onChange(of: measurementType) { _, newType in
                    unit = types.first { $0.0 == newType }?.2.first ?? ""
                }

                TextField("Value", text: $value)
                    .keyboardType(.decimalPad)

                if let currentType = types.first(where: { $0.0 == measurementType }),
                   currentType.2.count > 1 {
                    Picker("Unit", selection: $unit) {
                        ForEach(currentType.2, id: \.self) { u in
                            Text(u).tag(u)
                        }
                    }
                }
            }
            .navigationTitle("Add Measurement")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { save() }
                        .disabled(value.isEmpty)
                }
            }
        }
    }

    private func save() {
        guard let phase = plant.currentPhase,
              let numValue = Double(value) else { return }

        var dataDict: [String: Any] = [
            "type": measurementType,
            "value": numValue,
        ]
        if !unit.isEmpty { dataDict["unit"] = unit }

        let jsonData = (try? JSONSerialization.data(withJSONObject: dataDict))
            .flatMap { String(data: $0, encoding: .utf8) }

        let log = GrowLog(
            plantId: plant.id,
            userId: userId,
            phase: phase,
            logType: .measurement,
            data: jsonData
        )

        do {
            try AppDatabase.shared.addGrowLog(log)
            onSave?()
            dismiss()
        } catch {
            print("[AddMeasurementView] Failed: \(error)")
        }
    }
}
#endif
```

- [ ] **Step 4: Wire journal and quick actions into PlantDetailView**

Replace the existing `actionsSection` and `careLogSection` in `PlantDetailView` with the new components:

```swift
// Replace actionsSection call with:
if let plant = plant, plant.currentPhase != nil {
    QuickLogView(plant: plant) {
        Task { await loadData() }
    }
} else {
    actionsSection(plant: plant) // backward compat for non-lifecycle plants
}

// Add journal tab after recommendations:
if let plant = plant, plant.currentPhase != nil {
    GrowLogView(plantId: plant.id)
        .frame(minHeight: 300)
}
```

- [ ] **Step 5: Commit**

```bash
git add ios-app/Plantgotchi/Views/GrowLogView.swift ios-app/Plantgotchi/Views/QuickLogView.swift \
        ios-app/Plantgotchi/Views/AddMeasurementView.swift ios-app/Plantgotchi/Views/PlantDetailView.swift
git commit -m "feat: add grow journal, phase-aware quick actions, and measurement logging"
```

---

## Chunk 5: Built-In Strain Data and Demo Data

### Task 10: Seed Built-In Strain Profiles

**Files:**
- Modify: `ios-app/Plantgotchi/Database/AppDatabase.swift`

- [ ] **Step 1: Add built-in strain seeding method**

Add to AppDatabase:

```swift
/// Seed built-in strain profiles if the table is empty.
func seedBuiltInStrains() throws {
    try dbQueue.write { db in
        let count = try StrainProfile.fetchCount(db)
        guard count == 0 else { return }

        let strains: [StrainProfile] = [
            StrainProfile(name: "Northern Lights", type: .indica, flowerWeeksMin: 7, flowerWeeksMax: 9, difficulty: "beginner"),
            StrainProfile(name: "Blue Dream", type: .hybrid, flowerWeeksMin: 9, flowerWeeksMax: 10, difficulty: "intermediate"),
            StrainProfile(name: "OG Kush", type: .hybrid, flowerWeeksMin: 8, flowerWeeksMax: 9, difficulty: "intermediate"),
            StrainProfile(name: "Gorilla Glue", type: .hybrid, flowerWeeksMin: 8, flowerWeeksMax: 9, difficulty: "intermediate"),
            StrainProfile(name: "Sour Diesel", type: .sativa, flowerWeeksMin: 10, flowerWeeksMax: 11, difficulty: "advanced"),
            StrainProfile(name: "Girl Scout Cookies", type: .hybrid, flowerWeeksMin: 9, flowerWeeksMax: 10, difficulty: "intermediate"),
            StrainProfile(name: "White Widow", type: .hybrid, flowerWeeksMin: 8, flowerWeeksMax: 9, difficulty: "beginner"),
            StrainProfile(name: "AK-47", type: .hybrid, flowerWeeksMin: 8, flowerWeeksMax: 9, difficulty: "beginner"),
            StrainProfile(name: "Jack Herer", type: .sativa, flowerWeeksMin: 10, flowerWeeksMax: 12, difficulty: "intermediate"),
            StrainProfile(name: "Granddaddy Purple", type: .indica, flowerWeeksMin: 8, flowerWeeksMax: 11, difficulty: "intermediate"),
            StrainProfile(name: "Amnesia Haze", type: .sativa, flowerWeeksMin: 10, flowerWeeksMax: 12, difficulty: "advanced"),
            StrainProfile(name: "Cheese", type: .indica, flowerWeeksMin: 7, flowerWeeksMax: 8, difficulty: "beginner"),
            StrainProfile(name: "Gelato", type: .hybrid, flowerWeeksMin: 8, flowerWeeksMax: 9, difficulty: "intermediate"),
            StrainProfile(name: "Wedding Cake", type: .hybrid, flowerWeeksMin: 7, flowerWeeksMax: 9, difficulty: "intermediate"),
            StrainProfile(name: "Zkittlez", type: .indica, flowerWeeksMin: 8, flowerWeeksMax: 10, difficulty: "intermediate"),
        ]

        for strain in strains {
            try strain.insert(db)
        }
    }
}
```

- [ ] **Step 2: Call seedBuiltInStrains from migration or app startup**

In `AppDatabase.init`, after `migrate()`:

```swift
try seedBuiltInStrains()
```

- [ ] **Step 3: Update demo data to include lifecycle fields**

Update the existing `loadDemoData` method to set `currentPhase`, `plantType`, `strainType`, `environment`, and `phaseStartedAt` on the demo plants, and create corresponding `GrowLog` entries.

- [ ] **Step 4: Commit**

```bash
git add ios-app/Plantgotchi/Database/AppDatabase.swift
git commit -m "feat: seed built-in strain profiles and update demo data with lifecycle fields"
```

---

## Chunk 6: Remaining Views (Grows, Achievements)

### Task 11: GrowView, AchievementsView

**Files:**
- Create: `ios-app/Plantgotchi/Views/GrowView.swift`
- Create: `ios-app/Plantgotchi/Views/AchievementsView.swift`

- [ ] **Step 1: Create GrowView**

Simple view to create and list grows, and assign plants to them. Shows active grows with their plants. Uses `AppDatabase.getActiveGrows()` and `getPlants()` filtered by growId.

- [ ] **Step 2: Create AchievementsView**

Simple list view showing unlocked achievements and total points. Pull from `AppDatabase.getAchievements()` and `getTotalPoints()`.

- [ ] **Step 3: Wire into GardenView**

Add navigation links to GrowView and AchievementsView from the garden screen toolbar or settings.

- [ ] **Step 4: Commit**

```bash
git add ios-app/Plantgotchi/Views/GrowView.swift ios-app/Plantgotchi/Views/AchievementsView.swift
git commit -m "feat: add GrowView and AchievementsView"
```

---

### Task 12: Achievement Unlock Logic

**Files:**
- Create: `ios-app/Plantgotchi/Agents/AchievementEngine.swift`
- Create: `ios-app/PlantgotchiTests/AchievementTests.swift`

- [ ] **Step 1: Write failing tests for achievement unlocks**

```swift
// ios-app/PlantgotchiTests/AchievementTests.swift
import XCTest
@testable import Plantgotchi

final class AchievementTests: XCTestCase {
    var db: AppDatabase!

    override func setUpWithError() throws {
        db = try AppDatabase.makeEmpty()
    }

    func testFirstSeedUnlocks() throws {
        try db.savePlant(Plant(
            id: "p1", userId: "u1", name: "Test",
            plantType: .photo, currentPhase: .germination
        ))
        let log = GrowLog(plantId: "p1", userId: "u1", phase: .germination, logType: .phaseChange)
        try db.addGrowLog(log)

        try AchievementEngine.checkAndUnlock(userId: "u1", db: db)

        let achievements = try db.getAchievements(userId: "u1")
        XCTAssertTrue(achievements.contains { $0.achievementKey == "first_seed" })
    }

    func testFirstSeedDoesNotDuplicate() throws {
        try db.savePlant(Plant(
            id: "p1", userId: "u1", name: "Test",
            plantType: .photo, currentPhase: .germination
        ))
        let log = GrowLog(plantId: "p1", userId: "u1", phase: .germination, logType: .phaseChange)
        try db.addGrowLog(log)

        try AchievementEngine.checkAndUnlock(userId: "u1", db: db)
        try AchievementEngine.checkAndUnlock(userId: "u1", db: db) // second call

        let achievements = try db.getAchievements(userId: "u1")
        let seedAchievements = achievements.filter { $0.achievementKey == "first_seed" }
        XCTAssertEqual(seedAchievements.count, 1)
    }

    func testTotalPoints() throws {
        try db.saveAchievement(Achievement(userId: "u1", achievementKey: "first_seed", points: 10))
        try db.saveAchievement(Achievement(userId: "u1", achievementKey: "first_harvest", points: 50))

        let total = try db.getTotalPoints(userId: "u1")
        XCTAssertEqual(total, 60)
    }
}
```

- [ ] **Step 2: Implement AchievementEngine**

```swift
// ios-app/Plantgotchi/Agents/AchievementEngine.swift
import Foundation

enum AchievementEngine {
    /// Check all achievement conditions and unlock any that are newly met.
    static func checkAndUnlock(userId: String, db: AppDatabase) throws {
        // First Seed: user has at least one plant in germination or later
        if !(try db.hasAchievement(userId: userId, key: AchievementDef.firstSeed.key)) {
            let plants = try db.getPlants(userId: userId)
            if plants.contains(where: { $0.currentPhase != nil }) {
                try db.saveAchievement(Achievement(
                    userId: userId,
                    achievementKey: AchievementDef.firstSeed.key,
                    points: AchievementDef.firstSeed.points
                ))
            }
        }

        // First Harvest: user has a plant in drying or later
        if !(try db.hasAchievement(userId: userId, key: AchievementDef.firstHarvest.key)) {
            let plants = try db.getPlants(userId: userId)
            let postHarvest: [Phase] = [.drying, .curing, .processing, .complete]
            if plants.contains(where: { p in p.currentPhase.map { postHarvest.contains($0) } ?? false }) {
                try db.saveAchievement(Achievement(
                    userId: userId,
                    achievementKey: AchievementDef.firstHarvest.key,
                    points: AchievementDef.firstHarvest.points
                ))
            }
        }

        // Ten Plants
        if !(try db.hasAchievement(userId: userId, key: AchievementDef.tenPlants.key)) {
            let plants = try db.getPlants(userId: userId)
            if plants.count >= 10 {
                try db.saveAchievement(Achievement(
                    userId: userId,
                    achievementKey: AchievementDef.tenPlants.key,
                    points: AchievementDef.tenPlants.points
                ))
            }
        }

        // Additional achievements can be added following the same pattern
    }
}
```

- [ ] **Step 3: Run tests**

Run: `cd ios-app && swift test --filter AchievementTests 2>&1 | tail -5`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add ios-app/Plantgotchi/Agents/AchievementEngine.swift ios-app/PlantgotchiTests/AchievementTests.swift
git commit -m "feat: add AchievementEngine with first_seed, first_harvest, ten_plants checks"
```

---

## Chunk 7: Integration and Polish

### Task 13: Update Existing Tests for Backward Compatibility

**Files:**
- Modify: `ios-app/PlantgotchiTests/RuleEngineTests.swift`
- Modify: `ios-app/PlantgotchiTests/PlantViewTests.swift`

- [ ] **Step 1: Run all existing tests**

Run: `cd ios-app && swift test 2>&1 | tail -20`

Fix any compilation errors from the Plant model changes. The existing tests should work because all new fields have default nil values, but verify.

- [ ] **Step 2: Fix any broken tests**

Most likely fixes needed:
- `RuleEngineTests.makePlant()` — already uses named params, should work since new fields default to nil
- `PlantViewTests` — may need `phase` added to PlantView if we added it in Task 7

- [ ] **Step 3: Run full test suite and verify**

Run: `cd ios-app && swift test 2>&1 | tail -20`
Expected: All tests pass

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: update existing tests for backward compatibility with lifecycle fields"
```

---

### Task 14: Update GardenView Plant Parsing

**Files:**
- Modify: `ios-app/Plantgotchi/Views/GardenView.swift`

- [ ] **Step 1: Update API response parsing to include lifecycle fields**

In `GardenView.refreshPlants()`, update the plant parsing to include the new fields from the API response:

```swift
// Add to the Plant init in the compactMap:
plantType: (p["plant_type"] as? String).flatMap { PlantType(rawValue: $0) },
strainName: p["strain_name"] as? String,
strainType: (p["strain_type"] as? String).flatMap { StrainType(rawValue: $0) },
environment: (p["environment"] as? String).flatMap { GrowEnvironment(rawValue: $0) },
currentPhase: (p["current_phase"] as? String).flatMap { Phase(rawValue: $0) },
phaseStartedAt: p["phase_started_at"] as? String,
growId: p["grow_id"] as? String
```

- [ ] **Step 2: Commit**

```bash
git add ios-app/Plantgotchi/Views/GardenView.swift
git commit -m "feat: parse lifecycle fields from API response in GardenView"
```

---

### Task 15: Final Integration Test

- [ ] **Step 1: Run the full test suite**

Run: `cd ios-app && swift test 2>&1`
Expected: All tests pass

- [ ] **Step 2: Build the iOS app**

Run: `cd ios-app && swift build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: final integration fixes for cannabis lifecycle feature"
```
