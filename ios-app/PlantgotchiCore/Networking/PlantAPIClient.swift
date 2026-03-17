import Foundation

public protocol PlantAPIClientProtocol {
    func fetchPlants() async throws -> [APIPlantPayload]
}

public final class PlantAPIClient: PlantAPIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private let tokenProvider: () -> String?

    public init(
        baseURL: URL,
        session: URLSession = .shared,
        tokenProvider: @escaping () -> String? = { nil }
    ) {
        self.baseURL = baseURL
        self.session = session
        self.tokenProvider = tokenProvider
    }

    public func fetchPlants() async throws -> [APIPlantPayload] {
        let url = baseURL.appendingPathComponent("api/plants")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = tokenProvider() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let decoder = JSONDecoder()
        return try decoder.decode([APIPlantPayload].self, from: data)
    }
}
