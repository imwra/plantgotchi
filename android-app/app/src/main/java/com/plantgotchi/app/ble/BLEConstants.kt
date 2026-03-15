package com.plantgotchi.app.ble

import java.util.UUID

/**
 * BLE GATT UUIDs for Plantgotchi sensors.
 *
 * Sensors are dumb BLE peripherals — the phone acts as the smart node.
 */
object BLEConstants {

    /** Plantgotchi sensor service UUID. */
    val SERVICE_UUID: UUID =
        UUID.fromString("0000FE00-0000-1000-8000-00805F9B34FB")

    /** Soil moisture characteristic — uint16, Read+Notify, percentage. */
    val CHAR_MOISTURE: UUID =
        UUID.fromString("0000FE01-0000-1000-8000-00805F9B34FB")

    /** Temperature characteristic — int16, Read+Notify, degrees C * 100. */
    val CHAR_TEMPERATURE: UUID =
        UUID.fromString("0000FE02-0000-1000-8000-00805F9B34FB")

    /** Light characteristic — uint32, Read+Notify, lux. */
    val CHAR_LIGHT: UUID =
        UUID.fromString("0000FE03-0000-1000-8000-00805F9B34FB")

    /** Battery characteristic — uint8, Read+Notify, percentage. */
    val CHAR_BATTERY: UUID =
        UUID.fromString("0000FE04-0000-1000-8000-00805F9B34FB")

    /** Config characteristic — Read+Write, device configuration. */
    val CHAR_CONFIG: UUID =
        UUID.fromString("0000FE05-0000-1000-8000-00805F9B34FB")

    /** Standard Device Information Service UUID. */
    val DEVICE_INFO_SERVICE: UUID =
        UUID.fromString("0000180A-0000-1000-8000-00805F9B34FB")

    /** All sensor characteristic UUIDs for notification subscription. */
    val SENSOR_CHARACTERISTICS: List<UUID> = listOf(
        CHAR_MOISTURE,
        CHAR_TEMPERATURE,
        CHAR_LIGHT,
        CHAR_BATTERY,
    )
}
