package com.plantgotchi.app

import com.plantgotchi.app.agent.RuleEngine
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.SensorReading
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests for the offline rule engine.
 * Mirrors test cases from the web app's rules.ts.
 */
class RuleEngineTest {

    private fun makePlant(
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

    // ---- All OK ----

    @Test
    fun `all readings within range - no recommendations`() {
        val plant = makePlant()
        val reading = makeReading(moisture = 55, temperature = 22.0, light = 1500, battery = 80)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertTrue("Expected no recommendations but got ${recs.size}", recs.isEmpty())
    }

    // ---- Moisture too low (warning) ----

    @Test
    fun `moisture below min - warning`() {
        val plant = makePlant(moistureMin = 30)
        val reading = makeReading(moisture = 25)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertEquals(1, recs.size)
        assertEquals("warning", recs[0].severity)
        assertTrue(recs[0].message.contains("needs water"))
    }

    // ---- Moisture critically low (urgent) ----

    @Test
    fun `moisture below 20 - urgent`() {
        val plant = makePlant(moistureMin = 30)
        val reading = makeReading(moisture = 15)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertEquals(1, recs.size)
        assertEquals("urgent", recs[0].severity)
    }

    // ---- Moisture too high (warning) ----

    @Test
    fun `moisture above max - warning`() {
        val plant = makePlant(moistureMax = 80)
        val reading = makeReading(moisture = 90)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertEquals(1, recs.size)
        assertEquals("warning", recs[0].severity)
        assertTrue(recs[0].message.contains("overwatered"))
    }

    // ---- Temperature too low (warning) ----

    @Test
    fun `temp below min - warning`() {
        val plant = makePlant(tempMin = 15.0)
        val reading = makeReading(temperature = 12.0)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertEquals(1, recs.size)
        assertEquals("warning", recs[0].severity)
        assertTrue(recs[0].message.contains("Too cold"))
    }

    // ---- Temperature critically low (urgent) ----

    @Test
    fun `temp below min minus 5 - urgent`() {
        val plant = makePlant(tempMin = 15.0)
        val reading = makeReading(temperature = 8.0)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertEquals(1, recs.size)
        assertEquals("urgent", recs[0].severity)
    }

    // ---- Temperature too high (warning) ----

    @Test
    fun `temp above max - warning`() {
        val plant = makePlant(tempMax = 30.0)
        val reading = makeReading(temperature = 33.0)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertEquals(1, recs.size)
        assertEquals("warning", recs[0].severity)
        assertTrue(recs[0].message.contains("Too hot"))
    }

    // ---- Temperature critically high (urgent) ----

    @Test
    fun `temp above max plus 5 - urgent`() {
        val plant = makePlant(tempMax = 30.0)
        val reading = makeReading(temperature = 36.0)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertEquals(1, recs.size)
        assertEquals("urgent", recs[0].severity)
    }

    // ---- Low battery (warning) ----

    @Test
    fun `battery below 15 - warning`() {
        val plant = makePlant()
        val reading = makeReading(moisture = 55, temperature = 22.0, battery = 10)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertEquals(1, recs.size)
        assertEquals("warning", recs[0].severity)
        assertTrue(recs[0].message.contains("battery low"))
    }

    // ---- Critically low battery (urgent) ----

    @Test
    fun `battery below 5 - urgent`() {
        val plant = makePlant()
        val reading = makeReading(moisture = 55, temperature = 22.0, battery = 3)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertEquals(1, recs.size)
        assertEquals("urgent", recs[0].severity)
    }

    // ---- High-light plant with low light (info) ----

    @Test
    fun `high light plant with low light - info`() {
        val plant = makePlant(lightPreference = "high")
        val reading = makeReading(moisture = 55, temperature = 22.0, light = 500)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertEquals(1, recs.size)
        assertEquals("info", recs[0].severity)
        assertTrue(recs[0].message.contains("bright light"))
    }

    // ---- Medium-light plant with low light - no recommendation ----

    @Test
    fun `medium light plant with low light - no recommendation`() {
        val plant = makePlant(lightPreference = "medium")
        val reading = makeReading(moisture = 55, temperature = 22.0, light = 500)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertTrue(recs.isEmpty())
    }

    // ---- Multiple issues ----

    @Test
    fun `multiple issues produces multiple recommendations`() {
        val plant = makePlant(moistureMin = 30, tempMax = 30.0, lightPreference = "high")
        val reading = makeReading(moisture = 10, temperature = 40.0, light = 200, battery = 3)
        val recs = RuleEngine.evaluatePlant(plant, reading)
        // Low moisture (urgent) + high temp (urgent) + low battery (urgent) + low light (info)
        assertEquals(4, recs.size)
    }

    // ---- Null readings produce no recommendations ----

    @Test
    fun `null readings - no recommendations`() {
        val plant = makePlant()
        val reading = makeReading()
        val recs = RuleEngine.evaluatePlant(plant, reading)
        assertTrue(recs.isEmpty())
    }
}
