package com.plantgotchi.app.agent

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

    /**
     * Evaluate a plant against its latest sensor reading and produce recommendations.
     *
     * @param plant The plant with configured thresholds.
     * @param reading The latest sensor reading for that plant.
     * @return A list of recommendations (may be empty if everything is OK).
     */
    fun evaluatePlant(plant: Plant, reading: SensorReading): List<Recommendation> {
        val recs = mutableListOf<Recommendation>()

        // Moisture too low
        if (reading.moisture != null && reading.moisture < plant.moistureMin) {
            recs.add(
                Recommendation(
                    id = UUID.randomUUID().toString(),
                    plantId = plant.id,
                    source = "rules",
                    message = "${plant.name} needs water! Soil moisture at ${reading.moisture}% (minimum: ${plant.moistureMin}%)",
                    severity = if (reading.moisture < 20) "urgent" else "warning",
                )
            )
        }

        // Moisture too high
        if (reading.moisture != null && reading.moisture > plant.moistureMax) {
            recs.add(
                Recommendation(
                    id = UUID.randomUUID().toString(),
                    plantId = plant.id,
                    source = "rules",
                    message = "${plant.name} may be overwatered — moisture at ${reading.moisture}% (maximum: ${plant.moistureMax}%)",
                    severity = "warning",
                )
            )
        }

        // Temperature too low
        if (reading.temperature != null && reading.temperature < plant.tempMin) {
            recs.add(
                Recommendation(
                    id = UUID.randomUUID().toString(),
                    plantId = plant.id,
                    source = "rules",
                    message = "Too cold for ${plant.name}! Temperature at ${reading.temperature}\u00B0C (minimum: ${plant.tempMin}\u00B0C)",
                    severity = if (reading.temperature < plant.tempMin - 5) "urgent" else "warning",
                )
            )
        }

        // Temperature too high
        if (reading.temperature != null && reading.temperature > plant.tempMax) {
            recs.add(
                Recommendation(
                    id = UUID.randomUUID().toString(),
                    plantId = plant.id,
                    source = "rules",
                    message = "Too hot for ${plant.name}! Temperature at ${reading.temperature}\u00B0C (maximum: ${plant.tempMax}\u00B0C)",
                    severity = if (reading.temperature > plant.tempMax + 5) "urgent" else "warning",
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

        // High-light plant not getting enough light
        if (reading.light != null && plant.lightPreference == "high" && reading.light < 1000) {
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
