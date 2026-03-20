package com.plantgotchi.app.agent

import com.plantgotchi.app.model.Phase
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.Recommendation
import com.plantgotchi.app.model.SensorReading
import java.util.UUID
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Offline rule engine — runs on every new sensor reading, no network needed.
 * Returns recommendations based on simple threshold checks.
 *
 * Port of `website-astro/src/lib/agents/rules.ts` and `plant-view.ts`.
 */
object RuleEngine {

    data class ResolvedThresholds(
        val tempMin: Double,
        val tempMax: Double,
        val moistureMin: Int,
        val moistureMax: Int,
    )

    fun resolveThresholds(plant: Plant): ResolvedThresholds {
        val phase = Phase.fromValue(plant.currentPhase)

        // Always use plant-level moisture
        val moistureMin = plant.moistureMin
        val moistureMax = plant.moistureMax

        // Use phase defaults for temp when phase is set
        if (phase != null && phase != Phase.COMPLETE) {
            val defaults = phase.defaults
            if (defaults != null) {
                return ResolvedThresholds(
                    tempMin = defaults.tempMin,
                    tempMax = defaults.tempMax,
                    moistureMin = moistureMin,
                    moistureMax = moistureMax,
                )
            }
        }

        return ResolvedThresholds(
            tempMin = plant.tempMin,
            tempMax = plant.tempMax,
            moistureMin = moistureMin,
            moistureMax = moistureMax,
        )
    }

    fun getTransitionSuggestions(plant: Plant): List<Recommendation> {
        val phase = Phase.fromValue(plant.currentPhase) ?: return emptyList()
        val startedAt = plant.phaseStartedAt ?: return emptyList()

        val daysInPhase = try {
            val start = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").apply {
                timeZone = java.util.TimeZone.getTimeZone("UTC")
            }.parse(startedAt)?.time ?: return emptyList()
            ((System.currentTimeMillis() - start) / 86400000).toInt()
        } catch (_: Exception) {
            return emptyList()
        }

        val recs = mutableListOf<Recommendation>()

        if (phase == Phase.VEGETATIVE && daysInPhase >= 42) {
            recs.add(Recommendation(
                id = UUID.randomUUID().toString(),
                plantId = plant.id,
                source = "rules",
                message = "${plant.name} has been in vegetative for $daysInPhase days — consider switching to flower (12/12 light cycle)",
                severity = "info",
            ))
        }

        if (phase == Phase.DRYING && daysInPhase >= 7) {
            recs.add(Recommendation(
                id = UUID.randomUUID().toString(),
                plantId = plant.id,
                source = "rules",
                message = "${plant.name} has been drying for $daysInPhase days — check the stem snap test to see if it's ready for curing",
                severity = "info",
            ))
        }

        return recs
    }

    /**
     * Evaluate a plant against its latest sensor reading and produce recommendations.
     *
     * @param plant The plant with configured thresholds.
     * @param reading The latest sensor reading for that plant.
     * @return A list of recommendations (may be empty if everything is OK).
     */
    fun evaluatePlant(plant: Plant, reading: SensorReading): List<Recommendation> {
        // Skip non-monitored phases
        val phase = Phase.fromValue(plant.currentPhase)
        if (phase != null && !phase.hasMonitoring) return emptyList()

        val thresholds = resolveThresholds(plant)
        val recs = mutableListOf<Recommendation>()

        // Moisture too low
        if (reading.moisture != null && reading.moisture < thresholds.moistureMin) {
            recs.add(
                Recommendation(
                    id = UUID.randomUUID().toString(),
                    plantId = plant.id,
                    source = "rules",
                    message = "${plant.name} needs water! Soil moisture at ${reading.moisture}% (minimum: ${thresholds.moistureMin}%)",
                    severity = if (reading.moisture < 20) "urgent" else "warning",
                )
            )
        }

        // Moisture too high
        if (reading.moisture != null && reading.moisture > thresholds.moistureMax) {
            recs.add(
                Recommendation(
                    id = UUID.randomUUID().toString(),
                    plantId = plant.id,
                    source = "rules",
                    message = "${plant.name} may be overwatered — moisture at ${reading.moisture}% (maximum: ${thresholds.moistureMax}%)",
                    severity = "warning",
                )
            )
        }

        // Temperature too low
        if (reading.temperature != null && reading.temperature < thresholds.tempMin) {
            recs.add(
                Recommendation(
                    id = UUID.randomUUID().toString(),
                    plantId = plant.id,
                    source = "rules",
                    message = "Too cold for ${plant.name}! Temperature at ${reading.temperature}\u00B0C (minimum: ${thresholds.tempMin}\u00B0C)",
                    severity = if (reading.temperature < thresholds.tempMin - 5) "urgent" else "warning",
                )
            )
        }

        // Temperature too high
        if (reading.temperature != null && reading.temperature > thresholds.tempMax) {
            recs.add(
                Recommendation(
                    id = UUID.randomUUID().toString(),
                    plantId = plant.id,
                    source = "rules",
                    message = "Too hot for ${plant.name}! Temperature at ${reading.temperature}\u00B0C (maximum: ${thresholds.tempMax}\u00B0C)",
                    severity = if (reading.temperature > thresholds.tempMax + 5) "urgent" else "warning",
                )
            )
        }

        // Low battery
        if (reading.battery != null && reading.battery < 15) {
            recs.add(
                Recommendation(
                    id = UUID.randomUUID().toString(),
                    plantId = plant.id,
                    source = "rules",
                    message = "Sensor battery low for ${plant.name} (${reading.battery}%) — charge soon",
                    severity = if (reading.battery < 5) "urgent" else "warning",
                )
            )
        }

        // High-light plant not getting enough light — only in growing phases or no phase
        if (reading.light != null && plant.lightPreference == "high" && reading.light < 1000) {
            if (phase == null || phase.isGrowing) {
                recs.add(
                    Recommendation(
                        id = UUID.randomUUID().toString(),
                        plantId = plant.id,
                        source = "rules",
                        message = "${plant.name} prefers bright light but only getting ${reading.light} lux — consider moving to a sunnier spot",
                        severity = "info",
                    )
                )
            }
        }

        // Add transition suggestions
        recs.addAll(getTransitionSuggestions(plant))

        return recs
    }

    // ---- Plant view helpers (ported from plant-view.ts) ----

    /**
     * Returns a human-readable label for a light level in lux.
     */
    fun getLightLabel(light: Int?): String {
        if (light == null) return "unknown"
        return when {
            light < 1000 -> "low"
            light <= 2000 -> "medium"
            else -> "high"
        }
    }

    /**
     * Compute a "health points" score (0-100) based on how close
     * moisture and temperature are to the midpoint of their ideal ranges.
     */
    fun computeHP(
        moisture: Int?,
        temp: Double?,
        moistureMin: Int,
        moistureMax: Int,
        tempMin: Double,
        tempMax: Double,
    ): Int {
        val scores = mutableListOf<Double>()

        if (moisture != null) {
            val mid = (moistureMin + moistureMax) / 2.0
            val half = (moistureMax - moistureMin) / 2.0
            if (half > 0) {
                val score = max(0.0, min(100.0, 100.0 - (abs(moisture - mid) / half) * 100.0))
                scores.add(score)
            } else {
                scores.add(if (moisture.toDouble() == mid) 100.0 else 0.0)
            }
        }

        if (temp != null) {
            val mid = (tempMin + tempMax) / 2.0
            val half = (tempMax - tempMin) / 2.0
            if (half > 0) {
                val score = max(0.0, min(100.0, 100.0 - (abs(temp - mid) / half) * 100.0))
                scores.add(score)
            } else {
                scores.add(if (temp == mid) 100.0 else 0.0)
            }
        }

        if (scores.isEmpty()) return 50
        return (scores.sum() / scores.size).roundToInt()
    }

    /**
     * Compute a plant status based on whether moisture and temperature
     * are within their configured ranges.
     */
    fun computeStatus(
        moisture: Int?,
        temp: Double?,
        moistureMin: Int,
        moistureMax: Int,
        tempMin: Double,
        tempMax: Double,
    ): String {
        if (moisture == null && temp == null) return "unknown"

        if (moisture != null && (moisture < moistureMin || moisture > moistureMax)) {
            return "thirsty"
        }
        if (temp != null && (temp < tempMin || temp > tempMax)) {
            return "thirsty"
        }

        return "happy"
    }
}
