package com.plantgotchi.app.sync

import com.plantgotchi.app.model.CareLog
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
    }

    suspend fun pushCareLogs(logs: List<CareLog>) {
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
    }

    // MARK: - Pull Operations

    suspend fun pullPlants(userId: String): List<Plant> {
        val response = httpClient.get("$baseURL/api/plants") {
            parameter("user_id", userId)
        }
        if (response.status != HttpStatusCode.OK) return emptyList()

        val body = response.bodyAsText()
        val arr = json.parseToJsonElement(body).jsonArray
        return arr.mapNotNull { parsePlant(it.jsonObject) }
    }

    suspend fun pullRecommendations(plantId: String): List<Recommendation> {
        val response = httpClient.get("$baseURL/api/recommendations") {
            parameter("plant_id", plantId)
        }
        if (response.status != HttpStatusCode.OK) return emptyList()

        val body = response.bodyAsText()
        val arr = json.parseToJsonElement(body).jsonArray
        return arr.mapNotNull { parseRecommendation(it.jsonObject) }
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
}

class TursoSyncException(message: String) : Exception(message)
