import XCTest
@testable import PlantgotchiMac

final class PlantgotchiMacTests: XCTestCase {
    func testMacShellLoads() {
        XCTAssertTrue(true)
    }

    func test_rootDestinationShowsAuthenticationWhenSignedOut() {
        XCTAssertEqual(PlantgotchiMacRoot.destination(isAuthenticated: false), .authentication)
    }

    func test_rootDestinationShowsGardenWhenSignedIn() {
        XCTAssertEqual(PlantgotchiMacRoot.destination(isAuthenticated: true), .garden)
    }
}
