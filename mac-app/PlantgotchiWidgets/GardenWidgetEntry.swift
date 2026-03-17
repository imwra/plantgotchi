import Foundation
import PlantgotchiCore
import WidgetKit

struct GardenWidgetEntry: TimelineEntry {
    let date: Date
    let snapshot: GardenSnapshot
    let kind: WidgetKind
}
