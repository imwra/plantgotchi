# macOS Cannabis Lifecycle — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface cannabis lifecycle data (phase, strain, environment) in the macOS app's garden window and menu bar, by extending the shared PlantgotchiCore layer and updating macOS views.

**Architecture:** The macOS app consumes PlantgotchiCore (shared with iOS). The shared layer's API payload and snapshot models currently lack lifecycle fields. We extend `APIPlant` → `PlantScopeInput` → `PlantScope` to carry phase/strain/environment data, then update macOS views to display it. We also fix the iOS `TursoSync.parsePlant()` which is missing lifecycle fields. No new tables or business logic — the web API already returns lifecycle fields and the iOS models already define Phase/GrowEnvironment/etc.

**Tech Stack:** Swift, SwiftUI, PlantgotchiCore framework, XCTest

**Reference:** iOS models at `ios-app/Plantgotchi/Models/`, web API at `website-astro/src/`

---

## File Structure

### Files to modify

| File | Changes |
|------|---------|
| `ios-app/PlantgotchiCore/Garden/APIPlantPayload.swift` | Add lifecycle fields to `APIPlant` struct |
| `ios-app/PlantgotchiCore/Garden/GardenScopeModels.swift` | Add `currentPhase`, `strainName`, `environment` to `PlantScopeInput` and `PlantScope` |
| `ios-app/PlantgotchiCore/Garden/GardenStore.swift` | Pass lifecycle fields from `APIPlant` → `PlantScopeInput` |
| `ios-app/PlantgotchiCore/Garden/GardenVitalityEngine.swift` | Pass lifecycle fields from `PlantScopeInput` → `PlantScope` |
| `ios-app/Plantgotchi/Sync/TursoSync.swift` | Add lifecycle fields to `parsePlant()` |
| `mac-app/PlantgotchiMac/GardenWindow/DigitalGardenScene.swift` | Show phase badge on plant tiles |
| `mac-app/PlantgotchiMac/GardenWindow/PlantDetailSidebar.swift` | Show phase, strain, environment in inspector |
| `mac-app/PlantgotchiMacTests/GardenWindowViewModelTests.swift` | Update test to include lifecycle fields |

---

## Chunk 1: Shared Core Layer

### Task 1: Extend APIPlant with Lifecycle Fields

**Files:**
- Modify: `ios-app/PlantgotchiCore/Garden/APIPlantPayload.swift`

- [ ] **Step 1: Add lifecycle fields to APIPlant**

Add these optional properties after `lightPreference`:

```swift
    public let plantType: String?
    public let strainId: String?
    public let strainName: String?
    public let strainType: String?
    public let environment: String?
    public let currentPhase: String?
    public let phaseStartedAt: String?
    public let growId: String?
```

Add corresponding CodingKeys:

```swift
        case plantType = "plant_type"
        case strainId = "strain_id"
        case strainName = "strain_name"
        case strainType = "strain_type"
        case environment
        case currentPhase = "current_phase"
        case phaseStartedAt = "phase_started_at"
        case growId = "grow_id"
```

Update the `init` to include the new fields with `nil` defaults:

```swift
    public init(
        id: String,
        userID: String,
        name: String,
        species: String?,
        emoji: String,
        moistureMin: Double,
        moistureMax: Double,
        tempMin: Double,
        tempMax: Double,
        lightPreference: String,
        plantType: String? = nil,
        strainId: String? = nil,
        strainName: String? = nil,
        strainType: String? = nil,
        environment: String? = nil,
        currentPhase: String? = nil,
        phaseStartedAt: String? = nil,
        growId: String? = nil
    ) {
        self.id = id
        self.userID = userID
        self.name = name
        self.species = species
        self.emoji = emoji
        self.moistureMin = moistureMin
        self.moistureMax = moistureMax
        self.tempMin = tempMin
        self.tempMax = tempMax
        self.lightPreference = lightPreference
        self.plantType = plantType
        self.strainId = strainId
        self.strainName = strainName
        self.strainType = strainType
        self.environment = environment
        self.currentPhase = currentPhase
        self.phaseStartedAt = phaseStartedAt
        self.growId = growId
    }
```

- [ ] **Step 2: Commit**

```bash
git add ios-app/PlantgotchiCore/Garden/APIPlantPayload.swift
git commit -m "feat(core): add lifecycle fields to APIPlant payload"
```

---

### Task 2: Extend PlantScopeInput and PlantScope

**Files:**
- Modify: `ios-app/PlantgotchiCore/Garden/GardenScopeModels.swift`

- [ ] **Step 1: Add lifecycle fields to PlantScopeInput**

Add after `freshnessScore`:

```swift
    public let currentPhase: String?
    public let strainName: String?
    public let environment: String?
```

Update the `init`:

```swift
    public init(
        id: String,
        name: String,
        moistureScore: Double?,
        temperatureScore: Double?,
        lightScore: Double?,
        freshnessScore: Double,
        currentPhase: String? = nil,
        strainName: String? = nil,
        environment: String? = nil
    ) {
        self.id = id
        self.name = name
        self.moistureScore = moistureScore
        self.temperatureScore = temperatureScore
        self.lightScore = lightScore
        self.freshnessScore = freshnessScore
        self.currentPhase = currentPhase
        self.strainName = strainName
        self.environment = environment
    }
```

- [ ] **Step 2: Add lifecycle fields to PlantScope**

Add after `attentionState`:

```swift
    public let currentPhase: String?
    public let strainName: String?
    public let environment: String?
```

Update the `init`:

```swift
    public init(
        id: String,
        name: String,
        vitality: GardenSnapshot.VitalityLevel,
        attentionState: AttentionState,
        currentPhase: String? = nil,
        strainName: String? = nil,
        environment: String? = nil
    ) {
        self.id = id
        self.name = name
        self.vitality = vitality
        self.attentionState = attentionState
        self.currentPhase = currentPhase
        self.strainName = strainName
        self.environment = environment
    }
```

- [ ] **Step 3: Commit**

```bash
git add ios-app/PlantgotchiCore/Garden/GardenScopeModels.swift
git commit -m "feat(core): add lifecycle fields to PlantScopeInput and PlantScope"
```

---

### Task 3: Pass Lifecycle Fields Through GardenStore and VitalityEngine

**Files:**
- Modify: `ios-app/PlantgotchiCore/Garden/GardenStore.swift`
- Modify: `ios-app/PlantgotchiCore/Garden/GardenVitalityEngine.swift`

- [ ] **Step 1: Update GardenStore.makeSnapshot()**

In the `makeSnapshot` method, the `payload.map` closure currently creates `PlantScopeInput` without lifecycle fields. Add the new fields:

Replace the `PlantScopeInput(...)` creation in `makeSnapshot`:

```swift
            PlantScopeInput(
                id: entry.plant.id,
                name: entry.plant.name,
                moistureScore: score(
                    reading: entry.latestReading?.moisture,
                    min: entry.plant.moistureMin,
                    max: entry.plant.moistureMax
                ),
                temperatureScore: score(
                    reading: entry.latestReading?.temperature,
                    min: entry.plant.tempMin,
                    max: entry.plant.tempMax
                ),
                lightScore: lightScore(
                    reading: entry.latestReading?.light,
                    preference: entry.plant.lightPreference
                ),
                freshnessScore: freshnessScore(
                    timestamp: entry.latestReading?.timestamp,
                    now: now
                ),
                currentPhase: entry.plant.currentPhase,
                strainName: entry.plant.strainName,
                environment: entry.plant.environment
            )
```

- [ ] **Step 2: Update GardenVitalityEngine.plantScope()**

In `plantScope(from:)`, pass lifecycle fields through to PlantScope. Update both return sites:

For the `guard` early return (no signals):
```swift
            return PlantScope(
                id: input.id,
                name: input.name,
                vitality: .medium,
                attentionState: .unknown,
                currentPhase: input.currentPhase,
                strainName: input.strainName,
                environment: input.environment
            )
```

For the normal return:
```swift
        return PlantScope(
            id: input.id,
            name: input.name,
            vitality: vitality,
            attentionState: attentionState,
            currentPhase: input.currentPhase,
            strainName: input.strainName,
            environment: input.environment
        )
```

- [ ] **Step 3: Commit**

```bash
git add ios-app/PlantgotchiCore/Garden/GardenStore.swift ios-app/PlantgotchiCore/Garden/GardenVitalityEngine.swift
git commit -m "feat(core): pass lifecycle fields through GardenStore and VitalityEngine"
```

---

### Task 4: Update iOS TursoSync.parsePlant()

**Files:**
- Modify: `ios-app/Plantgotchi/Sync/TursoSync.swift`

- [ ] **Step 1: Add lifecycle fields to parsePlant**

The current `parsePlant(from:)` method creates a `Plant(...)` without lifecycle fields. Add them after `updatedAt`:

```swift
            plantType: (dict["plant_type"] as? String).flatMap(PlantType.init(rawValue:)),
            strainId: dict["strain_id"] as? String,
            strainName: dict["strain_name"] as? String,
            strainType: (dict["strain_type"] as? String).flatMap(StrainType.init(rawValue:)),
            environment: (dict["environment"] as? String).flatMap(GrowEnvironment.init(rawValue:)),
            currentPhase: (dict["current_phase"] as? String).flatMap(Phase.init(rawValue:)),
            phaseStartedAt: dict["phase_started_at"] as? String,
            growId: dict["grow_id"] as? String
```

Note: `Phase`, `PlantType`, `StrainType`, `GrowEnvironment` are already defined in the iOS models and should already be imported. Verify the import at the top of the file — `Plant` is imported which brings along these types.

- [ ] **Step 2: Commit**

```bash
git add ios-app/Plantgotchi/Sync/TursoSync.swift
git commit -m "feat(ios): add lifecycle fields to TursoSync.parsePlant()"
```

---

## Chunk 2: macOS Views

### Task 5: Add Phase Badge to Plant Tiles

**Files:**
- Modify: `mac-app/PlantgotchiMac/GardenWindow/DigitalGardenScene.swift`

- [ ] **Step 1: Add phase label to plantTile**

In `plantTile(_ plant:)`, add a phase badge below the status label. Replace the `statusLabel` text with a VStack that shows both status and phase:

After the existing `Text(statusLabel(for: plant))` line, add:

```swift
            if let phase = plant.currentPhase {
                Text(phaseLabel(phase))
                    .font(.caption2.weight(.medium))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(phaseColor(phase).opacity(0.15))
                    .foregroundStyle(phaseColor(phase))
                    .clipShape(Capsule())
            }
```

- [ ] **Step 2: Add helper methods**

Add these private methods to the DigitalGardenScene struct:

```swift
    private func phaseLabel(_ phase: String) -> String {
        switch phase {
        case "germination": return "Germinating"
        case "seedling": return "Seedling"
        case "vegetative": return "Vegetative"
        case "flowering": return "Flowering"
        case "drying": return "Drying"
        case "curing": return "Curing"
        case "processing": return "Processing"
        case "complete": return "Complete"
        default: return phase.capitalized
        }
    }

    private func phaseColor(_ phase: String) -> Color {
        switch phase {
        case "germination", "seedling": return .green
        case "vegetative": return .mint
        case "flowering": return .purple
        case "drying": return .orange
        case "curing": return .brown
        case "processing": return .gray
        case "complete": return .blue
        default: return .secondary
        }
    }
```

- [ ] **Step 3: Commit**

```bash
git add mac-app/PlantgotchiMac/GardenWindow/DigitalGardenScene.swift
git commit -m "feat(macos): add phase badge to plant tiles in garden scene"
```

---

### Task 6: Show Lifecycle Details in PlantDetailSidebar

**Files:**
- Modify: `mac-app/PlantgotchiMac/GardenWindow/PlantDetailSidebar.swift`

- [ ] **Step 1: Add lifecycle section to the sidebar**

After the existing `Text(detailText(for: plant))` block, add a lifecycle section that shows when the plant has a phase:

```swift
                if plant.currentPhase != nil || plant.strainName != nil || plant.environment != nil {
                    Divider()

                    VStack(alignment: .leading, spacing: 10) {
                        if let phase = plant.currentPhase {
                            HStack {
                                Text("Phase")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Spacer()
                                Text(phaseDisplayName(phase))
                                    .font(.caption.weight(.semibold))
                            }
                        }

                        if let strain = plant.strainName {
                            HStack {
                                Text("Strain")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Spacer()
                                Text(strain)
                                    .font(.caption.weight(.semibold))
                            }
                        }

                        if let env = plant.environment {
                            HStack {
                                Text("Environment")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Spacer()
                                Text(env.capitalized)
                                    .font(.caption.weight(.semibold))
                            }
                        }
                    }
                }
```

- [ ] **Step 2: Add phaseDisplayName helper**

```swift
    private func phaseDisplayName(_ phase: String) -> String {
        switch phase {
        case "germination": return "Germinating"
        case "seedling": return "Seedling"
        case "vegetative": return "Vegetative"
        case "flowering": return "Flowering"
        case "drying": return "Drying"
        case "curing": return "Curing"
        case "processing": return "Processing"
        case "complete": return "Complete"
        default: return phase.capitalized
        }
    }
```

- [ ] **Step 3: Commit**

```bash
git add mac-app/PlantgotchiMac/GardenWindow/PlantDetailSidebar.swift
git commit -m "feat(macos): show lifecycle details in plant detail sidebar"
```

---

## Chunk 3: Tests

### Task 7: Update Tests for Lifecycle Fields

**Files:**
- Modify: `mac-app/PlantgotchiMacTests/GardenWindowViewModelTests.swift`

- [ ] **Step 1: Update existing test**

The test creates `PlantScope` instances. Since we added optional lifecycle fields with defaults, the existing test should still compile without changes. Verify this.

- [ ] **Step 2: Add test for lifecycle data flow**

Add a new test:

```swift
    @MainActor
    func test_selectedPlantExposesLifecycleFields() {
        let snapshot = GardenSnapshot.generatedAt(
            Date(timeIntervalSince1970: 0),
            wholeGarden: .init(vitality: .high),
            subsets: [],
            plants: [
                PlantScope(
                    id: "p1",
                    name: "Northern Lights",
                    vitality: .high,
                    attentionState: .healthy,
                    currentPhase: "flowering",
                    strainName: "Northern Lights",
                    environment: "indoor"
                ),
            ]
        )
        let viewModel = GardenWindowViewModel(snapshot: snapshot)
        viewModel.selectPlant(id: "p1")

        let plant = viewModel.selectedPlant
        XCTAssertNotNil(plant)
        XCTAssertEqual(plant?.currentPhase, "flowering")
        XCTAssertEqual(plant?.strainName, "Northern Lights")
        XCTAssertEqual(plant?.environment, "indoor")
    }
```

- [ ] **Step 3: Add test for plants without lifecycle fields**

```swift
    @MainActor
    func test_selectedPlantWithoutLifecycleFieldsHasNils() {
        let snapshot = GardenSnapshot.generatedAt(
            Date(timeIntervalSince1970: 0),
            wholeGarden: .init(vitality: .medium),
            subsets: [],
            plants: [
                PlantScope(id: "p1", name: "Fern", vitality: .medium, attentionState: .healthy),
            ]
        )
        let viewModel = GardenWindowViewModel(snapshot: snapshot)
        viewModel.selectPlant(id: "p1")

        let plant = viewModel.selectedPlant
        XCTAssertNotNil(plant)
        XCTAssertNil(plant?.currentPhase)
        XCTAssertNil(plant?.strainName)
        XCTAssertNil(plant?.environment)
    }
```

- [ ] **Step 4: Commit**

```bash
git add mac-app/PlantgotchiMacTests/GardenWindowViewModelTests.swift
git commit -m "test(macos): add lifecycle field tests for GardenWindowViewModel"
```

---

## Summary

| Task | What it adds | Files |
|------|-------------|-------|
| 1 | Lifecycle fields on APIPlant (API deserialization) | APIPlantPayload.swift |
| 2 | Lifecycle fields on PlantScopeInput and PlantScope | GardenScopeModels.swift |
| 3 | Pass lifecycle data through GardenStore → VitalityEngine | GardenStore.swift, GardenVitalityEngine.swift |
| 4 | iOS TursoSync parsePlant lifecycle fields | TursoSync.swift |
| 5 | Phase badge on macOS garden plant tiles | DigitalGardenScene.swift |
| 6 | Lifecycle details in macOS plant inspector sidebar | PlantDetailSidebar.swift |
| 7 | Tests for lifecycle data flow | GardenWindowViewModelTests.swift |

**Note:** This plan focuses on surfacing existing lifecycle data in the macOS UI. The business logic (Phase enum, rule engine, achievement engine, database) already exists in iOS and doesn't need to be duplicated — it's in the iOS app target. The macOS app reads plant data via the API and displays it through the PlantgotchiCore snapshot pipeline.
