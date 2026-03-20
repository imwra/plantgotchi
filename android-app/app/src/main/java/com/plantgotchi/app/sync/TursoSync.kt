package com.plantgotchi.app.sync

import com.plantgotchi.app.analytics.Analytics
import com.plantgotchi.app.analytics.LogLevel
import com.plantgotchi.app.model.CareLog
import com.plantgotchi.app.model.GrowLog
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.Recommendation
import com.plantgotchi.app.model.SensorReading
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.serialization.json.*

class TursoSync(
    private val baseURL: String,
    private val httpClient: HttpClient,
) {
    private val json = Json { ignoreUnknownKeys = true }

    // MARK: - Push Operations

    suspend fun pushReadings(readings: List<SensorReading>) {
        val start = System.currentTimeMillis()
        Analytics.log(LogLevel.INFO, "Sync push started", mapOf("method" to "pushReadings"))
        Analytics.track("sync_started", mapOf("direction" to "push"))
        try {
            for (reading in readings) {
                val response = httpClient.post("$baseURL/api/readings") {
                    contentType(ContentType.Application.Json)
                    setBody(buildJsonObject {
                        put("plant_id", reading.plantId)
                        put("sensor_id", reading.sensorId)
                        reading.moisture?.let { put("moisture", it) }
                        reading.temperature?.let { put("temperature", it) }
                        reading.light?.let { put("light", it) }
                        reading.battery?.let { put("battery", it) }
                    }.toString())
                }
                if (response.status != HttpStatusCode.OK && response.status != HttpStatusCode.Created) {
                    throw TursoSyncException("Push reading failed: HTTP ${response.status.value}")
                }
            }
            val duration = System.currentTimeMillis() - start
            Analytics.track("sync_completed", mapOf("direction" to "push", "item_count" to readings.size, "duration_ms" to duration))
        } catch (e: Exception) {
            Analytics.track("sync_failed", mapOf("direction" to "push", "error" to (e.message ?: "")))
            Analytics.captureException(e, mapOf("operation" to "pushReadings"))
            Analytics.log(LogLevel.ERROR, "Sync push failed", mapOf("method" to "pushReadings", "error" to (e.message ?: "")))
            throw e
        }
    }

    suspend fun pushCareLogs(logs: List<CareLog>) {
        val start = System.currentTimeMillis()
        Analytics.log(LogLevel.INFO, "Sync push started", mapOf("method" to "pushCareLogs"))
        Analytics.track("sync_started", mapOf("direction" to "push"))
        try {
            for (log in logs) {
                val response = httpClient.post("$baseURL/api/care-logs") {
                    contentType(ContentType.Application.Json)
                    setBody(buildJsonObject {
                        put("plant_id", log.plantId)
                        put("action", log.action)
                        log.notes?.let { put("notes", it) }
                    }.toString())
                }
                if (response.status != HttpStatusCode.OK && response.status != HttpStatusCode.Created) {
                    throw TursoSyncException("Push care log failed: HTTP ${response.status.value}")
                }
            }
            val duration = System.currentTimeMillis() - start
            Analytics.track("sync_completed", mapOf("direction" to "push", "item_count" to logs.size, "duration_ms" to duration))
        } catch (e: Exception) {
            Analytics.track("sync_failed", mapOf("direction" to "push", "error" to (e.message ?: "")))
            Analytics.captureException(e, mapOf("operation" to "pushCareLogs"))
            Analytics.log(LogLevel.ERROR, "Sync push failed", mapOf("method" to "pushCareLogs", "error" to (e.message ?: "")))
            throw e
        }
    }

    // MARK: - Pull Operations

    suspend fun pullPlants(userId: String): List<Plant> {
        val start = System.currentTimeMillis()
        Analytics.log(LogLevel.INFO, "Sync pull started", mapOf("method" to "pullPlants"))
        Analytics.track("sync_started", mapOf("direction" to "pull"))
        try {
            val response = httpClient.get("$baseURL/api/plants") {
                parameter("user_id", userId)
            }
            if (response.status != HttpStatusCode.OK) return emptyList()

            val body = response.bodyAsText()
            val arr = json.parseToJsonElement(body).jsonArray
            val result = arr.mapNotNull { parsePlant(it.jsonObject) }
            val duration = System.currentTimeMillis() - start
            Analytics.track("sync_completed", mapOf("direction" to "pull", "item_count" to result.size, "duration_ms" to duration))
            return result
        } catch (e: Exception) {
            Analytics.track("sync_failed", mapOf("direction" to "pull", "error" to (e.message ?: "")))
            Analytics.captureException(e, mapOf("operation" to "pullPlants"))
            Analytics.log(LogLevel.ERROR, "Sync pull failed", mapOf("method" to "pullPlants", "error" to (e.message ?: "")))
            throw e
        }
    }

    suspend fun pullRecommendations(plantId: String): List<Recommendation> {
        val start = System.currentTimeMillis()
        Analytics.log(LogLevel.INFO, "Sync pull started", mapOf("method" to "pullRecommendations"))
        Analytics.track("sync_started", mapOf("direction" to "pull"))
        try {
            val response = httpClient.get("$baseURL/api/recommendations") {
                parameter("plant_id", plantId)
            }
            if (response.status != HttpStatusCode.OK) return emptyList()

            val body = response.bodyAsText()
            val arr = json.parseToJsonElement(body).jsonArray
            val result = arr.mapNotNull { parseRecommendation(it.jsonObject) }
            val duration = System.currentTimeMillis() - start
            Analytics.track("sync_completed", mapOf("direction" to "pull", "item_count" to result.size, "duration_ms" to duration))
            return result
        } catch (e: Exception) {
            Analytics.track("sync_failed", mapOf("direction" to "pull", "error" to (e.message ?: "")))
            Analytics.captureException(e, mapOf("operation" to "pullRecommendations"))
            Analytics.log(LogLevel.ERROR, "Sync pull failed", mapOf("method" to "pullRecommendations", "error" to (e.message ?: "")))
            throw e
        }
    }

    // MARK: - Parsing

    private fun parsePlant(obj: JsonObject): Plant? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val userId = obj["user_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val name = obj["name"]?.jsonPrimitive?.contentOrNull ?: return null

        return Plant(
            id = id,
            userId = userId,
            name = name,
            species = obj["species"]?.jsonPrimitive?.contentOrNull,
            emoji = obj["emoji"]?.jsonPrimitive?.contentOrNull ?: "\uD83C\uDF31",
            photoUrl = obj["photo_url"]?.jsonPrimitive?.contentOrNull,
            moistureMin = obj["moisture_min"]?.jsonPrimitive?.intOrNull ?: 30,
            moistureMax = obj["moisture_max"]?.jsonPrimitive?.intOrNull ?: 80,
            tempMin = obj["temp_min"]?.jsonPrimitive?.doubleOrNull ?: 15.0,
            tempMax = obj["temp_max"]?.jsonPrimitive?.doubleOrNull ?: 30.0,
            lightPreference = obj["light_preference"]?.jsonPrimitive?.contentOrNull ?: "medium",
            // Lifecycle fields
            plantType = obj["plant_type"]?.jsonPrimitive?.contentOrNull,
            strainId = obj["strain_id"]?.jsonPrimitive?.contentOrNull,
            strainName = obj["strain_name"]?.jsonPrimitive?.contentOrNull,
            strainType = obj["strain_type"]?.jsonPrimitive?.contentOrNull,
            environment = obj["environment"]?.jsonPrimitive?.contentOrNull,
            currentPhase = obj["current_phase"]?.jsonPrimitive?.contentOrNull,
            phaseStartedAt = obj["phase_started_at"]?.jsonPrimitive?.contentOrNull,
            growId = obj["grow_id"]?.jsonPrimitive?.contentOrNull,
        )
    }

    private fun parseRecommendation(obj: JsonObject): Recommendation? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val plantId = obj["plant_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val source = obj["source"]?.jsonPrimitive?.contentOrNull ?: return null
        val message = obj["message"]?.jsonPrimitive?.contentOrNull ?: return null

        return Recommendation(
            id = id,
            plantId = plantId,
            source = source,
            message = message,
            severity = obj["severity"]?.jsonPrimitive?.contentOrNull ?: "info",
            actedOn = obj["acted_on"]?.jsonPrimitive?.booleanOrNull ?: false,
        )
    }
    suspend fun pullGrowLogs(plantId: String): List<GrowLog> {
        try {
            val response = httpClient.get("$baseURL/api/grow-logs") {
                parameter("plantId", plantId)
            }
            if (response.status != HttpStatusCode.OK) return emptyList()

            val body = response.bodyAsText()
            val arr = json.parseToJsonElement(body).jsonArray
            return arr.mapNotNull { parseGrowLog(it.jsonObject) }
        } catch (e: Exception) {
            Analytics.captureException(e, mapOf("operation" to "pullGrowLogs"))
            return emptyList()
        }
    }

    suspend fun pushGrowLog(log: GrowLog) {
        try {
            val response = httpClient.post("$baseURL/api/grow-logs") {
                contentType(ContentType.Application.Json)
                setBody(buildJsonObject {
                    put("plant_id", log.plantId)
                    put("phase", log.phase)
                    put("log_type", log.logType)
                    log.data?.let { put("data", json.parseToJsonElement(it)) }
                    log.photoUrl?.let { put("photo_url", it) }
                    log.notes?.let { put("notes", it) }
                }.toString())
            }
            if (response.status != HttpStatusCode.OK && response.status != HttpStatusCode.Created) {
                throw TursoSyncException("Push grow log failed: HTTP ${response.status.value}")
            }
        } catch (e: Exception) {
            Analytics.captureException(e, mapOf("operation" to "pushGrowLog"))
            throw e
        }
    }

    private fun parseGrowLog(obj: JsonObject): GrowLog? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val plantId = obj["plant_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val userId = obj["user_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val phase = obj["phase"]?.jsonPrimitive?.contentOrNull ?: return null
        val logType = obj["log_type"]?.jsonPrimitive?.contentOrNull ?: return null

        return GrowLog(
            id = id,
            plantId = plantId,
            userId = userId,
            phase = phase,
            logType = logType,
            data = obj["data"]?.toString(),
            photoUrl = obj["photo_url"]?.jsonPrimitive?.contentOrNull,
            notes = obj["notes"]?.jsonPrimitive?.contentOrNull,
            createdAt = obj["created_at"]?.jsonPrimitive?.contentOrNull,
        )
    }
}

class TursoSyncException(message: String) : Exception(message)
