import Testing
import Foundation
@testable import Plantgotchi

@Suite("AuthenticatedHTTPClient Tests", .serialized)
struct AuthenticatedHTTPClientTests {
    @Test func attachesBearerTokenToRequest() async throws {
        let keychain = KeychainManager(service: "com.plantgotchi.httptest")
        try keychain.save(token: "my-token")
        defer { try? keychain.deleteToken() }

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)

        MockURLProtocol.handler = { request in
            let authHeader = request.value(forHTTPHeaderField: "Authorization")
            #expect(authHeader == "Bearer my-token")

            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
                httpVersion: nil,
                headerFields: nil
            )!
            return (Data(), response)
        }

        let client = AuthenticatedHTTPClient(
            baseURL: "http://localhost:4321",
            keychain: keychain,
            session: session
        )
        let (_, response) = try await client.request(path: "/api/test")
        #expect(response.statusCode == 200)
    }

    @Test func clearsTokenOn401() async throws {
        let keychain = KeychainManager(service: "com.plantgotchi.httptest401")
        try keychain.save(token: "expired-token")
        defer { try? keychain.deleteToken() }

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)

        MockURLProtocol.handler = { request in
            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: 401,
                httpVersion: nil,
                headerFields: nil
            )!
            return (Data(), response)
        }

        let client = AuthenticatedHTTPClient(
            baseURL: "http://localhost:4321",
            keychain: keychain,
            session: session
        )
        let (_, response) = try await client.request(path: "/api/test")
        #expect(response.statusCode == 401)
        #expect(keychain.getToken() == nil)
    }
}

/// Simple URLProtocol mock for intercepting HTTP requests in tests.
class MockURLProtocol: URLProtocol {
    static var handler: ((URLRequest) throws -> (Data, HTTPURLResponse))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = Self.handler else { return }
        do {
            let (data, response) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}
