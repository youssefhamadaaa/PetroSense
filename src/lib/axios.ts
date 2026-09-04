import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getAuthToken, useAuthStore } from '@/store/auth'

// ===========================================================================
// Axios instance for the real Django API.
//   • baseURL from VITE_API_URL (e.g. http://localhost:8001)
//   • request interceptor attaches Authorization: Bearer <access token>
//   • response interceptor retries once via /api/auth/refresh/ on 401,
//     else logs out and bounces to /login.
//
// The auth store holds only the ACCESS token (screens read it there). The
// REFRESH token is persisted here in localStorage so this layer can rotate the
// access token without touching the store's shape or any screen.
// ===========================================================================

const BASE_URL = import.meta.env.VITE_API_URL

const REFRESH_KEY = 'petrosense-refresh'

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_KEY)

export const setRefreshToken = (token: string | null): void => {
  if (token) localStorage.setItem(REFRESH_KEY, token)
  else localStorage.removeItem(REFRESH_KEY)
}

export const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// --- Request: attach the bearer token from the auth store ------------------

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Response: on 401, try to refresh once, else log out -------------------

// Track config across the retry so we only attempt refresh a single time.
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    if (
      status === 401 &&
      original &&
      !original._retry &&
      getRefreshToken()
    ) {
      original._retry = true
      try {
        // Bare axios call (not `http`) so this request skips the interceptors.
        const { data } = await axios.post<{ access: string }>(
          `${BASE_URL}/api/auth/refresh/`,
          { refresh: getRefreshToken() }
        )
        const newAccess = data.access

        // Update the access token in the store (keep the current user/role).
        const { currentUser, setSession } = useAuthStore.getState()
        if (currentUser) setSession(currentUser, newAccess)

        // Replay the original request with the fresh token.
        original.headers.Authorization = `Bearer ${newAccess}`
        return http(original)
      } catch (refreshError) {
        // Refresh failed → clear session and send the user to login.
        setRefreshToken(null)
        useAuthStore.getState().logout()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
