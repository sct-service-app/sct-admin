/**
 * API формы редактирования пакета.
 *
 * Эндпоинты:
 *   GET    /staff_endpoints/packages/{id}/         — для предзаполнения формы
 *   POST   /staff_endpoints/packages/create/       — создание
 *   PATCH  /staff_endpoints/packages/{id}/edit/    — частичное обновление
 *   GET    /staff_endpoints/packages/package-items/?autocomplete=1&q=...
 *                                                  — поиск товаров/услуг для состава
 */
import { staffHttp } from '@/shared/api/staff-http'
import { endpoints } from '@/shared/api/endpoints'
import type {
  StaffServicePackageDetail,
  StaffServicePackageWriteRequest,
  PatchedStaffServicePackageWriteRequest,
} from '@/shared/api/types'

/**
 * Реальный ответ /package-items/search/ (сверено live на dev, 03.07).
 *
 * Это НЕ `StaffPackageItemDetail` из OpenAPI: поиск отдаёт плоский
 * search-сериализатор. Главное — тут есть `price_id` (id активной цены),
 * который бэк требует в составе пакета (`package_items[].price_id`).
 * В OpenAPI-схеме этого поля нет, поэтому держим тип локально.
 */
export interface StaffPackageItemSearchResult {
  id: number
  name: string
  article: string | null
  external_code: string | null
  display_code: string | null
  item_type: 'PRODUCT' | 'SERVICE'
  status: string
  unit_name: string
  /** id активной цены — идёт в package_items[].price_id при сохранении. */
  price_id: number | null
  /** Объект активной цены (в схеме указан строкой — расхождение). */
  active_price: {
    id: number
    price: string
    currency: string
    status: string
  } | null
}

export async function fetchPackageForEdit(id: number) {
  const response = await staffHttp.get<StaffServicePackageDetail>(endpoints.staffPackage(id))
  return response.data
}

export async function createPackage(payload: StaffServicePackageWriteRequest) {
  const response = await staffHttp.post<StaffServicePackageDetail>(
    endpoints.staffPackagesCreate,
    payload,
  )
  return response.data
}

export async function updatePackage(
  id: number,
  payload: PatchedStaffServicePackageWriteRequest,
) {
  const response = await staffHttp.patch<StaffServicePackageDetail>(
    endpoints.staffPackageEdit(id),
    payload,
  )
  return response.data
}

/**
 * Загрузка фото пакета — отдельным multipart-PATCH с единственным полем
 * `image` (бэк: StaffServicePackageWriteRequest.image, format binary).
 *
 * Делаем вторым шагом (после JSON-сохранения состава), чтобы не упаковывать
 * вложенный package_items[] в multipart. PATCH partial — трогает только фото.
 * Content-Type перебиваем, т.к. у инстанса дефолт application/json.
 */
export async function uploadPackageImage(id: number, image: File) {
  const fd = new FormData()
  fd.append('image', image)
  const response = await staffHttp.patch<StaffServicePackageDetail>(
    endpoints.staffPackageEdit(id),
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return response.data
}

/** Ответ /package-items/search/ — бэк сам нормализует и делает fuzzy-поиск. */
export interface PackageItemSearchResponse {
  query: string
  normalized_query: string
  count: number
  results: StaffPackageItemSearchResult[]
}

/**
 * Поиск товаров/услуг для добавления в состав пакета.
 *
 * Дёргает выделенный fuzzy-эндпоинт `/package-items/search/?q=&limit=`:
 * нормализация (O.E.M. → oem), опечатки (malonn → MANNOL), поиск по
 * названию/бренду/артикулу делает БЭК. Клиент НЕ фильтрует сам.
 */
export async function searchPackageItems(query: string, limit = 20) {
  const q = query.trim()
  if (q.length < 2) return []
  const response = await staffHttp.get<PackageItemSearchResponse>(
    endpoints.staffPackageItemsSearch,
    { params: { q, limit } },
  )
  return response.data.results ?? []
}
