package com.plantgotchi.app

import com.plantgotchi.app.model.Phase
import com.plantgotchi.app.model.GrowLogType
import org.junit.Assert.*
import org.junit.Test

class PhaseTest {

    @Test
    fun `phase order has 8 phases`() {
        assertEquals(8, Phase.entries.size)
    }

    @Test
    fun `nextPhase transitions correctly`() {
        assertEquals(Phase.SEEDLING, Phase.GERMINATION.nextPhase)
        assertEquals(Phase.DRYING, Phase.FLOWERING.nextPhase)
        assertNull(Phase.COMPLETE.nextPhase)
    }

    @Test
    fun `isGrowing true only for veg and flower`() {
        assertTrue(Phase.VEGETATIVE.isGrowing)
        assertTrue(Phase.FLOWERING.isGrowing)
        assertFalse(Phase.DRYING.isGrowing)
        assertFalse(Phase.COMPLETE.isGrowing)
        assertFalse(Phase.GERMINATION.isGrowing)
    }

    @Test
    fun `hasMonitoring false only for complete`() {
        assertTrue(Phase.GERMINATION.hasMonitoring)
        assertTrue(Phase.DRYING.hasMonitoring)
        assertFalse(Phase.COMPLETE.hasMonitoring)
    }

    @Test
    fun `phase defaults exist for all monitored phases`() {
        Phase.entries.filter { it.hasMonitoring }.forEach { phase ->
            val defaults = phase.defaults
            assertNotNull("${phase.name} should have defaults", defaults)
            assertTrue(defaults!!.tempMin < defaults.tempMax)
        }
    }

    @Test
    fun `complete phase has no defaults`() {
        assertNull(Phase.COMPLETE.defaults)
    }

    @Test
    fun `vegetative allows training actions`() {
        val actions = Phase.VEGETATIVE.availableActions
        assertTrue(actions.contains(GrowLogType.TOPPING))
        assertTrue(actions.contains(GrowLogType.LST))
        assertTrue(actions.contains(GrowLogType.DEFOLIATION))
        assertFalse(actions.contains(GrowLogType.HARVEST))
        assertFalse(actions.contains(GrowLogType.DRY_CHECK))
    }

    @Test
    fun `flowering allows harvest`() {
        val actions = Phase.FLOWERING.availableActions
        assertTrue(actions.contains(GrowLogType.HARVEST))
        assertTrue(actions.contains(GrowLogType.TRICHOME_CHECK))
        assertTrue(actions.contains(GrowLogType.WATERING))
    }

    @Test
    fun `drying restricts to post-harvest actions`() {
        val actions = Phase.DRYING.availableActions
        assertTrue(actions.contains(GrowLogType.DRY_CHECK))
        assertTrue(actions.contains(GrowLogType.NOTE))
        assertFalse(actions.contains(GrowLogType.WATERING))
        assertFalse(actions.contains(GrowLogType.TOPPING))
    }
}
