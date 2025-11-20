import axios from 'axios'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// Token management functions kept for backward compatibility
// With HttpOnly cookies, these are no-ops on the client side
export function setTokens({ token, refreshToken }) {
  // Tokens are now stored in HttpOnly cookies by the server
  // No client-side storage needed
}

export function clearTokens() {
  // Tokens are cleared by calling the logout endpoint
  // which removes HttpOnly cookies on the server side
}

export function getTokens() {
  // Tokens are in HttpOnly cookies and not accessible to JavaScript
  // Return empty to maintain backward compatibility
  return {
    token: null,
    refreshToken: null,
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
    withCredentials: true, // Enable sending/receiving cookies
  })

  // CSRF token management
  let csrfToken = null

  // Fetch CSRF token on startup
  const fetchCsrfToken = async () => {
    try {
      const { data } = await api.get('/api/csrf-token')
      csrfToken = data?.csrfToken
      return csrfToken
    } catch (e) {
      console.error('Failed to fetch CSRF token:', e)
      return null
    }
  }

  // Request interceptor to add CSRF token to state-changing requests
  api.interceptors.request.use(async (config) => {
    const method = config.method?.toUpperCase()
    const requiresCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

    if (requiresCsrf) {
      // Fetch token if not available
      if (!csrfToken) {
        await fetchCsrfToken()
      }

      // Add CSRF token header
      if (csrfToken) {
        config.headers = config.headers || {}
        config.headers['x-csrf-token'] = csrfToken
      }
    }

    return config
  })

  let isRefreshing = false
  let refreshPromise = null

  // Response interceptor for automatic token refresh and CSRF errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config || {}
      const status = error?.response?.status
      const message = error?.response?.data?.error || ''

      const tokenExpired = status === 401 && /expired|token|invalid/i.test(message)
      const csrfError = status === 403 && /csrf/i.test(message)

      // Handle CSRF token errors
      if (csrfError && !originalRequest._csrfRetry) {
        originalRequest._csrfRetry = true
        // Refetch CSRF token and retry
        await fetchCsrfToken()
        return api(originalRequest)
      }

      // Handle authentication token expiration
      if (tokenExpired && !originalRequest._retry) {
        originalRequest._retry = true
        if (!isRefreshing) {
          isRefreshing = true
          try {
            // Refresh token is sent automatically via cookies
            refreshPromise = api.post('/api/auth/refresh')
            await refreshPromise
            isRefreshing = false
            // Retry the original request with new cookie token
            return api(originalRequest)
          } catch (e) {
            isRefreshing = false
            clearTokens()
            // Redirect to login or handle logout
            window.location.href = '/login'
            return Promise.reject(error)
          }
        } else if (refreshPromise) {
          try {
            await refreshPromise
            return api(originalRequest)
          } catch (e) {
            return Promise.reject(error)
          }
        }
      }
      return Promise.reject(error)
    },
  )

  // Fetch CSRF token on module load
  fetchCsrfToken()
}

export default api
