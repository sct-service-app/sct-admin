import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchAdminCarDetail, fetchAdminCarsList } from './api'
import type { AdminCarsListQuery } from './types'

export const adminCarsKeys = {
  all: ['admin-cars'] as const,
  list: (q: AdminCarsListQuery) => [...adminCarsKeys.all, 'list', q] as const,
  detail: (sourceId: string) => [...adminCarsKeys.all, 'detail', sourceId] as const,
}

export function useAdminCarsList(q: AdminCarsListQuery) {
  return useQuery({
    queryKey: adminCarsKeys.list(q),
    queryFn: () => fetchAdminCarsList(q),
    placeholderData: keepPreviousData,
  })
}

export function useAdminCarDetail(sourceId: string | undefined) {
  return useQuery({
    queryKey:
      sourceId !== undefined ? adminCarsKeys.detail(sourceId) : ['admin-cars', 'detail', 'none'],
    queryFn: () => fetchAdminCarDetail(sourceId!),
    enabled: Boolean(sourceId),
  })
}
