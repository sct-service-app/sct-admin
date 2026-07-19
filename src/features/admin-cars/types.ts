/**
 * Runtime-типы для /staff_endpoints/cars/cars-list-page-data/.
 * Восстановлено по реальному ответу сервера (2026-05-26).
 *
 * Эндпоинт возвращает page-data для админ-страницы со списком модификаций
 * автомобилей (то есть уникальных вариантов мотор/КПП/привод/кузов),
 * которые встречаются хотя бы в одном `ClientCar`.
 */

export interface AdminCarsPageMeta {
  title: string
  subtitle: string
  endpoint: string
}

export interface AdminCarsStat {
  label: string
  value: number
  description?: string
}

export interface AdminCarsStats {
  client_cars_total: AdminCarsStat
  unique_modifications_total: AdminCarsStat
  covered_modifications_total: AdminCarsStat
}

export interface MarkOption {
  value: number
  label: string
  source_id: string
}
export interface ModelOption {
  value: number
  label: string
  source_id: string
  mark_name: string
}
export interface GenericOption<T = string | number> {
  value: T
  label: string
  count?: number
}

export interface AdminCarsFilters {
  marks: MarkOption[]
  models: ModelOption[]
  generations?: GenericOption<number>[]
  body_types?: GenericOption<number>[]
  years?: GenericOption<number>[]
  powertrain_types?: GenericOption<string>[]
  drive_types?: GenericOption<string>[]
  transmission_types?: GenericOption<string>[]
  package_categories?: GenericOption<number>[]
  package_statuses?: GenericOption<string>[]
  promotion_options?: GenericOption<boolean>[]
  [key: string]: unknown
}

export interface AdminCarsAppliedFilters {
  search: string
  mark: number | null
  model: number | null
  year: number | null
  body_type: number | null
  generation: number | null
  powertrain_type: string | null
  drive_type: string | null
  transmission_type: string | null
  power_hp_min: number | null
  power_hp_max: number | null
  displacement_cc_min: number | null
  displacement_cc_max: number | null
  package_category: number | null
  package_status: string | null
  has_promotion: boolean | null
  ordering: string
  page: number
  page_size: number
}

export interface AdminCarsPagination {
  page: number
  page_size: number
  total: number
  pages: number
  has_next: boolean
  has_previous: boolean
  next_page: number | null
  previous_page: number | null
}

export interface CarRow {
  /** Числовой id строки (бэк сменил на int). Используем как React key. */
  id: number
  /**
   * Составной trim_source_id, например "23981827__24988834" — идёт в URL
   * detail-эндпоинта (бэк переименовал: раньше это лежало в `id`).
   */
  trim_source_id: string
  modification_id: number
  car: {
    title: string
    mark: { id: number; source_id: string; name: string }
    model: { id: number; source_id: string; name: string }
    generation?: {
      id: number
      source_id: string
      name: string
      year_from: number
      year_to: number
      display_name: string
    }
    configuration?: {
      id: number
      source_id: string
      name: string
    }
    body_type?: { id: number; code: string; name: string }
    modification: {
      id: number
      source_id: string
      name: string
      group_name: string
    }
  }
  technical: {
    has_specification: boolean
    engine?: {
      label: string
      value: string
      fuel_label: string
      engine_code: string
    }
    drive?: { label: string; value: string }
    transmission?: { label: string; value: string }
    power?: { hp: number; label: string }
    displacement?: { cc: number; label: string }
  }
  clients_count: number
  packages_count: number
  has_packages: boolean
}

export interface AdminCarsListPageData {
  page: AdminCarsPageMeta
  stats: AdminCarsStats
  filters: AdminCarsFilters
  applied_filters: AdminCarsAppliedFilters
  pagination: AdminCarsPagination
  results: CarRow[]
}

/** Query-параметры для list-page-data. */
export interface AdminCarsListQuery {
  search?: string
  mark?: number
  model?: number
  year?: number
  body_type?: number
  generation?: number
  powertrain_type?: string
  drive_type?: string
  transmission_type?: string
  power_hp_min?: number
  power_hp_max?: number
  displacement_cc_min?: number
  displacement_cc_max?: number
  package_category?: number
  package_status?: string
  has_promotion?: boolean
  ordering?: string
  page?: number
  page_size?: 10 | 20 | 50 | 100
}
