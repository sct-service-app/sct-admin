import { http, noAuth } from '@/shared/api/http'
import { endpoints } from '@/shared/api/endpoints'
import type {
  CarsQuery,
  FiltersResponse,
  MarksResponse,
  ModelsResponse,
  ModificationsResponse,
  Trim,
  TrimsResponse,
} from './types'

/**
 * Конфигуратор авто публичный (security: {} в schema), но при наличии
 * access-токена бэк его тоже принимает. Используем noAuth, чтобы не светить
 * Authorization без необходимости.
 */

export async function fetchMarks(): Promise<MarksResponse> {
  const response = await noAuth<MarksResponse>({ url: endpoints.carsMarks, method: 'GET' })
  return response.data
}

export async function fetchModels(markId: number): Promise<ModelsResponse> {
  const response = await noAuth<ModelsResponse>({
    url: endpoints.carsModels,
    method: 'GET',
    params: { mark: markId },
  })
  return response.data
}

function buildParams(q: CarsQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {
    mark: q.mark,
    model: q.model,
  }
  if (q.year) out.year = q.year
  if (q.body_type) out.body_type = q.body_type
  if (q.generation) out.generation = q.generation
  if (q.fuel_type) out.fuel_type = q.fuel_type
  if (q.engine_volume) out.engine_volume = q.engine_volume
  if (q.horse_power) out.horse_power = q.horse_power
  if (q.transmission_type) out.transmission_type = q.transmission_type
  if (q.drive_type) out.drive_type = q.drive_type
  if (q.steering_wheel_position) out.steering_wheel_position = q.steering_wheel_position
  if (q.page) out.page = q.page
  if (q.page_size) out.page_size = q.page_size
  return out
}

export async function fetchFilters(q: CarsQuery): Promise<FiltersResponse> {
  const response = await noAuth<FiltersResponse>({
    url: endpoints.carsFilters,
    method: 'GET',
    params: buildParams(q),
  })
  return response.data
}

export async function fetchModifications(q: CarsQuery): Promise<ModificationsResponse> {
  const response = await noAuth<ModificationsResponse>({
    url: endpoints.carsModifications,
    method: 'GET',
    params: buildParams(q),
  })
  return response.data
}

/**
 * Комплектации выбранной модификации. Параметр `modification` — числовой id
 * модификации (не source_uuid: с uuid бэк отдаёт 500). Ответ нормализуем:
 * приходит `{results}` либо голый массив.
 */
export async function fetchTrims(modificationId: number): Promise<Trim[]> {
  const response = await noAuth<TrimsResponse | Trim[]>({
    url: endpoints.carsTrims,
    method: 'GET',
    params: { modification: modificationId },
  })
  const data = response.data
  if (Array.isArray(data)) return data
  return data.results ?? []
}

/**
 * Кастомный fetchCarsModificationsByPath — для пагинации `next` URL'а.
 * Не делаем, пока не подтвердим что бэк отдаёт абсолютный URL в `next`.
 * Если что — добавим.
 */

// Re-export для удобства, чтобы потребитель импортировал из одного файла.
export { http }
