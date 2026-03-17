import Foundation
import PlantgotchiCore

@MainActor
final class MenuBarSceneController: ObservableObject {
    @Published private(set) var snapshot: GardenSnapshot?

    private let store: GardenStore

    init(store: GardenStore? = nil) {
        if let store {
            self.store = store
        } else {
            self.store = MenuBarSceneController.makeDefaultStore()
        }

        snapshot = try? SnapshotCache().load()
    }

    func refresh() {
        Task {
            do {
                snapshot = try await store.refresh()
            } catch {
                if snapshot == nil {
                    snapshot = MenuBarPanelViewModel.makeSnapshot(vitality: .medium, attentionCount: 0)
                }
            }
        }
    }

    private static func makeDefaultStore() -> GardenStore {
        GardenStore(
            client: PlantAPIClient(baseURL: URL(string: "http://localhost:4321")!),
            cache: SnapshotCache()
        )
    }
}
