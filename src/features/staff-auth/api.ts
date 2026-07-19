import { staffHttp } from '@/shared/api/staff-http'
import { endpoints } from '@/shared/api/endpoints'
import type { StaffLoginRequest, StaffUser } from '@/shared/api/types'

/**
 * Реальный ответ /staff_endpoints/auth/login/ — { access, refresh, user }.
 * В OpenAPI бэкендщик описал StaffLogin как `{username}` (баг), поэтому
 * локально декларируем правильную форму. Когда исправят — переедем на
 * сгенерированный тип.
 */
export interface StaffLoginResponse {
  access: string
  refresh: string
  user: StaffUser
}

export async function loginStaff(payload: StaffLoginRequest) {
  // staffHttp interceptor добавляет Authorization только если есть access
  // в storage — на логине его нет, так что отдельный noAuth-флаг не нужен.
  const response = await staffHttp.post<StaffLoginResponse>(endpoints.staffLogin, payload)
  return response.data
}

export async function fetchStaffProfile() {
  const response = await staffHttp.get<StaffUser>(endpoints.staffProfile)
  return response.data
}

export async function logoutStaff(refresh: string) {
  await staffHttp.post(endpoints.staffLogout, { refresh })
}
