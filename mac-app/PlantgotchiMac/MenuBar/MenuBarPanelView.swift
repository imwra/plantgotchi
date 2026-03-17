import SwiftUI

struct MenuBarPanelView: View {
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
                    Button("Refresh") {
                        controller.refresh()
                    }
                    .buttonStyle(.borderedProminent)
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
