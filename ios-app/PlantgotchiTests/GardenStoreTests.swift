import XCTest
@testable import PlantgotchiCore

@MainActor
final class GardenStoreTests: XCTestCase {
    override class func tearDown() {
        URLProtocol.unregisterClass(PlantAPIClientURLProtocol.self)
        super.tearDown()
    }

    func test_refreshPersistsLatestSnapshotForWidgets() async throws {
        let client = MockPlantAPIClient(payload: [.fixture])
        let cache = InMemorySnapshotCache()
        let store = GardenStore(client: client, cache: cache, now: { Date(timeIntervalSince1970: 1_800) })

        let snapshot = try await store.refresh()

        XCTAssertEqual(snapshot.wholeGarden.vitality, .high)
        XCTAssertEqual(snapshot.wholeGarden.attentionCount, 0)
        XCTAssertEqual(cache.savedSnapshot, snapshot)
        XCTAssertEqual(snapshot.plants.map(\.id), ["plant-1"])
    }

    func test_refreshFallsBackToCachedSnapshotWhenNetworkFails() async throws {
        let cached = GardenSnapshot.generatedAt(
            Date(timeIntervalSince1970: 500),
            wholeGarden: .init(vitality: .medium, attentionCount: 1, unknownCount: 0),
            subsets: [],
            plants: [
                PlantScope(
                    id: "cached-plant",
                    name: "Cached Plant",
                    vitality: .medium,
                    attentionState: .healthy
                ),
            ]
        )
        let client = MockPlantAPIClient(error: URLError(.timedOut))
        let cache = InMemorySnapshotCache(savedSnapshot: cached)
        let store = GardenStore(client: client, cache: cache, now: Date.init)

        let snapshot = try await store.refresh()

        XCTAssertEqual(snapshot, cached)
    }

    func test_plantAPIClientAddsBearerTokenWhenTokenProviderReturnsToken() async throws {
        let expectation = expectation(description: "request captured")
        PlantAPIClientURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer stored-token")
            XCTAssertEqual(request.url?.absoluteString, "https://plantgotchi.pages.dev/api/plants")
            expectation.fulfill()

            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
                httpVersion: nil,
                headerFields: ["Content-Type": "application/json"]
            )!
            return (response, Data("[]".utf8))
        }

        let session = URLSession(configuration: configuredSession())
        let client = PlantAPIClient(
            baseURL: URL(string: "https://plantgotchi.pages.dev")!,
            session: session,
            tokenProvider: { "stored-token" }
        )

        let payload = try await client.fetchPlants()

        XCTAssertEqual(payload, [])
        await fulfillment(of: [expectation], timeout: 1.0)
    }

    private func configuredSession() -> URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [PlantAPIClientURLProtocol.self]
        URLProtocol.registerClass(PlantAPIClientURLProtocol.self)
        return configuration
    }
}

private struct MockPlantAPIClient: PlantAPIClientProtocol {
    var payload: [APIPlantPayload] = []
    var error: Error?

    func fetchPlants() async throws -> [APIPlantPayload] {
        if let error {
            throw error
        }
        return payload
    }
}

private final class InMemorySnapshotCache: SnapshotCacheProtocol {
    var savedSnapshot: GardenSnapshot?

    init(savedSnapshot: GardenSnapshot? = nil) {
        self.savedSnapshot = savedSnapshot
    }

    func load() throws -> GardenSnapshot? {
        savedSnapshot
    }

    func save(_ snapshot: GardenSnapshot) throws {
        savedSnapshot = snapshot
    }
}

private extension APIPlantPayload {
    static let fixture = APIPlantPayload(
        plant: .init(
            id: "plant-1",
            userID: "user-1",
            name: "Monstera",
            species: "Monstera deliciosa",
            emoji: "\u{1F331}",
            moistureMin: 30,
            moistureMax: 80,
            tempMin: 18,
            tempMax: 30,
            lightPreference: "medium"
        ),
        latestReading: .init(
            moisture: 55,
            temperature: 24,
            light: 1400,
            timestamp: "1970-01-01T00:20:00Z"
        ),
        recentCareLogs: []
    )
}

private final class PlantAPIClientURLProtocol: URLProtocol {
    static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool {
        true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        guard let handler = Self.requestHandler else {
            XCTFail("Missing request handler")
            return
        }

        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}
