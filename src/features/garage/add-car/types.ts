/**
 * Runtime-типы для публичного конфигуратора /api/v1/cars/*.
 *
 * Бэк описал эти эндпоинты в OpenAPI без response body, поэтому
 * автогенерация типов их не покрыла. Восстанавливаем форму по реальным
 * ответам сервера (curl сделал 2026-05-24, см. CARS_API_PROBE.md в доках).
 *
 * Если бэк добавит схемы — переедем на components["schemas"]["..."].
 */

export interface Mark {
  id: number
  source_id: string
  name: string
  name_ru: string
  display_name: string
  logo_url: string
  is_popular: boolean
  country: string
  country_raw: string
  year_from: number
  year_to: number
  modifications_count: number
}

export interface MarksResponse {
  count: number
  total_modifications_count: number
  results: Mark[]
}

export interface Model {
  id: number
  source_id: string
  mark_id: number
  mark_source_id: string
  mark_name: string
  name: string
  name_ru: string
  display_name: string
  year_from: number
  year_to: number
  class_code: string | null
  class_code_raw: string | null
  modifications_count: number
}

export interface ModelsResponse {
  count: number
  total_modifications_count: number
  results: Model[]
}

export interface FiltersSelected {
  mark: string | null
  model: string | null
  year: string | null
  body_type: string | null
  generation: string | null
  fuel_type: string | null
  engine_volume: string | null
  horse_power: string | null
  transmission_type: string | null
  drive_type: string | null
  steering_wheel_position: string | null
}

export interface BodyType {
  id: number
  code: string
  name: string
  description: string
}

export interface Generation {
  id: number
  source_id: string
  name: string
  display_name: string
  year_from: number
  year_to: number
}

export interface FuelType {
  value: string
  label: string
}

export interface NumberOption {
  value: number
}

export interface CodeNameOption {
  value: string
  label?: string
  code?: string
  name?: string
}

export interface FiltersResponse {
  selected: FiltersSelected
  modifications_count: number
  years: number[]
  body_types: BodyType[]
  generations: Generation[]
  fuel_types: FuelType[]
  engine_volumes: NumberOption[]
  horse_powers: NumberOption[]
  transmission_types: CodeNameOption[]
  drive_types: CodeNameOption[]
  steering_positions: CodeNameOption[]
}

/**
 * Параметры запроса filters/modifications. mark и model обязательны.
 * Все остальные — опциональны и постепенно сужают выборку.
 */
export interface CarsQuery {
  mark: number | string
  model: number | string
  year?: number
  body_type?: number | string
  generation?: number | string
  fuel_type?: string
  engine_volume?: number
  horse_power?: number
  transmission_type?: string
  drive_type?: string
  steering_wheel_position?: string
  page?: number
  page_size?: number
}

export interface Modification {
  id: number
  /** Новый внешний идентификатор модификации (бэк перешёл с source_id). */
  source_uuid: string
  /** Сколько комплектаций (trims) у модификации. 1 → шаг выбора пропускаем. */
  trims_count?: number
  /** Legacy: раньше был source_id, теперь приходит null. Не использовать. */
  source_id?: string | null
  display_name?: string
  name?: string
  title?: string
  full_title?: string
  configuration_name?: string
  /** Фото конфигурации (S3, открыт). Поле называется именно photo_url. */
  photo_url?: string | null
  year_from?: number
  year_to?: number
  fuel_type?: string
  fuel_type_label?: string
  engine_volume?: number
  horse_power?: number
  power_display?: string
  transmission_type_label?: string
  drive_type_label?: string
  body_type?: string
  // Бэк может вернуть много дополнительных полей — оставляем доступ через
  // any-индексацию в UI.
  [key: string]: unknown
}

export interface ModificationsResponse {
  count: number
  // Бэк может вернуть либо `results`, либо просто массив — обработаем оба.
  results?: Modification[]
  next?: string | null
  previous?: string | null
}

/**
 * Комплектация модификации (GET /cars/trims/?modification={id}).
 * `source_id` — составной «модификация__комплектация» (напр. "9360098__20463555"),
 * именно он уходит в create как `modification_trim_source_id`.
 */
export interface Trim {
  id: number
  source_id: string
  name?: string
  display_name?: string
  full_title?: string
  modification_id?: number
  modification_source_uuid?: string
  modification_name?: string
  is_closed?: boolean
  price_from?: number | string | null
  price_to?: number | string | null
}

export interface TrimsResponse {
  count?: number
  results?: Trim[]
}
