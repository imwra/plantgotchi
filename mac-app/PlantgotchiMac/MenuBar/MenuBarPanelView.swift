import SwiftUI

struct MenuBarPanelView: View {
    @Environment(\.openWindow) private var openWindow
    @ObservedObject var controller: MenuBarSceneController

    var body: some View {
        Group {
            if let snapshot = controller.snapshot {
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
                }
                .padding(16)
                .frame(width: 240)
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Plantgotchi")
                        .font(.headline)
                    Text("No garden data yet")
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
                }
                .padding(16)
                .frame(width: 240)
            }
        }
        .task {
            controller.refresh()
        }
    }
}
