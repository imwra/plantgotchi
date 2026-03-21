package com.plantgotchi.app

import com.plantgotchi.app.agent.RuleEngine
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.SensorReading
import org.junit.Assert.*
import org.junit.Test

class PhaseAwareRuleEngineTest {

    private fun makePlant(
        currentPhase: String? = null,
        phaseStartedAt: String? = null,
        moistureMin: Int = 30,
        moistureMax: Int = 80,
        tempMin: Double = 15.0,
        tempMax: Double = 30.0,
        lightPreference: String = "medium",
    ) = Plant(
        id = "test-plant",
        userId = "test-user",
        name = "Test Plant",
        moistureMin = moistureMin,
        moistureMax = moistureMax,
        tempMin = tempMin,
        tempMax = tempMax,
        lightPreference = lightPreference,
        currentPhase = currentPhase,
        phaseStartedAt = phaseStartedAt,
    )

    private fun makeReading(
        moisture: Int? = null,
        temperature: Double? = null,
        light: Int? = null,
        battery: Int? = null,
    ) = SensorReading(
        plantId = "test-plant",
        sensorId = "sensor-1",
        moisture = moisture,
        temperature = temperature,
        light = light,
        battery = battery,
    )

    @Test
    fun `resolveThresholds uses plant-level when no phase`() {
        val plant = makePlant()
        val t = RuleEngine.resolveThresholds(plant)
        assertEquals(15.0, t.tempMin, 0.01)
        assertEquals(30.0, t.tempMax, 0.01)
    }

    @Test
    fun `resolveThresholds uses phase defaults for flowering`() {
        val plant = makePlant(currentPhase = "flowering")
        val t = RuleEngine.resolveThresholds(plant)
        assertEquals(18.0, t.tempMin, 0.01)
        assertEquals(26.0, t.tempMax, 0.01)
    }

    @Test
    fun `resolveThresholds always uses plant moisture`() {
        val plant = makePlant(currentPhase = "vegetative", moistureMin = 40, moistureMax = 70)
        val t = RuleEngine.resolveThresholds(plant)
        assertEquals(40, t.moistureMin)
        assertEquals(70, t.moistureMax)
    }

    @Test
    fun `evaluatePlant skips complete phase`() {
        val plant = makePlant(currentPhase = "complete")
        val reading = makeReading(moisture = 5, temperature = 50.0)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertTrue(recs.isEmpty())
    }

    @Test
    fun `evaluatePlant uses phase thresholds for flowering`() {
        val plant = makePlant(currentPhase = "flowering")
        // Flowering max is 26, so 28 triggers warning
        val reading = makeReading(temperature = 28.0)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertTrue(recs.any { it.message.contains("Too hot") })
    }

    @Test
    fun `evaluatePlant backward compat no phase`() {
        val plant = makePlant(tempMax = 30.0)
        val reading = makeReading(temperature = 32.0)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertTrue(recs.any { it.message.contains("Too hot") })
    }

    @Test
    fun `getTransitionSuggestions veg 43 days`() {
        val fortyThreeDaysAgo = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }.format(java.util.Date(System.currentTimeMillis() - 43L * 86400000))
        val plant = makePlant(currentPhase = "vegetative", phaseStartedAt = fortyThreeDaysAgo)
        val suggestions = RuleEngine.getTransitionSuggestions(plant)
        assertTrue(suggestions.isNotEmpty())
        assertTrue(suggestions[0].message.contains("flower", ignoreCase = true))
    }

    @Test
    fun `getTransitionSuggestions empty when no phase`() {
        val plant = makePlant()
        val suggestions = RuleEngine.getTransitionSuggestions(plant)
        assertTrue(suggestions.isEmpty())
    }
}
