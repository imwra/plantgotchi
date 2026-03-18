import XCTest
@testable import PlantgotchiMac

final class MenuBarPanelViewModelTests: XCTestCase {
    func test_buildsCompactAttentionSummaryFromSnapshot() {
        let snapshot = MenuBarPanelViewModel.makeSnapshot(vitality: .medium, attentionCount: 3)
        let viewModel = MenuBarPanelViewModel(snapshot: snapshot)

        XCTAssertEqual(viewModel.vitalityText, "Medium")
        XCTAssertEqual(viewModel.attentionSummary, "3 need attention")
    }
}
