import Foundation
import PlantgotchiCore

@MainActor
final class MenuBarSceneController: ObservableObject {
    @Published private(set) var snapshot: GardenSnapshot?

    private let store: GardenStore
    private let tokenProvider: () -> String?
    private let onUnauthorized: @MainActor () -> Void

    init(
        baseURL: URL? = nil,
        tokenProvider: @escaping () -> String? = { nil },
        onUnauthorized: @escaping @MainActor () -> Void = {},
        store: GardenStore? = nil
    ) {
        self.tokenProvider = tokenProvider
        self.onUnauthorized = onUnauthorized

        if let store {
            self.store = store
        } else {
            self.store = MenuBarSceneController.makeDefaultStore(
                baseURL: baseURL ?? Self.configuredBaseURL(),
                tokenProvider: tokenProvider
            )
        }

        snapshot = try? SnapshotCache().load()
    }

    func refresh() {
        guard tokenProvider() != nil else {
            snapshot = nil
            return
        }

        Task {
            do {
                snapshot = try await store.refresh()
            } catch let error as PlantAPIClientError where error == .unauthorized {
                snapshot = nil
                onUnauthorized()
            } catch {
                if snapshot == nil {
                    snapshot = MenuBarPanelViewModel.makeSnapshot(vitality: .medium, attentionCount: 0)
                }
            }
        }
    }

    func clearSnapshot() {
        snapshot = nil
    }

    private static func makeDefaultStore(
        baseURL: URL,
        tokenProvider: @escaping () -> String?
    ) -> GardenStore {
        GardenStore(
            client: PlantAPIClient(baseURL: baseURL, tokenProvider: tokenProvider),
            cache: SnapshotCache()
        )
    }

    static func configuredBaseURL(bundle: Bundle = .main) -> URL {
        if
            let configPath = bundle.path(forResource: "Config", ofType: "plist"),
            let config = NSDictionary(contentsOfFile: configPath),
            let urlString = config["APIBaseURL"] as? String,
            let url = URL(string: urlString),
            !urlString.isEmpty
        {
            return url
        }

        return URL(string: "http://localhost:4321")!
    }
}
