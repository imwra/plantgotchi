package com.plantgotchi.app.auth

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

class AuthService(
    private val baseURL: String,
    private val tokenManager: TokenManager,
    private val httpClient: HttpClient,
) {
    private val json = Json { ignoreUnknownKeys = true }

    private val _isAuthenticated = MutableStateFlow(tokenManager.isAuthenticated)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated

    val userId: String? get() = tokenManager.getUserId()

    suspend fun signUp(email: String, password: String, name: String) {
        val response = httpClient.post("$baseURL/api/auth/sign-up/email") {
            contentType(ContentType.Application.Json)
            setBody(buildJsonObject {
                put("email", email)
                put("password", password)
                put("name", name)
            }.toString())
        }

        if (response.status != HttpStatusCode.OK) {
            val body = response.bodyAsText()
            throw AuthException("Sign up failed: ${parseError(body)}")
        }

        handleAuthResponse(response)
    }

    suspend fun signIn(email: String, password: String) {
        val response = httpClient.post("$baseURL/api/auth/sign-in/email") {
            contentType(ContentType.Application.Json)
            setBody(buildJsonObject {
                put("email", email)
                put("password", password)
            }.toString())
        }

        if (response.status != HttpStatusCode.OK) {
            val body = response.bodyAsText()
            throw AuthException("Sign in failed: ${parseError(body)}")
        }

        handleAuthResponse(response)
    }

    fun signOut() {
        tokenManager.clearToken()
        _isAuthenticated.value = false
    }

    private suspend fun handleAuthResponse(response: HttpResponse) {
        val body = response.bodyAsText()
        val jsonObj = json.parseToJsonElement(body).jsonObject

        val token = jsonObj["token"]?.jsonPrimitive?.content
        if (token != null) {
            tokenManager.saveToken(token)
        }

        val user = jsonObj["user"]?.jsonObject
        val id = user?.get("id")?.jsonPrimitive?.content
        if (id != null) {
            tokenManager.saveUserId(id)
        }

        _isAuthenticated.value = true
    }

    private fun parseError(body: String): String {
        return try {
            val obj = json.parseToJsonElement(body).jsonObject
            obj["message"]?.jsonPrimitive?.content ?: "Unknown error"
        } catch (_: Exception) {
            "Unknown error"
        }
    }
}

class AuthException(message: String) : Exception(message)
