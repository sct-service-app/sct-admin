/**
 * Типы Telegram VIN-заявок (админ-раздел).
 *
 * Сотрудник «Касса SCT» через TG-бота шлёт фото госномера и фото VIN под
 * стеклом. Менеджер в админке вводит госномер → ищет авто клиента
 * (find-client-car) → вводит VIN → присваивает VIN автомобилю (assign-vin).
 *
 * Сверено с реальным API live (2026-06-09):
 * GET/PATCH/DELETE /staff_endpoints/telegram_vehicle_requests/{id}/,
 * POST .../find-client-car/, POST .../assign-vin/, GET .../stats/.
 *
 * ⚠️ Схема OpenAPI помечает status/page/actions/possible_client_cars как
 * `string`, но это SerializerMethodField — реально приходят объекты (ниже
 * описаны по фактическому ответу сервера).
 */

/** Логический статус обработки (вычисляется сервером, вручную не задаётся). */
export type TelegramStatusValue = 'new' | 'in_progress' | 'car_found' | 'done'

export interface TelegramStatus {
  value: TelegramStatusValue | string
  label: string
}

/** Найденный/привязанный автомобиль клиента (client_car и possible_client_cars[]). */
export interface TelegramClientCar {
  id: number
  client_id: number
  client_name: string
  client_phone: string
  license_plate: string
  vin_code: string
  full_car_title: string
  latest_mileage_km: number | null
  /** Статус самого ClientCar: ACTIVE / INACTIVE / … */
  status: string
  is_default: boolean
}

/** Элемент списка заявок (StaffTelegramVehicleRequestList). */
export interface TelegramRequest {
  id: number
  created_at: string
  updated_at: string
  telegram_chat_id: number | null
  telegram_user_id: number | null
  telegram_username: string
  plate_photo_url: string | null
  vin_photo_url: string | null
  /** Госномер, введённый сотрудником с фото. */
  detected_license_plate: string
  /** VIN, введённый сотрудником с фото. */
  detected_vin_code: string
  client_car: TelegramClientCar | null
  status: TelegramStatus
}

export interface TelegramPageBreadcrumb {
  label: string
  key: string
  url?: string
}
export interface TelegramPageMeta {
  title: string
  breadcrumbs: TelegramPageBreadcrumb[]
}

export interface TelegramAction {
  method: string
  url: string
}
export interface TelegramActions {
  detail?: TelegramAction
  edit?: TelegramAction
  find_client_car?: TelegramAction
  assign_vin?: TelegramAction
  delete?: TelegramAction
}

/** Детальная заявка (StaffTelegramVehicleRequestDetail) = list + page/actions/possible. */
export interface TelegramRequestDetail extends TelegramRequest {
  page: TelegramPageMeta
  actions: TelegramActions
  possible_client_cars: TelegramClientCar[]
}

/** Статистика (GET .../stats/). */
export interface TelegramStats {
  total: number
  new: number
  with_car: number
  with_vin: number
  without_car: number
}

/** Query-параметры списка. */
export interface TelegramRequestsQuery {
  status?: TelegramStatusValue | string
  has_car?: boolean
  has_plate?: boolean
  has_vin?: boolean
  search?: string
  ordering?: string
}

/** PATCH-тело: правка распознанных полей. */
export interface TelegramRequestPatch {
  detected_license_plate?: string
  detected_vin_code?: string
  /** Привязать авто клиента вручную (writeOnly). */
  client_car_id?: number | null
}

/** POST find-client-car. */
export interface TelegramFindCarPayload {
  detected_license_plate?: string
}

/** POST assign-vin. */
export interface TelegramAssignVinPayload {
  client_car_id?: number | null
  detected_vin_code?: string
}

export const TELEGRAM_STATUS_META: Record<string, { label: string; tone: string }> = {
  new: { label: 'Новая', tone: 'bg-blue-50 text-brandBlue' },
  in_progress: { label: 'В работе', tone: 'bg-amber-50 text-amber-700' },
  car_found: { label: 'Авто найдено', tone: 'bg-indigo-50 text-indigo-700' },
  done: { label: 'Готово', tone: 'bg-green-50 text-green-700' },
}

/** Метаданные статуса с фолбэком на серверный label. */
export function telegramStatusMeta(status: TelegramStatus | undefined) {
  if (!status) return { label: '—', tone: 'bg-surfaceMuted text-textSecondary' }
  return (
    TELEGRAM_STATUS_META[status.value] ?? {
      label: status.label || status.value,
      tone: 'bg-surfaceMuted text-textSecondary',
    }
  )
}
