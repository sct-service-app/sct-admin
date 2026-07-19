/**
 * API-функции админских записей на сервис.
 *
 * Список — голый массив (бэк игнорирует пагинацию), нормализуем на всякий
 * случай. Все действия идут одним PATCH /staff/bookings/{id}/; cancel —
 * отдельным POST. options отдаёт справочники (СТО, пакеты, default-услуги).
 */
import { staffHttp } from '@/shared/api/staff-http'
import { endpoints } from '@/shared/api/endpoints'
import type {
  CancelPayload,
  StaffBookingDetail,
  StaffBookingListRow,
  StaffBookingPatch,
  StaffBookingsOptions,
  StaffBookingsQuery,
} from './types'

function pickParams(q?: StaffBookingsQuery): Record<string, string | number> {
  if (!q) return {}
  const out: Record<string, string | number> = {}
  if (q.status) out.status = q.status
  if (q.search) out.search = q.search
  if (q.ordering) out.ordering = q.ordering
  return out
}

export async function fetchStaffBookings(q?: StaffBookingsQuery): Promise<StaffBookingListRow[]> {
  const response = await staffHttp.get<StaffBookingListRow[] | { results?: StaffBookingListRow[] }>(
    endpoints.staffBookings,
    { params: pickParams(q) },
  )
  const data = response.data
  return Array.isArray(data) ? data : (data.results ?? [])
}

export async function fetchStaffBooking(id: number): Promise<StaffBookingDetail> {
  const response = await staffHttp.get<StaffBookingDetail>(endpoints.staffBooking(id))
  return response.data
}

/** Универсальный PATCH-апдейт записи (любой набор полей сразу). */
export async function updateStaffBooking(
  id: number,
  payload: StaffBookingPatch,
): Promise<StaffBookingDetail> {
  const response = await staffHttp.patch<StaffBookingDetail>(endpoints.staffBooking(id), payload)
  return response.data
}

export async function cancelStaffBooking(id: number, payload: CancelPayload) {
  const response = await staffHttp.post<StaffBookingDetail>(
    endpoints.staffBookingCancel(id),
    payload,
  )
  return response.data
}

export async function fetchStaffBookingsOptions(): Promise<StaffBookingsOptions> {
  const response = await staffHttp.get<StaffBookingsOptions>(endpoints.staffBookingsOptions)
  return response.data
}
