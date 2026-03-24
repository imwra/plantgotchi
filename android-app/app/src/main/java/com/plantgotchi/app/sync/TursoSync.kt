package com.plantgotchi.app.sync

import com.plantgotchi.app.analytics.Analytics
import com.plantgotchi.app.analytics.LogLevel
import com.plantgotchi.app.model.CareLog
import com.plantgotchi.app.model.ContentBlock
import com.plantgotchi.app.model.Course
import com.plantgotchi.app.model.CourseEnrollment
import com.plantgotchi.app.model.CoursePhase
import com.plantgotchi.app.model.GrowLog
import com.plantgotchi.app.model.PhaseModule
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
            throw e
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

    // MARK: - Course Operations

    suspend fun pullCourses(): List<Course> {
        try {
            val response = httpClient.get("$baseURL/api/courses")
            if (response.status != HttpStatusCode.OK) return emptyList()

            val body = response.bodyAsText()
            val arr = json.parseToJsonElement(body).jsonArray
            return arr.mapNotNull { parseCourse(it.jsonObject) }
        } catch (e: Exception) {
            Analytics.captureException(e, mapOf("operation" to "pullCourses"))
            throw e
        }
    }

    suspend fun pullCourseDetail(slug: String): CourseDetail? {
        try {
            val response = httpClient.get("$baseURL/api/courses/$slug")
            if (response.status != HttpStatusCode.OK) return null

            val body = response.bodyAsText()
            val obj = json.parseToJsonElement(body).jsonObject
            return parseCourseDetail(obj)
        } catch (e: Exception) {
            Analytics.captureException(e, mapOf("operation" to "pullCourseDetail"))
            throw e
        }
    }

    suspend fun pullContentBlocks(slug: String, phaseId: String, moduleId: String): List<ContentBlock> {
        try {
            val response = httpClient.get("$baseURL/api/courses/$slug/phases/$phaseId/modules/$moduleId/blocks")
            if (response.status != HttpStatusCode.OK) return emptyList()

            val body = response.bodyAsText()
            val arr = json.parseToJsonElement(body).jsonArray
            return arr.mapNotNull { parseContentBlock(it.jsonObject) }
        } catch (e: Exception) {
            Analytics.captureException(e, mapOf("operation" to "pullContentBlocks"))
            throw e
        }
    }

    suspend fun enrollInCourse(courseId: String): CourseEnrollment? {
        try {
            val response = httpClient.post("$baseURL/api/enrollments") {
                contentType(ContentType.Application.Json)
                setBody(buildJsonObject {
                    put("course_id", courseId)
                }.toString())
            }
            if (response.status != HttpStatusCode.Created && response.status != HttpStatusCode.OK) return null

            val body = response.bodyAsText()
            return parseEnrollment(json.parseToJsonElement(body).jsonObject)
        } catch (e: Exception) {
            Analytics.captureException(e, mapOf("operation" to "enrollInCourse"))
            throw e
        }
    }

    suspend fun completeModule(enrollmentId: String, moduleId: String, quizAnswers: String? = null) {
        try {
            val response = httpClient.post("$baseURL/api/enrollments/$enrollmentId/completions") {
                contentType(ContentType.Application.Json)
                setBody(buildJsonObject {
                    put("module_id", moduleId)
                    quizAnswers?.let { put("quiz_answers", json.parseToJsonElement(it)) }
                }.toString())
            }
            if (response.status != HttpStatusCode.OK && response.status != HttpStatusCode.Created) {
                throw TursoSyncException("Complete module failed: HTTP ${response.status.value}")
            }
        } catch (e: Exception) {
            Analytics.captureException(e, mapOf("operation" to "completeModule"))
            throw e
        }
    }

    suspend fun pullEnrollments(userId: String): List<CourseEnrollment> {
        try {
            val response = httpClient.get("$baseURL/api/enrollments") {
                parameter("user_id", userId)
            }
            if (response.status != HttpStatusCode.OK) return emptyList()

            val body = response.bodyAsText()
            val arr = json.parseToJsonElement(body).jsonArray
            return arr.mapNotNull { parseEnrollment(it.jsonObject) }
        } catch (e: Exception) {
            Analytics.captureException(e, mapOf("operation" to "pullEnrollments"))
            throw e
        }
    }

    // MARK: - Course Parsing

    private fun parseCourse(obj: JsonObject): Course? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val creatorId = obj["creator_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val title = obj["title"]?.jsonPrimitive?.contentOrNull ?: return null
        val slug = obj["slug"]?.jsonPrimitive?.contentOrNull ?: return null

        return Course(
            id = id,
            creatorId = creatorId,
            creatorName = obj["creator_name"]?.jsonPrimitive?.contentOrNull,
            title = title,
            slug = slug,
            description = obj["description"]?.jsonPrimitive?.contentOrNull,
            coverImageUrl = obj["cover_image_url"]?.jsonPrimitive?.contentOrNull,
            priceCents = obj["price_cents"]?.jsonPrimitive?.intOrNull ?: 0,
            currency = obj["currency"]?.jsonPrimitive?.contentOrNull ?: "USD",
            status = obj["status"]?.jsonPrimitive?.contentOrNull ?: "published",
            enrollmentCount = obj["enrollment_count"]?.jsonPrimitive?.intOrNull,
            createdAt = obj["created_at"]?.jsonPrimitive?.contentOrNull,
            updatedAt = obj["updated_at"]?.jsonPrimitive?.contentOrNull,
        )
    }

    private fun parseCourseDetail(obj: JsonObject): CourseDetail? {
        val course = parseCourse(obj) ?: return null
        val phasesArr = obj["phases"]?.jsonArray ?: return CourseDetail(course, emptyList(), emptyMap())
        val phases = phasesArr.mapNotNull { parseCoursePhase(it.jsonObject) }
        val modules = mutableMapOf<String, List<PhaseModule>>()
        for (phaseObj in phasesArr) {
            val phaseId = phaseObj.jsonObject["id"]?.jsonPrimitive?.contentOrNull ?: continue
            val modsArr = phaseObj.jsonObject["modules"]?.jsonArray ?: continue
            modules[phaseId] = modsArr.mapNotNull { parsePhaseModule(it.jsonObject) }
        }
        return CourseDetail(course, phases, modules)
    }

    private fun parseCoursePhase(obj: JsonObject): CoursePhase? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val courseId = obj["course_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val title = obj["title"]?.jsonPrimitive?.contentOrNull ?: return null
        return CoursePhase(
            id = id, courseId = courseId, title = title,
            description = obj["description"]?.jsonPrimitive?.contentOrNull,
            sortOrder = obj["sort_order"]?.jsonPrimitive?.intOrNull ?: 0,
            createdAt = obj["created_at"]?.jsonPrimitive?.contentOrNull,
        )
    }

    private fun parsePhaseModule(obj: JsonObject): PhaseModule? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val phaseId = obj["phase_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val title = obj["title"]?.jsonPrimitive?.contentOrNull ?: return null
        return PhaseModule(
            id = id, phaseId = phaseId, title = title,
            description = obj["description"]?.jsonPrimitive?.contentOrNull,
            sortOrder = obj["sort_order"]?.jsonPrimitive?.intOrNull ?: 0,
            createdAt = obj["created_at"]?.jsonPrimitive?.contentOrNull,
        )
    }

    private fun parseContentBlock(obj: JsonObject): ContentBlock? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val moduleId = obj["module_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val blockType = obj["block_type"]?.jsonPrimitive?.contentOrNull ?: return null
        val content = obj["content"]?.jsonPrimitive?.contentOrNull ?: return null
        return ContentBlock(
            id = id, moduleId = moduleId, blockType = blockType,
            sortOrder = obj["sort_order"]?.jsonPrimitive?.intOrNull ?: 0,
            content = content,
            createdAt = obj["created_at"]?.jsonPrimitive?.contentOrNull,
            updatedAt = obj["updated_at"]?.jsonPrimitive?.contentOrNull,
        )
    }

    private fun parseEnrollment(obj: JsonObject): CourseEnrollment? {
        val id = obj["id"]?.jsonPrimitive?.contentOrNull ?: return null
        val userId = obj["user_id"]?.jsonPrimitive?.contentOrNull ?: return null
        val courseId = obj["course_id"]?.jsonPrimitive?.contentOrNull ?: return null
        return CourseEnrollment(
            id = id, userId = userId, courseId = courseId,
            pricePaidCents = obj["price_paid_cents"]?.jsonPrimitive?.intOrNull ?: 0,
            currency = obj["currency"]?.jsonPrimitive?.contentOrNull ?: "USD",
            status = obj["status"]?.jsonPrimitive?.contentOrNull ?: "active",
            enrolledAt = obj["enrolled_at"]?.jsonPrimitive?.contentOrNull,
            completedAt = obj["completed_at"]?.jsonPrimitive?.contentOrNull,
        )
    }
}

data class CourseDetail(
    val course: Course,
    val phases: List<CoursePhase>,
    val modules: Map<String, List<PhaseModule>>,
)

class TursoSyncException(message: String) : Exception(message)
