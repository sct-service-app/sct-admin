/**
 * Runtime-типы для /staff_endpoints/packages/{id}/detail-page-data/.
 * Источник: реальный ответ сервера (2026-05-24).
 */

export interface DetailBreadcrumb {
  label: string
  key: string
  url?: string
}

export interface DetailPageMeta {
  title: string
  breadcrumbs: DetailBreadcrumb[]
  tabs: { key: string; label: string }[]
}

export interface DetailAction {
  label: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  url: string
}

export interface DetailActions {
  edit?: DetailAction
  delete?: DetailAction
  duplicate?: DetailAction
  back_to_list?: DetailAction
}

export interface DetailStatus {
  value: string
  label: string
}

export interface DetailCategory {
  id: number
  code: string
  name: string
  slug: string
  icon: string
  color: string
  is_active: boolean
}

export interface DetailImage {
  url: string
  alt: string
}

export interface DetailPromotion {
  is_active: boolean
  title: string
  terms: string
}

export interface DetailPackage {
  id: number
  title: string
  slug: string
  status: DetailStatus
  category: DetailCategory
  short_description: string
  description: string
  image: DetailImage
  promotion: DetailPromotion
  is_featured: boolean
  sort_order: number
}

export interface CompositionItemRef {
  id: number
  category_id?: number
  item_type: 'PRODUCT' | 'SERVICE'
  status: string
  external_id?: string
  external_code?: string
  article?: string
  name: string
  unit_name?: string
  display_code?: string
  [key: string]: unknown
}

export interface CompositionItem {
  id: number
  item: CompositionItemRef
  name: string
  article?: string
  external_code?: string
  item_type: 'PRODUCT' | 'SERVICE'
  quantity: string
  unit_name?: string
  unit_price: string
  total_before_discount: string
  discount_type: string
  discount_percent: string
  discount_amount: string
  final_total: string
  is_required: boolean
  is_included: boolean
  sort_order: number
  comment: string
}

export interface DetailComposition {
  items_count: number
  items: CompositionItem[]
}

export interface DetailTotals {
  currency: string
  price_mode: { value: string; label: string }
  products_total: string
  services_total: string
  base_total: string
  discount_type: { value: string; label: string }
  discount_percent: string
  discount_amount: string
  manual_price: string | null
  final_price: string
}

export interface DetailCarSpec {
  powertrain_type?: { value: string; label: string }
  drive_type?: { value: string; label: string }
  transmission_type?: { value: string; label: string }
  fuel_type?: { value: string; label: string }
  displacement_cc?: number | null
  power_hp?: number | null
  power_kw?: string | null
  torque_nm?: number | null
  doors_count?: number | null
  seats_count?: number | null
  length_mm?: number | null
  width_mm?: number | null
  height_mm?: number | null
  wheelbase_mm?: number | null
  ground_clearance_mm?: number | null
  max_power_raw?: string | null
  torque_raw?: string | null
}

export interface DetailCar {
  modification_source_id: string
  title: string
  modification: {
    source_id: string
    name: string
    group_name: string
    full_title: string
  }
  mark: { id: number; source_id: string; name: string; name_ru: string; display_name: string }
  model: { id: number; source_id: string; name: string; name_ru: string; display_name: string }
  generation?: {
    id: number
    source_id: string
    name: string
    display_name: string
    year_from: number
    year_to: number
  }
  configuration?: {
    id: number
    source_id: string
    name: string
    body_type: { id: number; code: string; name: string }
  }
  specification?: DetailCarSpec
  image?: DetailImage
}

export interface DetailMeta {
  created_at: string
  updated_at: string
  created_at_display: string
  updated_at_display: string
  updated_by: { id?: number; username?: string } | null
}

export interface PackageDetailPageData {
  page: DetailPageMeta
  actions: DetailActions
  package: DetailPackage
  composition: DetailComposition
  totals: DetailTotals
  car: DetailCar
  meta: DetailMeta
}
