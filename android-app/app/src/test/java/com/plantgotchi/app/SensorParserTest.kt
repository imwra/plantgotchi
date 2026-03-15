package com.plantgotchi.app

import com.plantgotchi.app.ble.SensorParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Unit tests for BLE sensor data parsing.
 */
class SensorParserTest {

    // ---- Moisture (uint16, little-endian) ----

    @Test
    fun `parseMoisture - 42 percent`() {
        // 0x2A = 42, 0x00 = high byte
        val data = byteArrayOf(0x2A, 0x00)
        assertEquals(42, SensorParser.parseMoisture(data))
    }

    @Test
    fun `parseMoisture - 0 percent`() {
        val data = byteArrayOf(0x00, 0x00)
        assertEquals(0, SensorParser.parseMoisture(data))
    }

    @Test
    fun `parseMoisture - 100 percent`() {
        val data = byteArrayOf(0x64, 0x00)
        assertEquals(100, SensorParser.parseMoisture(data))
    }

    @Test
    fun `parseMoisture - clamps to 100`() {
        // 0xC8 = 200 as uint16
        val data = byteArrayOf(0xC8.toByte(), 0x00)
        assertEquals(100, SensorParser.parseMoisture(data))
    }

    @Test
    fun `parseMoisture - empty data returns null`() {
        assertNull(SensorParser.parseMoisture(byteArrayOf()))
    }

    @Test
    fun `parseMoisture - single byte returns null`() {
        assertNull(SensorParser.parseMoisture(byteArrayOf(0x2A)))
    }

    // ---- Temperature (int16, little-endian, value/100) ----

    @Test
    fun `parseTemperature - 22 degrees`() {
        // 22.00°C = 2200 = 0x0898 -> little-endian: 0x98, 0x08
        val data = byteArrayOf(0x98.toByte(), 0x08)
        assertEquals(22.0, SensorParser.parseTemperature(data)!!, 0.01)
    }

    @Test
    fun `parseTemperature - 0 degrees`() {
        val data = byteArrayOf(0x00, 0x00)
        assertEquals(0.0, SensorParser.parseTemperature(data)!!, 0.01)
    }

    @Test
    fun `parseTemperature - negative 5 degrees`() {
        // -5.00°C = -500 = 0xFE0C -> little-endian: 0x0C, 0xFE
        val data = byteArrayOf(0x0C, 0xFE.toByte())
        assertEquals(-5.0, SensorParser.parseTemperature(data)!!, 0.01)
    }

    @Test
    fun `parseTemperature - 25_50 degrees`() {
        // 25.50°C = 2550 = 0x09F6 -> little-endian: 0xF6, 0x09
        val data = byteArrayOf(0xF6.toByte(), 0x09)
        assertEquals(25.5, SensorParser.parseTemperature(data)!!, 0.01)
    }

    @Test
    fun `parseTemperature - empty data returns null`() {
        assertNull(SensorParser.parseTemperature(byteArrayOf()))
    }

    // ---- Light (uint32, little-endian, lux) ----

    @Test
    fun `parseLight - 1500 lux`() {
        // 1500 = 0x000005DC -> little-endian: 0xDC, 0x05, 0x00, 0x00
        val data = byteArrayOf(0xDC.toByte(), 0x05, 0x00, 0x00)
        assertEquals(1500, SensorParser.parseLight(data))
    }

    @Test
    fun `parseLight - 0 lux`() {
        val data = byteArrayOf(0x00, 0x00, 0x00, 0x00)
        assertEquals(0, SensorParser.parseLight(data))
    }

    @Test
    fun `parseLight - 50000 lux`() {
        // 50000 = 0x0000C350 -> little-endian: 0x50, 0xC3, 0x00, 0x00
        val data = byteArrayOf(0x50, 0xC3.toByte(), 0x00, 0x00)
        assertEquals(50000, SensorParser.parseLight(data))
    }

    @Test
    fun `parseLight - too few bytes returns null`() {
        assertNull(SensorParser.parseLight(byteArrayOf(0x00, 0x00)))
    }

    // ---- Battery (uint8) ----

    @Test
    fun `parseBattery - 85 percent`() {
        val data = byteArrayOf(0x55)
        assertEquals(85, SensorParser.parseBattery(data))
    }

    @Test
    fun `parseBattery - 0 percent`() {
        val data = byteArrayOf(0x00)
        assertEquals(0, SensorParser.parseBattery(data))
    }

    @Test
    fun `parseBattery - 100 percent`() {
        val data = byteArrayOf(0x64)
        assertEquals(100, SensorParser.parseBattery(data))
    }

    @Test
    fun `parseBattery - clamps to 100`() {
        val data = byteArrayOf(0xFF.toByte())
        assertEquals(100, SensorParser.parseBattery(data))
    }

    @Test
    fun `parseBattery - empty data returns null`() {
        assertNull(SensorParser.parseBattery(byteArrayOf()))
    }
}
