import SwiftUI
import WidgetKit

@main
struct PlantgotchiWidgetsBundle: WidgetBundle {
    var body: some Widget {
        WholeGardenWidget()
        SinglePlantWidget()
        SubsetGardenWidget()
    }
}
