package com.plantgotchi.app

import com.plantgotchi.app.auth.TokenManager
import org.junit.Assert.*
import org.junit.Test

class TokenManagerTest {
    @Test
    fun `token is null when not set`() {
        val manager = TestTokenManager()
        assertNull(manager.getToken())
    }

    @Test
    fun `save and retrieve token`() {
        val manager = TestTokenManager()
        manager.saveToken("test-123")
        assertEquals("test-123", manager.getToken())
    }

    @Test
    fun `clear token removes it`() {
        val manager = TestTokenManager()
        manager.saveToken("to-clear")
        manager.clearToken()
        assertNull(manager.getToken())
    }

    @Test
    fun `overwrite existing token`() {
        val manager = TestTokenManager()
        manager.saveToken("first")
        manager.saveToken("second")
        assertEquals("second", manager.getToken())
    }

    @Test
    fun `getUserId returns null when not set`() {
        val manager = TestTokenManager()
        assertNull(manager.getUserId())
    }

    @Test
    fun `save and retrieve userId`() {
        val manager = TestTokenManager()
        manager.saveUserId("user-abc")
        assertEquals("user-abc", manager.getUserId())
    }
}

private class TestTokenManager : TokenManager.TokenStore {
    private var token: String? = null
    private var userId: String? = null

    override fun getToken(): String? = token
    override fun saveToken(token: String) { this.token = token }
    override fun clearToken() { token = null; userId = null }
    override fun getUserId(): String? = userId
    override fun saveUserId(id: String) { userId = id }
}
