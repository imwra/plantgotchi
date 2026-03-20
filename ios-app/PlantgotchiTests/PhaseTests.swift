import XCTest
@testable import Plantgotchi

final class PhaseTests: XCTestCase {

    // MARK: - Phase.next

    func testPhaseNext_sequentialAdvancement() {
        XCTAssertEqual(Phase.germination.next, .seedling)
        XCTAssertEqual(Phase.seedling.next, .vegetative)
        XCTAssertEqual(Phase.vegetative.next, .flowering)
        XCTAssertEqual(Phase.flowering.next, .drying)
        XCTAssertEqual(Phase.drying.next, .curing)
        XCTAssertEqual(Phase.curing.next, .processing)
        XCTAssertEqual(Phase.processing.next, .complete)
        XCTAssertNil(Phase.complete.next)
    }

    // MARK: - isGrowing

    func testIsGrowing_trueForLivingPhases() {
        XCTAssertTrue(Phase.germination.isGrowing)
        XCTAssertTrue(Phase.seedling.isGrowing)
        XCTAssertTrue(Phase.vegetative.isGrowing)
        XCTAssertTrue(Phase.flowering.isGrowing)
    }

    func testIsGrowing_falseForPostHarvestPhases() {
        XCTAssertFalse(Phase.drying.isGrowing)
        XCTAssertFalse(Phase.curing.isGrowing)
        XCTAssertFalse(Phase.processing.isGrowing)
        XCTAssertFalse(Phase.complete.isGrowing)
    }

    // MARK: - hasMonitoring

    func testHasMonitoring_trueForMonitoredPhases() {
        XCTAssertTrue(Phase.germination.hasMonitoring)
        XCTAssertTrue(Phase.seedling.hasMonitoring)
        XCTAssertTrue(Phase.vegetative.hasMonitoring)
        XCTAssertTrue(Phase.flowering.hasMonitoring)
        XCTAssertTrue(Phase.drying.hasMonitoring)
        XCTAssertTrue(Phase.curing.hasMonitoring)
    }

    func testHasMonitoring_falseForProcessingAndComplete() {
        XCTAssertFalse(Phase.processing.hasMonitoring)
        XCTAssertFalse(Phase.complete.hasMonitoring)
    }

    // MARK: - Defaults

    func testDefaults_germinationHasHighHumidity() {
        let d = Phase.germination.defaults
        XCTAssertEqual(d.rhMin, 70)
        XCTAssertEqual(d.rhMax, 90)
        XCTAssertEqual(d.lightSchedule, "18/6")
    }

    func testDefaults_floweringHas12_12Light() {
        let d = Phase.flowering.defaults
        XCTAssertEqual(d.lightSchedule, "12/12")
        XCTAssertEqual(d.tempMinC, 18)
        XCTAssertEqual(d.tempMaxC, 26)
    }

    func testDefaults_dryingHasNoLight() {
        let d = Phase.drying.defaults
        XCTAssertEqual(d.lightSchedule, "0/24")
    }

    func testDefaults_completeHasZeroValues() {
        let d = Phase.complete.defaults
        XCTAssertEqual(d.tempMinC, 0)
        XCTAssertEqual(d.tempMaxC, 0)
    }

    // MARK: - Late Flower Defaults

    func testLateFlowerDefaults_lowerHumidity() {
        let d = Phase.lateFlowerDefaults
        XCTAssertEqual(d.rhMin, 30)
        XCTAssertEqual(d.rhMax, 40)
        XCTAssertEqual(d.lightSchedule, "12/12")
    }

    // MARK: - Available Actions

    func testAvailableActions_germinationHasCommonOnly() {
        let actions = Phase.germination.availableActions
        XCTAssertTrue(actions.contains(.watering))
        XCTAssertTrue(actions.contains(.feeding))
        XCTAssertFalse(actions.contains(.topping))
        XCTAssertFalse(actions.contains(.transplant))
    }

    func testAvailableActions_vegetativeHasTrainingActions() {
        let actions = Phase.vegetative.availableActions
        XCTAssertTrue(actions.contains(.topping))
        XCTAssertTrue(actions.contains(.fimming))
        XCTAssertTrue(actions.contains(.lst))
        XCTAssertTrue(actions.contains(.defoliation))
        XCTAssertTrue(actions.contains(.transplant))
    }

    func testAvailableActions_floweringHasHarvestAndTrichomeCheck() {
        let actions = Phase.flowering.availableActions
        XCTAssertTrue(actions.contains(.harvest))
        XCTAssertTrue(actions.contains(.trichomeCheck))
        XCTAssertTrue(actions.contains(.flushing))
    }

    func testAvailableActions_dryingHasDryCheckAndWeight() {
        let actions = Phase.drying.availableActions
        XCTAssertTrue(actions.contains(.dryCheck))
        XCTAssertTrue(actions.contains(.dryWeight))
        XCTAssertFalse(actions.contains(.watering))
    }

    func testAvailableActions_curingHasCureCheck() {
        let actions = Phase.curing.availableActions
        XCTAssertTrue(actions.contains(.cureCheck))
        XCTAssertFalse(actions.contains(.watering))
    }

    func testAvailableActions_completeHasOnlyPhotoAndNote() {
        let actions = Phase.complete.availableActions
        XCTAssertTrue(actions.contains(.photo))
        XCTAssertTrue(actions.contains(.note))
        XCTAssertEqual(actions.count, 2)
    }

    // MARK: - CaseIterable

    func testPhase_caseIterable_hasAllCases() {
        XCTAssertEqual(Phase.allCases.count, 8)
    }

    // MARK: - Codable round-trip

    func testPhase_codableRoundTrip() throws {
        let original = Phase.flowering
        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(Phase.self, from: data)
        XCTAssertEqual(original, decoded)
    }

    // MARK: - GrowLogType

    func testGrowLogType_allCasesCount() {
        XCTAssertEqual(GrowLogType.allCases.count, 19)
    }

    func testGrowLogType_labelAndIconNotEmpty() {
        for logType in GrowLogType.allCases {
            XCTAssertFalse(logType.label.isEmpty, "\(logType) has empty label")
            XCTAssertFalse(logType.iconName.isEmpty, "\(logType) has empty iconName")
        }
    }

    func testGrowLogType_codableRoundTrip() throws {
        let original = GrowLogType.trichomeCheck
        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(GrowLogType.self, from: data)
        XCTAssertEqual(original, decoded)
    }

    // MARK: - PhaseDefaults Equatable

    func testPhaseDefaults_equatable() {
        let a = PhaseDefaults(tempMinC: 20, tempMaxC: 28, rhMin: 40, rhMax: 60, lightSchedule: "18/6")
        let b = PhaseDefaults(tempMinC: 20, tempMaxC: 28, rhMin: 40, rhMax: 60, lightSchedule: "18/6")
        let c = PhaseDefaults(tempMinC: 18, tempMaxC: 26, rhMin: 40, rhMax: 50, lightSchedule: "12/12")
        XCTAssertEqual(a, b)
        XCTAssertNotEqual(a, c)
    }
}
