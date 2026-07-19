/**
 * Runtime-типы для админских записей (staff bookings).
 *
 * Сверено с реальными ответами и свежей схемой (Template.yaml):
 *  - GET  /staff_endpoints/bookings/        → голый массив StaffBookingList
 *  - GET  /staff_endpoints/bookings/{id}/   → StaffBookingDetail (плоский)
 *  - PATCH/{id}/                            → PatchedStaffBookingUpdateRequest
 *  - POST /{id}/cancel/                     → отмена
 *  - GET  /options/                         → справочники
 *
 * Важно: и список, и detail — ПЛОСКИЕ (client_name, plate, car_title,
 * service_title, mileage_km, station…), а не вложенные snapshot-поля.
 * status_label бэк не отдаёт (null) — ярлыки держит фронт.
 */

export type BookingStatus =
  | 'DRAFT'
  | 'CREATED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED_BY_CLIENT'
  | 'CANCELLED_BY_STAFF'
  | 'NO_SHOW'
  | string

export type ServiceType = 'PACKAGE' | 'DEFAULT' | string

/** Строка списка GET /staff_endpoints/bookings/ (плоская). */
export interface StaffBookingListRow {
  id: number
  status: BookingStatus
  status_label?: string | null
  client_name: string
  phone: string
  email?: string
  plate: string
  car_title: string
  car_meta?: string
  mileage_km?: number | string | null
  service_title: string
  service_type: ServiceType
  price?: string | null
  currency?: string
  preferred_datetime: string | null
  scheduled_datetime: string | null
  station?: string
  station_id?: number | null
  created_at: string
  [key: string]: unknown
}

/** Вложенные объекты detail-ответа. */
export interface StaffBookingClient {
  id?: number
  name?: string
  email?: string | null
  phone?: string
}

export interface StaffBookingCar {
  id?: number
  title?: string
  display_name?: string
  license_plate?: string
  vin_code?: string | null
  latest_mileage_km?: number | null
  modification_source_id?: string
}

export interface StaffBookingService {
  type?: ServiceType
  title?: string
  service_package_id?: number | null
  default_service_page_id?: number | null
  price?: string | null
  currency?: string
}

/** Детальный ответ GET /staff_endpoints/bookings/{id}/ (плоский). */
export interface StaffBookingDetail {
  id: number
  status: BookingStatus
  status_label?: string | null
  // Клиент / авто (плоско + вложенно)
  client_id?: number
  client_name: string
  phone?: string
  email?: string
  client?: StaffBookingClient
  client_car_id?: number
  plate?: string
  car_title?: string
  car_meta?: string
  car?: StaffBookingCar
  // Услуга
  service_type?: ServiceType
  service_title?: string
  service_package_id?: number | null
  default_service_page_id?: number | null
  service?: StaffBookingService
  // СТО
  service_station_id?: number | null
  station?: string
  station_id?: number | null
  display_address?: string
  // Пробег (в API только mileage_km; *_recorded_at/source/comment отсутствуют)
  mileage_km?: number | string | null
  // Время
  preferred_datetime: string | null
  scheduled_datetime: string | null
  final_datetime?: string | null
  // Деньги
  price?: string | null
  price_snapshot?: string | null
  currency?: string
  // Тексты
  comment?: string
  staff_comment?: string
  cancel_reason?: string
  // Системное
  bitrix_deal_id?: string | null
  created_at?: string
  [key: string]: unknown
}

export interface StaffBookingsQuery {
  status?: BookingStatus
  search?: string
  ordering?: string
}

// === Опции для выбора (GET /staff/bookings/options/) ===

export interface OptionStation {
  id: number
  name?: string
  slug?: string
  city?: string
  address?: string
  phone?: string
  is_active?: boolean
  label: string
}

export interface OptionPackage {
  id: number
  title?: string
  slug?: string
  status?: string
  currency?: string
  price?: number | string
  label: string
}

export interface OptionDefaultService {
  id: number
  title?: string
  slug?: string
  status?: string
  price_note?: string
  label: string
}

export interface StaffBookingsOptions {
  stations: OptionStation[]
  service_packages: OptionPackage[]
  default_services: OptionDefaultService[]
}

// === Payload для PATCH /staff/bookings/{id}/ (PatchedStaffBookingUpdateRequest) ===

export interface StaffBookingPatch {
  status?: BookingStatus
  preferred_datetime?: string
  scheduled_datetime?: string | null
  service_station_id?: number | null
  service_type?: ServiceType
  service_package_id?: number | null
  default_service_page_id?: number | null
  mileage_km?: number | null
  price_snapshot?: string | null
  currency?: string
  staff_comment?: string
  cancel_reason?: string
}

export interface CancelPayload {
  cancel_reason?: string
}
