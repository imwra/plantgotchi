import PlantgotchiCore
import SwiftUI

struct GardenWindowView: View {
    let snapshot: GardenSnapshot

    @StateObject private var viewModel: GardenWindowViewModel

    init(snapshot: GardenSnapshot) {
        self.snapshot = snapshot
        _viewModel = StateObject(wrappedValue: GardenWindowViewModel(snapshot: snapshot))
    }

    var body: some View {
        HSplitView {
            DigitalGardenScene(viewModel: viewModel)
                .frame(minWidth: 720, idealWidth: 840)

            PlantDetailSidebar(viewModel: viewModel)
                .frame(minWidth: 260, idealWidth: 320)
        }
        .background(MacGardenTheme.canvas.ignoresSafeArea())
        .onAppear {
            Analytics.track("screen_viewed", properties: ["screen_name": "garden"])
        }
        .task(id: snapshot.generatedAt) {
            Analytics.track("garden_viewed", properties: ["plant_count": snapshot.plants.count])
        }
        .onChange(of: snapshot) { _, newSnapshot in
            viewModel.update(snapshot: newSnapshot)
        }
    }
}
