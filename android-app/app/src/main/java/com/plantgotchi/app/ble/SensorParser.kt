package com.plantgotchi.app.ble

import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Parses raw BLE characteristic byte arrays into sensor values.
 *
 * All multi-byte values are little-endian per BLE GATT convention.
 */
object SensorParser {

    /**
     * Parse moisture from a 2-byte uint16 value.
     * @return moisture percentage (0-100), or null if data is invalid.
     */
    fun parseMoisture(data: ByteArray): Int? {
        if (data.size < 2) return null
        val value = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN).short.toInt() and 0xFFFF
        return value.coerceIn(0, 100)
    }

    /**
     * Parse temperature from a 2-byte int16 value (degrees C * 100).
     * @return temperature in degrees Celsius, or null if data is invalid.
     */
    fun parseTemperature(data: ByteArray): Double? {
        if (data.size < 2) return null
        val raw = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN).short.toInt()
        return raw / 100.0
    }

    /**
     * Parse light from a 4-byte uint32 value.
     * @return light level in lux, or null if data is invalid.
     */
    fun parseLight(data: ByteArray): Int? {
        if (data.size < 4) return null
        val value = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN).int.toLong() and 0xFFFFFFFFL
        return value.toInt()
    }

    /**
     * Parse battery from a 1-byte uint8 value.
     * @return battery percentage (0-100), or null if data is invalid.
     */
    fun parseBattery(data: ByteArray): Int? {
        if (data.isEmpty()) return null
        val value = data[0].toInt() and 0xFF
        return value.coerceIn(0, 100)
    }
}
