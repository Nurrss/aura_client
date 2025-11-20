import axios from 'axios'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export function setTokens({ token, refreshToken }) {
  if (token) localStorage.setItem('aura-access-token', token)
  if (refreshToken) localStorage.setItem('aura-refresh-token', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('aura-access-token')
  localStorage.removeItem('aura-refresh-token')
}

export function getTokens() {
  return {
    token: localStorage.getItem('aura-access-token') || null,
    refreshToken: localStorage.getItem('aura-refresh-token') || null,
  }
}

let api

// Minimal mock adapter for development with static JSON files
if (USE_MOCKS) {
  api = {
    async get(url) {
      const map = {
        '/api/tasks': new URL('../data/tasks.json', import.meta.url),
        '/api/habits': new URL('../data/habits.json', import.meta.url),
        '/api/reports': new URL('../data/reports.json', import.meta.url),
        '/api/users/me': null,
      }
      if (url === '/api/users/me') {
        return {
          data: {
            id: 'me',
            name: 'Mock User',
            preferences: {
              theme: localStorage.getItem('aura-theme') || 'light',
              pomodoro: {
                work: parseInt(localStorage.getItem('aura-focus-min') || '25'),
                shortBreak: parseInt(localStorage.getItem('aura-break-min') || '5'),
                longBreak: parseInt(localStorage.getItem('aura-long-break') || '15'),
              },
            },
          },
        }
      }
      const resolved = map[url]
      if (!resolved) throw new Error(`Mock GET not found for ${url}`)
      const res = await fetch(resolved)
      const data = await res.json()
      return { data, status: 200, statusText: 'OK' }
    },
    async patch(url, body) {
      if (url === '/api/users/me') {
        const prefs = body?.preferences || {}
        if (prefs.theme) localStorage.setItem('aura-theme', prefs.theme)
        if (prefs.pomodoro?.work != null)
          localStorage.setItem('aura-focus-min', String(prefs.pomodoro.work))
        if (prefs.pomodoro?.shortBreak != null)
          localStorage.setItem('aura-break-min', String(prefs.pomodoro.shortBreak))
        if (prefs.pomodoro?.longBreak != null)
          localStorage.setItem('aura-long-break', String(prefs.pomodoro.longBreak))
        return { data: { ok: true } }
      }
      throw new Error(`Mock PATCH not found for ${url}`)
    },
    async delete(url) {
      if (url === '/api/users/me/preferences') {
        localStorage.removeItem('aura-theme')
        localStorage.removeItem('aura-focus-min')
        localStorage.removeItem('aura-break-min')
        localStorage.removeItem('aura-long-break')
        return { data: { ok: true } }
      }
      throw new Error(`Mock DELETE not found for ${url}`)
    },
  }
} else {
  api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
  })

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('aura-access-token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  let isRefreshing = false
  let refreshPromise = null

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config || {}
      const status = error?.response?.status
      const message = error?.response?.data?.message || ''

      const tokenExpired = status === 401 && /expired|token/i.test(message)

      if (tokenExpired && !originalRequest._retry) {
        originalRequest._retry = true
        if (!isRefreshing) {
          isRefreshing = true
          const { refreshToken } = getTokens()
          try {
            refreshPromise = api.post('/api/auth/refresh', { refreshToken })
            const res = await refreshPromise
            const { token: newToken, refreshToken: newRefresh } = res.data || {}
            if (newToken) setTokens({ token: newToken, refreshToken: newRefresh })
            isRefreshing = false
          } catch (e) {
            isRefreshing = false
            clearTokens()
            return Promise.reject(error)
          }
        } else if (refreshPromise) {
          try {
            await refreshPromise
          } catch (e) {
            return Promise.reject(error)
          }
        }

        const token = localStorage.getItem('aura-access-token')
        if (token) {
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return api(originalRequest)
      }
      return Promise.reject(error)
    },
  )
}

export default api
