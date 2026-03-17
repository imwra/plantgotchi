package com.plantgotchi.app

import com.plantgotchi.app.auth.TokenManager
import org.junit.Assert.*
import org.junit.Test

class AuthServiceTest {
    @Test
    fun `isAuthenticated returns false when no token`() {
        val store = InMemoryTokenStore()
        assertFalse(store.isAuthenticated)
    }

    @Test
    fun `isAuthenticated returns true when token exists`() {
        val store = InMemoryTokenStore()
        store.saveToken("abc")
        assertTrue(store.isAuthenticated)
    }

    @Test
    fun `signOut clears token and userId`() {
        val store = InMemoryTokenStore()
        store.saveToken("abc")
        store.saveUserId("user-1")
        store.clearToken()
        assertNull(store.getToken())
        assertNull(store.getUserId())
        assertFalse(store.isAuthenticated)
    }
}

private class InMemoryTokenStore : TokenManager.TokenStore {
    private var token: String? = null
    private var userId: String? = null
    val isAuthenticated: Boolean get() = token != null

    override fun getToken(): String? = token
    override fun saveToken(token: String) { this.token = token }
    override fun clearToken() { token = null; userId = null }
    override fun getUserId(): String? = userId
    override fun saveUserId(id: String) { userId = id }
}
