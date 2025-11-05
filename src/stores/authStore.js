import { defineStore } from 'pinia'
import api, {
  setTokens as apiSetTokens,
  clearTokens as apiClearTokens,
  getTokens as apiGetTokens,
} from '../api/index.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    tokens: { access: null, refresh: null },
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.tokens.access),
  },
  actions: {
    _setAuth({ user, access, refresh }) {
      this.user = user || null
      this.tokens.access = access || null
      this.tokens.refresh = refresh || null
      if (access || refresh) {
        apiSetTokens({ token: access, refreshToken: refresh })
      }
    },
    _clearAuth() {
      this.user = null
      this.tokens = { access: null, refresh: null }
      apiClearTokens()
    },
    hydrateFromStorage() {
      const { token, refreshToken } = apiGetTokens()
      this.tokens.access = token
      this.tokens.refresh = refreshToken
    },
    async register(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/api/auth/register', payload)
        const { user, token, refreshToken } = data
        this._setAuth({ user, access: token, refresh: refreshToken })
        this.loading = false
        return true
      } catch (e) {
        this.loading = false
        this.error = e?.response?.data?.message || 'Registration failed'
        return false
      }
    },
    async login(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/api/auth/login', payload)
        const { user, token, refreshToken } = data
        this._setAuth({ user, access: token, refresh: refreshToken })
        this.loading = false
        return true
      } catch (e) {
        this.loading = false
        this.error = e?.response?.data?.message || 'Login failed'
        return false
      }
    },
    logout() {
      this._clearAuth()
    },
    async refreshToken() {
      const refresh = this.tokens.refresh || apiGetTokens().refreshToken
      if (!refresh) return false
      try {
        const { data } = await api.post('/api/auth/refresh', { refreshToken: refresh })
        const { token, refreshToken } = data
        this._setAuth({ user: this.user, access: token, refresh: refreshToken })
        return true
      } catch (e) {
        this._clearAuth()
        return false
      }
    },
  },
})
