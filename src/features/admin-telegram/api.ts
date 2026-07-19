/**
 * Data-слой Telegram VIN-заявок — реальный staff-API.
 *
 * Эндпоинты (live, 2026-06-09):
 *   GET    /staff_endpoints/telegram_vehicle_requests/            — список
 *   GET    /staff_endpoints/telegram_vehicle_requests/{id}/       — детальная
 *   PATCH  /staff_endpoints/telegram_vehicle_requests/{id}/       — правка detected_*
 *   POST   .../{id}/find-client-car/                              — поиск авто
 *   POST   .../{id}/assign-vin/                                   — присвоить VIN
 *   GET    /staff_endpoints/telegram_vehicle_requests/stats/      — статистика
 *
 * Список — голый массив (как и staff/bookings), нормализуем на всякий случай.
 */
import { staffHttp } from '@/shared/api/staff-http'
import { endpoints } from '@/shared/api/endpoints'
import type {
  TelegramAssignVinPayload,
  TelegramFindCarPayload,
  TelegramRequest,
  TelegramRequestDetail,
  TelegramRequestPatch,
  TelegramRequestsQuery,
  TelegramStats,
} from './types'

function pickParams(q?: TelegramRequestsQuery): Record<string, string> {
  const out: Record<string, string> = {}
  if (!q) return out
  if (q.status) out.status = q.status
  if (q.search) out.search = q.search
  if (q.ordering) out.ordering = q.ordering
  if (typeof q.has_car === 'boolean') out.has_car = String(q.has_car)
  if (typeof q.has_plate === 'boolean') out.has_plate = String(q.has_plate)
  if (typeof q.has_vin === 'boolean') out.has_vin = String(q.has_vin)
  return out
}

export async function fetchTelegramRequests(
  q?: TelegramRequestsQuery,
): Promise<TelegramRequest[]> {
  const response = await staffHttp.get<TelegramRequest[] | { results?: TelegramRequest[] }>(
    endpoints.staffTelegramRequests,
    { params: pickParams(q) },
  )
  const data = response.data
  return Array.isArray(data) ? data : (data.results ?? [])
}

export async function fetchTelegramRequest(id: number): Promise<TelegramRequestDetail> {
  const response = await staffHttp.get<TelegramRequestDetail>(
    endpoints.staffTelegramRequest(id),
  )
  return response.data
}

export async function fetchTelegramStats(): Promise<TelegramStats> {
  const response = await staffHttp.get<TelegramStats>(endpoints.staffTelegramRequestsStats)
  return response.data
}

/** PATCH — правка распознанных госномера/VIN (и ручная привязка авто). */
export async function patchTelegramRequest(
  id: number,
  payload: TelegramRequestPatch,
): Promise<TelegramRequestDetail> {
  const response = await staffHttp.patch<TelegramRequestDetail>(
    endpoints.staffTelegramRequest(id),
    payload,
  )
  return response.data
}

/** POST find-client-car — поиск авто клиента по госномеру (автопривязка если один). */
export async function findClientCar(id: number, payload: TelegramFindCarPayload) {
  const response = await staffHttp.post(
    endpoints.staffTelegramRequestFindCar(id),
    payload,
  )
  return response.data
}

/** POST assign-vin — запись VIN в ClientCar; заявка переходит в done. */
export async function assignVin(
  id: number,
  payload: TelegramAssignVinPayload,
): Promise<TelegramRequestDetail> {
  const response = await staffHttp.post<TelegramRequestDetail>(
    endpoints.staffTelegramRequestAssignVin(id),
    payload,
  )
  return response.data
}

export async function deleteTelegramRequest(id: number): Promise<void> {
  await staffHttp.delete(endpoints.staffTelegramRequest(id))
}
