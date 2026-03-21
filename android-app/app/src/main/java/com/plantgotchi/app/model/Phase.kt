package com.plantgotchi.app.model

/**
 * Cannabis growth phase lifecycle.
 * Mirrors the web/iOS Phase enum exactly.
 */
enum class Phase(val value: String) {
    GERMINATION("germination"),
    SEEDLING("seedling"),
    VEGETATIVE("vegetative"),
    FLOWERING("flowering"),
    DRYING("drying"),
    CURING("curing"),
    PROCESSING("processing"),
    COMPLETE("complete");

    val nextPhase: Phase?
        get() {
            val idx = entries.indexOf(this)
            return if (idx < entries.size - 1) entries[idx + 1] else null
        }

    val isGrowing: Boolean
        get() = this == VEGETATIVE || this == FLOWERING

    val hasMonitoring: Boolean
        get() = this != COMPLETE

    val defaults: PhaseDefaults?
        get() = PHASE_DEFAULTS[this]

    val availableActions: List<GrowLogType>
        get() = PHASE_ACTIONS[this] ?: emptyList()

    companion object {
        fun fromValue(value: String?): Phase? =
            entries.find { it.value == value }
    }
}

data class PhaseDefaults(
    val tempMin: Double,
    val tempMax: Double,
    val humidityMin: Int,
    val humidityMax: Int,
    val lightSchedule: String,
)

val LATE_FLOWER_HUMIDITY_MIN = 30
val LATE_FLOWER_HUMIDITY_MAX = 40

private val PHASE_DEFAULTS = mapOf(
    Phase.GERMINATION to PhaseDefaults(22.0, 28.0, 70, 90, "18/6"),
    Phase.SEEDLING    to PhaseDefaults(20.0, 26.0, 60, 70, "18/6"),
    Phase.VEGETATIVE  to PhaseDefaults(20.0, 28.0, 40, 60, "18/6"),
    Phase.FLOWERING   to PhaseDefaults(18.0, 26.0, 40, 50, "12/12"),
    Phase.DRYING      to PhaseDefaults(18.0, 22.0, 55, 65, "0/24"),
    Phase.CURING      to PhaseDefaults(18.0, 22.0, 58, 65, "0/24"),
    Phase.PROCESSING  to PhaseDefaults(18.0, 24.0, 40, 60, "0/24"),
)

/**
 * Grow log entry types (21 total).
 * Mirrors the web GrowLogType exactly.
 */
enum class GrowLogType(val value: String, val label: String) {
    PHASE_CHANGE("phaseChange", "Phase Change"),
    WATERING("watering", "Watering"),
    FEEDING("feeding", "Feeding"),
    TOPPING("topping", "Topping"),
    FIMMING("fimming", "FIMming"),
    LST("lst", "Low Stress Training"),
    DEFOLIATION("defoliation", "Defoliation"),
    TRANSPLANT("transplant", "Transplant"),
    FLUSHING("flushing", "Flushing"),
    TRICHOME_CHECK("trichomeCheck", "Trichome Check"),
    MEASUREMENT("measurement", "Measurement"),
    ENVIRONMENTAL("environmental", "Environmental"),
    PHOTO("photo", "Photo"),
    NOTE("note", "Note"),
    HARVEST("harvest", "Harvest"),
    DRY_WEIGHT("dryWeight", "Dry Weight"),
    DRY_CHECK("dryCheck", "Dry Check"),
    CURE_CHECK("cureCheck", "Cure Check"),
    PROCESSING_LOG("processingLog", "Processing"),
    PEST_TREATMENT("pestTreatment", "Pest Treatment"),
    CLONING("cloning", "Cloning");

    companion object {
        fun fromValue(value: String?): GrowLogType? =
            entries.find { it.value == value }
    }
}

private val PHASE_ACTIONS = mapOf(
    Phase.GERMINATION to listOf(GrowLogType.WATERING, GrowLogType.ENVIRONMENTAL, GrowLogType.MEASUREMENT, GrowLogType.PHOTO, GrowLogType.NOTE),
    Phase.SEEDLING to listOf(GrowLogType.WATERING, GrowLogType.FEEDING, GrowLogType.TRANSPLANT, GrowLogType.ENVIRONMENTAL, GrowLogType.MEASUREMENT, GrowLogType.PHOTO, GrowLogType.NOTE, GrowLogType.PEST_TREATMENT),
    Phase.VEGETATIVE to listOf(GrowLogType.WATERING, GrowLogType.FEEDING, GrowLogType.TOPPING, GrowLogType.FIMMING, GrowLogType.LST, GrowLogType.DEFOLIATION, GrowLogType.TRANSPLANT, GrowLogType.CLONING, GrowLogType.ENVIRONMENTAL, GrowLogType.MEASUREMENT, GrowLogType.PHOTO, GrowLogType.NOTE, GrowLogType.PEST_TREATMENT),
    Phase.FLOWERING to listOf(GrowLogType.WATERING, GrowLogType.FEEDING, GrowLogType.LST, GrowLogType.DEFOLIATION, GrowLogType.FLUSHING, GrowLogType.TRICHOME_CHECK, GrowLogType.ENVIRONMENTAL, GrowLogType.MEASUREMENT, GrowLogType.PHOTO, GrowLogType.NOTE, GrowLogType.PEST_TREATMENT, GrowLogType.HARVEST),
    Phase.DRYING to listOf(GrowLogType.DRY_CHECK, GrowLogType.ENVIRONMENTAL, GrowLogType.PHOTO, GrowLogType.NOTE),
    Phase.CURING to listOf(GrowLogType.CURE_CHECK, GrowLogType.ENVIRONMENTAL, GrowLogType.PHOTO, GrowLogType.NOTE),
    Phase.PROCESSING to listOf(GrowLogType.PROCESSING_LOG, GrowLogType.DRY_WEIGHT, GrowLogType.PHOTO, GrowLogType.NOTE),
    Phase.COMPLETE to listOf(GrowLogType.PHOTO, GrowLogType.NOTE),
)
