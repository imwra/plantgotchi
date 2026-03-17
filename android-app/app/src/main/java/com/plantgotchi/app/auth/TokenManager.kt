package com.plantgotchi.app.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

interface TokenStore {
    fun getToken(): String?
    fun saveToken(token: String)
    fun clearToken()
    fun getUserId(): String?
    fun saveUserId(id: String)
}

class TokenManager private constructor(private val prefs: SharedPreferences) : TokenStore {

    override fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    override fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    override fun clearToken() {
        prefs.edit()
            .remove(KEY_TOKEN)
            .remove(KEY_USER_ID)
            .apply()
    }

    override fun saveUserId(id: String) {
        prefs.edit().putString(KEY_USER_ID, id).apply()
    }

    override fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)

    val isAuthenticated: Boolean get() = getToken() != null

    companion object {
        private const val KEY_TOKEN = "auth_bearer_token"
        private const val KEY_USER_ID = "auth_user_id"
        private const val PREFS_NAME = "plantgotchi_auth"

        fun create(context: Context): TokenManager {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            val prefs = EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )

            return TokenManager(prefs)
        }
    }
}
