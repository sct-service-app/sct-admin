/**
 * Runtime-типы для админ-списка пакетов.
 *
 * Бэк (сверено на dev 2026-07-02) разделил данные на два источника:
 *  - GET /packages/list-page-data/ — оболочка страницы: page{title,description},
 *    stats.summary, filters (справочники статусов/категорий). Список пакетов
 *    больше НЕ возвращает.
 *  - GET /packages/ — сам список: results[] + pagination (+ те же filters).
 */

// --- Оболочка страницы: list-page-data ---

export interface PageMeta {
  title: string
  description: string
}

export interface StatsSummary {
  total: number
  draft: number
  published: number
  unpublished: number
  archived: number
  with_promotion: number
  featured: number
}

export interface ListStats {
  summary: StatsSummary
  [key: string]: unknown
}

export interface StatusOption {
  value: string
  label: string
}

export interface CategoryOption {
  id: number
  name: string
  slug: string
}

export interface ListFilters {
  statuses: StatusOption[]
  categories: CategoryOption[]
  [key: string]: unknown
}

export interface PackagesListPageData {
  page: PageMeta
  stats: ListStats
  filters: ListFilters
  [key: string]: unknown
}

// --- Список пакетов: GET /packages/ ---

export interface Pagination {
  count: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface PackageCategoryShort {
  id: number
  code: string
  name: string
  slug: string
  icon?: string
  color?: string
}

export interface PackageListItem {
  id: number
  title: string
  slug: string
  status: string
  status_display: string
  category: PackageCategoryShort | null
  car_title: string
  image_url: string
  has_promotion: boolean
  promotion_title: string
  currency: string
  base_total: string
  final_price: string
  price_mode: string
  price_mode_display: string
  items_count: number
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface StaffPackagesListResponse {
  pagination: Pagination
  filters: ListFilters
  results: PackageListItem[]
  [key: string]: unknown
}

/** Query-параметры (состояние фильтров в URL). */
export interface PackagesListQuery {
  search?: string
  category?: number
  status?: string
  has_promotion?: boolean
  ordering?: string
  page?: number
  page_size?: 10 | 20 | 50 | 100
}
