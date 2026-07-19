/**
 * React Query хуки для конфигуратора.
 *
 * marks: кэшируем агрессивно (24ч) — это огромный справочник, который меняется
 * раз в месяц. models и filters — короткий staleTime, потому что они зависят
 * от выбранных значений и подгружаются часто.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchFilters, fetchMarks, fetchModels, fetchModifications, fetchTrims } from './api'
import type { CarsQuery } from './types'

const dayMs = 24 * 60 * 60 * 1000

export const carsKeys = {
  all: ['cars-configurator'] as const,
  marks: () => [...carsKeys.all, 'marks'] as const,
  models: (markId: number) => [...carsKeys.all, 'models', markId] as const,
  filters: (q: CarsQuery) => [...carsKeys.all, 'filters', q] as const,
  modifications: (q: CarsQuery) => [...carsKeys.all, 'modifications', q] as const,
  trims: (modificationId: number) => [...carsKeys.all, 'trims', modificationId] as const,
}

export function useMarksQuery() {
  return useQuery({
    queryKey: carsKeys.marks(),
    queryFn: fetchMarks,
    staleTime: dayMs,
    gcTime: dayMs,
  })
}

export function useModelsQuery(markId: number | null) {
  return useQuery({
    queryKey: carsKeys.models(markId ?? -1),
    queryFn: () => fetchModels(markId!),
    enabled: typeof markId === 'number' && markId > 0,
    staleTime: dayMs,
  })
}

export function useFiltersQuery(q: CarsQuery | null) {
  return useQuery({
    queryKey: q ? carsKeys.filters(q) : [...carsKeys.all, 'filters', 'none'],
    queryFn: () => fetchFilters(q!),
    enabled: Boolean(q),
    // Чтобы при смене 1 фильтра не было резкого скачка к skeleton'у.
    placeholderData: keepPreviousData,
  })
}

export function useModificationsQuery(q: CarsQuery | null) {
  return useQuery({
    queryKey: q ? carsKeys.modifications(q) : [...carsKeys.all, 'modifications', 'none'],
    queryFn: () => fetchModifications(q!),
    enabled: Boolean(q),
    placeholderData: keepPreviousData,
  })
}

export function useTrimsQuery(modificationId: number | null) {
  return useQuery({
    queryKey: modificationId ? carsKeys.trims(modificationId) : [...carsKeys.all, 'trims', 'none'],
    queryFn: () => fetchTrims(modificationId!),
    enabled: typeof modificationId === 'number' && modificationId > 0,
    staleTime: dayMs,
  })
}
