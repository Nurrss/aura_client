import { defineStore } from 'pinia'
import api, { clearTokens as apiClearTokens } from '../api/index.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },
  actions: {
    _setAuth({ user }) {
      this.user = user || null
      this.initialized = true
    },
    _clearAuth() {
      this.user = null
      this.initialized = true
      apiClearTokens()
    },
    async hydrateFromStorage() {
      // With HttpOnly cookies, check authentication by fetching user profile
      try {
        const { data } = await api.get('/api/users/me')
        if (data?.data) {
          this._setAuth({ user: data.data })
        } else {
          this._clearAuth()
        }
      } catch (e) {
        // Not authenticated or session expired
        this._clearAuth()
      }
    },
    async register(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/api/auth/register', payload)
        // Registration may not return tokens immediately (email verification required)
        // Just mark success and let user log in after verification
        this.loading = false
        return true
      } catch (e) {
        this.loading = false
        this.error = e?.response?.data?.error || 'Registration failed'
        return false
      }
    },
    async login(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/api/auth/login', payload)
        // With HttpOnly cookies, tokens are set automatically
        // Response contains only user info
        const user = data?.data?.user
        this._setAuth({ user })
        this.loading = false
        return true
      } catch (e) {
        this.loading = false
        this.error = e?.response?.data?.error || 'Login failed'
        return false
      }
    },
    async logout() {
      try {
        // Call logout endpoint to clear HttpOnly cookies
        await api.post('/api/auth/logout')
      } catch (e) {
        // Even if the API call fails, clear local state
        console.error('Logout error:', e)
      } finally {
        this._clearAuth()
      }
    },
    async refreshToken() {
      // Refresh is handled automatically by axios interceptor
      // This method can be used to manually trigger a refresh if needed
      try {
        await api.post('/api/auth/refresh')
        return true
      } catch (e) {
        this._clearAuth()
        return false
      }
    },
  },
})
