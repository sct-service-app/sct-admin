/**
 * HTTP-клиент для staff-API. Полный аналог client http, но:
 *   - читает токены из staffTokens (не client)
 *   - рефрешит через staff-эндпоинт /staff_endpoints/auth/refresh/
 *
 * Это отдельный axios-инстанс, чтобы 401 в админке не сбрасывал
 * клиентскую сессию, и наоборот.
 */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '@/shared/config/env'
import { staffTokens } from './token-storage'
import { unwrapEnvelope } from './unwrap'

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  _skipAuth?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function refreshStaffAccess(): Promise<string | null> {
  const refresh = staffTokens.getRefresh()
  if (!refresh) return null
  try {
    const response = await axios.post<{ access?: string }>(
      `${env.API_BASE_URL}/api/v1/staff_endpoints/auth/refresh/`,
      { refresh },
      { headers: { 'Content-Type': 'application/json' } },
    )
    const refreshData = unwrapEnvelope(response.data) as { access?: string } | undefined
    const newAccess = refreshData?.access
    if (typeof newAccess === 'string' && newAccess) {
      staffTokens.setAccess(newAccess)
      return newAccess
    }
    return null
  } catch {
    return null
  }
}

export const staffHttp: AxiosInstance = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

staffHttp.interceptors.request.use((config) => {
  const cfg = config as RetryableConfig
  if (cfg._skipAuth) return cfg
  const access = staffTokens.getAccess()
  if (access) {
    cfg.headers.set('Authorization', `Bearer ${access}`)
  }
  return cfg
})

staffHttp.interceptors.response.use(
  (response) => {
    response.data = unwrapEnvelope(response.data)
    return response
  },
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined
    const status = error.response?.status
    if (status !== 401 || !original || original._retry || original._skipAuth) {
      return Promise.reject(error)
    }
    original._retry = true
    if (!refreshPromise) {
      refreshPromise = refreshStaffAccess().finally(() => {
        refreshPromise = null
      })
    }
    const newAccess = await refreshPromise
    if (!newAccess) {
      staffTokens.clear()
      return Promise.reject(error)
    }
    original.headers.set('Authorization', `Bearer ${newAccess}`)
    return staffHttp.request(original)
  },
)
