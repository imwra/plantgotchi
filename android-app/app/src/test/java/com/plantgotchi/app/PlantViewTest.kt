package com.plantgotchi.app

import com.plantgotchi.app.agent.RuleEngine
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Unit tests for plant view helpers: computeHP, computeStatus, getLightLabel.
 * Mirrors test cases from the web app's plant-view.ts.
 */
class PlantViewTest {

    // ---- getLightLabel ----

    @Test
    fun `getLightLabel - null returns unknown`() {
        assertEquals("unknown", RuleEngine.getLightLabel(null))
    }

    @Test
    fun `getLightLabel - 0 lux is low`() {
        assertEquals("low", RuleEngine.getLightLabel(0))
    }

    @Test
    fun `getLightLabel - 500 lux is low`() {
        assertEquals("low", RuleEngine.getLightLabel(500))
    }

    @Test
    fun `getLightLabel - 999 lux is low`() {
        assertEquals("low", RuleEngine.getLightLabel(999))
    }

    @Test
    fun `getLightLabel - 1000 lux is medium`() {
        assertEquals("medium", RuleEngine.getLightLabel(1000))
    }

    @Test
    fun `getLightLabel - 1500 lux is medium`() {
        assertEquals("medium", RuleEngine.getLightLabel(1500))
    }

    @Test
    fun `getLightLabel - 2000 lux is medium`() {
        assertEquals("medium", RuleEngine.getLightLabel(2000))
    }

    @Test
    fun `getLightLabel - 2001 lux is high`() {
        assertEquals("high", RuleEngine.getLightLabel(2001))
    }

    @Test
    fun `getLightLabel - 50000 lux is high`() {
        assertEquals("high", RuleEngine.getLightLabel(50000))
    }

    // ---- computeHP ----

    @Test
    fun `computeHP - perfect midpoint scores 100`() {
        // moisture mid = (30+80)/2 = 55, temp mid = (15+30)/2 = 22.5
        val hp = RuleEngine.computeHP(55, 22.5, 30, 80, 15.0, 30.0)
        assertEquals(100, hp)
    }

    @Test
    fun `computeHP - both null returns 50`() {
        val hp = RuleEngine.computeHP(null, null, 30, 80, 15.0, 30.0)
        assertEquals(50, hp)
    }

    @Test
    fun `computeHP - at minimum boundary scores 0`() {
        val hp = RuleEngine.computeHP(30, 15.0, 30, 80, 15.0, 30.0)
        assertEquals(0, hp)
    }

    @Test
    fun `computeHP - at maximum boundary scores 0`() {
        val hp = RuleEngine.computeHP(80, 30.0, 30, 80, 15.0, 30.0)
        assertEquals(0, hp)
    }

    @Test
    fun `computeHP - only moisture provided`() {
        val hp = RuleEngine.computeHP(55, null, 30, 80, 15.0, 30.0)
        assertEquals(100, hp)
    }

    @Test
    fun `computeHP - only temp provided`() {
        val hp = RuleEngine.computeHP(null, 22.5, 30, 80, 15.0, 30.0)
        assertEquals(100, hp)
    }

    @Test
    fun `computeHP - well outside range clamps to 0`() {
        val hp = RuleEngine.computeHP(0, 0.0, 30, 80, 15.0, 30.0)
        assertEquals(0, hp)
    }

    // ---- computeStatus ----

    @Test
    fun `computeStatus - both null returns unknown`() {
        assertEquals("unknown", RuleEngine.computeStatus(null, null, 30, 80, 15.0, 30.0))
    }

    @Test
    fun `computeStatus - within range returns happy`() {
        assertEquals("happy", RuleEngine.computeStatus(55, 22.0, 30, 80, 15.0, 30.0))
    }

    @Test
    fun `computeStatus - moisture below min returns thirsty`() {
        assertEquals("thirsty", RuleEngine.computeStatus(20, 22.0, 30, 80, 15.0, 30.0))
    }

    @Test
    fun `computeStatus - moisture above max returns thirsty`() {
        assertEquals("thirsty", RuleEngine.computeStatus(90, 22.0, 30, 80, 15.0, 30.0))
    }

    @Test
    fun `computeStatus - temp below min returns thirsty`() {
        assertEquals("thirsty", RuleEngine.computeStatus(55, 10.0, 30, 80, 15.0, 30.0))
    }

    @Test
    fun `computeStatus - temp above max returns thirsty`() {
        assertEquals("thirsty", RuleEngine.computeStatus(55, 35.0, 30, 80, 15.0, 30.0))
    }

    @Test
    fun `computeStatus - moisture at exact min is happy`() {
        assertEquals("happy", RuleEngine.computeStatus(30, 22.0, 30, 80, 15.0, 30.0))
    }

    @Test
    fun `computeStatus - moisture at exact max is happy`() {
        assertEquals("happy", RuleEngine.computeStatus(80, 22.0, 30, 80, 15.0, 30.0))
    }

    @Test
    fun `computeStatus - only moisture in range returns happy`() {
        assertEquals("happy", RuleEngine.computeStatus(55, null, 30, 80, 15.0, 30.0))
    }

    @Test
    fun `computeStatus - only temp in range returns happy`() {
        assertEquals("happy", RuleEngine.computeStatus(null, 22.0, 30, 80, 15.0, 30.0))
    }
}
