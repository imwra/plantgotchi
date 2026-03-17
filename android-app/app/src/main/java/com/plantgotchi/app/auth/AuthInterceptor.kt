package com.plantgotchi.app.auth

import io.ktor.client.*
import io.ktor.client.plugins.api.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

class AuthInterceptor(private val tokenManager: TokenManager) {

    private val _signOutEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val signOutEvents: SharedFlow<Unit> = _signOutEvents

    fun install(config: HttpClientConfig<*>) {
        val plugin = createClientPlugin("AuthInterceptor") {
            onRequest { request, _ ->
                val token = tokenManager.getToken()
                if (token != null) {
                    request.header(HttpHeaders.Authorization, "Bearer $token")
                }
            }
            onResponse { response ->
                if (response.status == HttpStatusCode.Unauthorized) {
                    tokenManager.clearToken()
                    _signOutEvents.tryEmit(Unit)
                }
            }
        }
        config.install(plugin)
    }
}
