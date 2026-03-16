import XCTest
@testable import Plantgotchi

final class SensorParserTests: XCTestCase {

    // MARK: - Moisture (uint16 LE)

    func testParseMoisture_42Percent() {
        // 42 as uint16 LE = 0x2A, 0x00
        let data = Data([0x2A, 0x00])
        let result = SensorParser.parseMoisture(data)
        XCTAssertEqual(result, 42)
    }

    func testParseMoisture_100Percent() {
        let data = Data([0x64, 0x00])
        let result = SensorParser.parseMoisture(data)
        XCTAssertEqual(result, 100)
    }

    func testParseMoisture_0Percent() {
        let data = Data([0x00, 0x00])
        let result = SensorParser.parseMoisture(data)
        XCTAssertEqual(result, 0)
    }

    func testParseMoisture_tooShort() {
        let data = Data([0x2A])
        let result = SensorParser.parseMoisture(data)
        XCTAssertNil(result)
    }

    func testParseMoisture_outOfRange() {
        // 200 as uint16 LE = 0xC8, 0x00
        let data = Data([0xC8, 0x00])
        let result = SensorParser.parseMoisture(data)
        XCTAssertNil(result)
    }

    // MARK: - Temperature (int16 LE, x100)

    func testParseTemperature_22_5C() {
        // 22.5 * 100 = 2250 = 0xCA08 LE -> 0xCA, 0x08
        let value: Int16 = 2250
        var le = value.littleEndian
        let data = Data(bytes: &le, count: 2)
        let result = SensorParser.parseTemperature(data)
        XCTAssertEqual(result, 22.5)
    }

    func testParseTemperature_negative5C() {
        // -5.0 * 100 = -500
        let value: Int16 = -500
        var le = value.littleEndian
        let data = Data(bytes: &le, count: 2)
        let result = SensorParser.parseTemperature(data)
        XCTAssertEqual(result, -5.0)
    }

    func testParseTemperature_0C() {
        let data = Data([0x00, 0x00])
        let result = SensorParser.parseTemperature(data)
        XCTAssertEqual(result, 0.0)
    }

    func testParseTemperature_tooShort() {
        let data = Data([0x00])
        let result = SensorParser.parseTemperature(data)
        XCTAssertNil(result)
    }

    // MARK: - Light (uint32 LE, lux)

    func testParseLight_1500Lux() {
        // 1500 as uint32 LE
        let value: UInt32 = 1500
        var le = value.littleEndian
        let data = Data(bytes: &le, count: 4)
        let result = SensorParser.parseLight(data)
        XCTAssertEqual(result, 1500)
    }

    func testParseLight_0Lux() {
        let data = Data([0x00, 0x00, 0x00, 0x00])
        let result = SensorParser.parseLight(data)
        XCTAssertEqual(result, 0)
    }

    func testParseLight_highValue() {
        // 100000 lux (bright sunlight)
        let value: UInt32 = 100000
        var le = value.littleEndian
        let data = Data(bytes: &le, count: 4)
        let result = SensorParser.parseLight(data)
        XCTAssertEqual(result, 100000)
    }

    func testParseLight_tooShort() {
        let data = Data([0x00, 0x00])
        let result = SensorParser.parseLight(data)
        XCTAssertNil(result)
    }

    // MARK: - Battery (uint8, %)

    func testParseBattery_85Percent() {
        let data = Data([85])
        let result = SensorParser.parseBattery(data)
        XCTAssertEqual(result, 85)
    }

    func testParseBattery_0Percent() {
        let data = Data([0])
        let result = SensorParser.parseBattery(data)
        XCTAssertEqual(result, 0)
    }

    func testParseBattery_100Percent() {
        let data = Data([100])
        let result = SensorParser.parseBattery(data)
        XCTAssertEqual(result, 100)
    }

    func testParseBattery_empty() {
        let data = Data()
        let result = SensorParser.parseBattery(data)
        XCTAssertNil(result)
    }
}
