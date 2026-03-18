import SwiftUI

struct MenuBarPanelView: View {
    @Environment(\.openWindow) private var openWindow
    @ObservedObject var controller: MenuBarSceneController
    let isAuthenticated: Bool
    let signOut: () -> Void

    var body: some View {
        Group {
            if !isAuthenticated {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Plantgotchi")
                        .font(.headline)
                    Text("Sign in to load your live garden")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Button("Open Garden") {
                        openWindow(id: "garden")
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding(16)
                .frame(width: 260)
            } else if let snapshot = controller.snapshot {
                let viewModel = MenuBarPanelViewModel(snapshot: snapshot)
                VStack(alignment: .leading, spacing: 12) {
                    Text(viewModel.vitalityText)
                        .font(.headline)
                    Text(viewModel.attentionSummary)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text(viewModel.updatedText)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Button("Refresh") {
                        controller.refresh()
                    }
                    .buttonStyle(.borderedProminent)
                    Button("Open Garden") {
                        openWindow(id: "garden")
                    }
                    .buttonStyle(.bordered)
                    Button("Sign Out") {
                        signOut()
                    }
                    .buttonStyle(.borderless)
                }
                .padding(16)
                .frame(width: 260)
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Plantgotchi")
                        .font(.headline)
                    Text("Loading your garden…")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Button("Refresh") {
                        controller.refresh()
                    }
                    .buttonStyle(.bordered)
                    Button("Open Garden") {
                        openWindow(id: "garden")
                    }
                    .buttonStyle(.bordered)
                    Button("Sign Out") {
                        signOut()
                    }
                    .buttonStyle(.borderless)
                }
                .padding(16)
                .frame(width: 260)
            }
        }
        .task {
            if isAuthenticated {
                controller.refresh()
            }
        }
    }
}
