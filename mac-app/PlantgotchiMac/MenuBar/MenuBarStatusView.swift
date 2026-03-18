import SwiftUI
import PlantgotchiCore

struct MenuBarStatusView: View {
    let snapshot: GardenSnapshot?
    let isAuthenticated: Bool

    private var title: String {
        guard isAuthenticated else {
            return "Sign In"
        }

        guard let snapshot else {
            return "Plantgotchi"
        }

        return snapshot.wholeGarden.vitality.rawValue.capitalized
    }

    var body: some View {
        Label(title, systemImage: "leaf.fill")
    }
}
