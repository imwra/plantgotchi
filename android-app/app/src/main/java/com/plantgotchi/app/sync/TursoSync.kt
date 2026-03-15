package com.plantgotchi.app.sync

import com.plantgotchi.app.model.CareLog
import com.plantgotchi.app.model.Plant
import com.plantgotchi.app.model.Recommendation
import com.plantgotchi.app.model.SensorReading
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.headers
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.double
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.int
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long
import kotlinx.serialization.json.longOrNull

/**
 * HTTP sync client for Turso cloud database.
 *
 * Uses the Turso HTTP Pipeline API (`POST /v2/pipeline`) to push
 * local sensor data and pull plant definitions from the cloud.
 */
class TursoSync(
    private val tursoUrl: String,
    private val authToken: String,
) {

    private val client = HttpClient(OkHttp) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                encodeDefaults = true
            })
        }
    }

    private val pipelineUrl: String
        get() = "${tursoUrl.trimEnd('/')}/v2/pipeline"

    // ---- Request / Response models ----

    @Serializable
    data class PipelineRequest(val requests: List<StreamRequest>)

    @Serializable
    data class StreamRequest(val type: String, val stmt: Statement? = null)

    @Serializable
    data class Statement(val sql: String, val args: List<StmtArg>? = null)

    @Serializable
    data class StmtArg(val type: String, val value: String?)

    // ---- Push operations ----

    /**
     * Push sensor readings to Turso cloud.
     */
    suspend fun pushReadings(readings: List<SensorReading>) {
        if (readings.isEmpty()) return

        val requests = readings.map { reading ->
            StreamRequest(
                type = "execute",
                stmt = Statement(
                    sql = """
                        INSERT OR IGNORE INTO sensor_readings
                        (plant_id, sensor_id, moisture, temperature, light, battery, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """.trimIndent(),
                    args = listOf(
                        StmtArg("text", reading.plantId),
                        StmtArg("text", reading.sensorId),
                        StmtArg("integer", reading.moisture?.toString()),
                        StmtArg("float", reading.temperature?.toString()),
                        StmtArg("integer", reading.light?.toString()),
                        StmtArg("integer", reading.battery?.toString()),
                        StmtArg("text", reading.timestamp),
                    )
                )
            )
        }

        executePipeline(requests)
    }

    /**
     * Push care logs to Turso cloud.
     */
    suspend fun pushCareLogs(careLogs: List<CareLog>) {
        if (careLogs.isEmpty()) return

        val requests = careLogs.map { log ->
            StreamRequest(
                type = "execute",
                stmt = Statement(
                    sql = """
                        INSERT OR IGNORE INTO care_logs
                        (id, plant_id, user_id, action, notes, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """.trimIndent(),
                    args = listOf(
                        StmtArg("text", log.id),
                        StmtArg("text", log.plantId),
                        StmtArg("text", log.userId),
                        StmtArg("text", log.action),
                        StmtArg("text", log.notes),
                        StmtArg("text", log.createdAt),
                    )
                )
            )
        }

        executePipeline(requests)
    }

    // ---- Pull operations ----

    /**
     * Pull plants for a user from Turso cloud.
     */
    suspend fun pullPlants(userId: String): List<Plant> {
        val requests = listOf(
            StreamRequest(
                type = "execute",
                stmt = Statement(
                    sql = "SELECT * FROM plants WHERE user_id = ? ORDER BY name",
                    args = listOf(StmtArg("text", userId))
                )
            )
        )

        val response = executePipeline(requests)
        return parseRows(response) { cols, row ->
            Plant(
                id = getStringCol(cols, row, "id") ?: "",
                userId = getStringCol(cols, row, "user_id") ?: "",
                name = getStringCol(cols, row, "name") ?: "",
                species = getStringCol(cols, row, "species"),
                emoji = getStringCol(cols, row, "emoji") ?: "\uD83C\uDF31",
                photoUrl = getStringCol(cols, row, "photo_url"),
                moistureMin = getIntCol(cols, row, "moisture_min") ?: 30,
                moistureMax = getIntCol(cols, row, "moisture_max") ?: 80,
                tempMin = getDoubleCol(cols, row, "temp_min") ?: 15.0,
                tempMax = getDoubleCol(cols, row, "temp_max") ?: 30.0,
                lightPreference = getStringCol(cols, row, "light_preference") ?: "medium",
                createdAt = getStringCol(cols, row, "created_at"),
                updatedAt = getStringCol(cols, row, "updated_at"),
            )
        }
    }

    /**
     * Pull recommendations for a plant from Turso cloud.
     */
    suspend fun pullRecommendations(plantId: String): List<Recommendation> {
        val requests = listOf(
            StreamRequest(
                type = "execute",
                stmt = Statement(
                    sql = "SELECT * FROM recommendations WHERE plant_id = ? ORDER BY created_at DESC LIMIT 10",
                    args = listOf(StmtArg("text", plantId))
                )
            )
        )

        val response = executePipeline(requests)
        return parseRows(response) { cols, row ->
            Recommendation(
                id = getStringCol(cols, row, "id") ?: "",
                plantId = getStringCol(cols, row, "plant_id") ?: "",
                source = getStringCol(cols, row, "source") ?: "rules",
                message = getStringCol(cols, row, "message") ?: "",
                severity = getStringCol(cols, row, "severity") ?: "info",
                actedOn = (getIntCol(cols, row, "acted_on") ?: 0) != 0,
                createdAt = getStringCol(cols, row, "created_at"),
            )
        }
    }

    // ---- Internal helpers ----

    private suspend fun executePipeline(requests: List<StreamRequest>): JsonElement {
        val response = client.post(pipelineUrl) {
            contentType(ContentType.Application.Json)
            headers {
                append("Authorization", "Bearer $authToken")
            }
            setBody(PipelineRequest(requests = requests))
        }
        return response.body()
    }

    private fun <T> parseRows(
        response: JsonElement,
        mapper: (cols: List<String>, row: JsonArray) -> T,
    ): List<T> {
        return try {
            val results = response.jsonObject["results"]?.jsonArray ?: return emptyList()
            if (results.isEmpty()) return emptyList()

            val firstResult = results[0].jsonObject
            val responseObj = firstResult["response"]?.jsonObject ?: return emptyList()
            val resultObj = responseObj["result"]?.jsonObject ?: return emptyList()

            val cols = resultObj["cols"]?.jsonArray?.map {
                it.jsonObject["name"]?.jsonPrimitive?.content ?: ""
            } ?: return emptyList()

            val rows = resultObj["rows"]?.jsonArray ?: return emptyList()

            rows.map { rowElement ->
                mapper(cols, rowElement.jsonArray)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun getStringCol(cols: List<String>, row: JsonArray, name: String): String? {
        val idx = cols.indexOf(name)
        if (idx < 0 || idx >= row.size) return null
        val element = row[idx]
        if (element is JsonNull) return null
        return element.jsonObject["value"]?.jsonPrimitive?.content
    }

    private fun getIntCol(cols: List<String>, row: JsonArray, name: String): Int? {
        val str = getStringCol(cols, row, name) ?: return null
        return str.toIntOrNull()
    }

    private fun getDoubleCol(cols: List<String>, row: JsonArray, name: String): Double? {
        val str = getStringCol(cols, row, name) ?: return null
        return str.toDoubleOrNull()
    }
}
