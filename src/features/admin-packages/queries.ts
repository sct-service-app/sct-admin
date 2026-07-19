import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deletePackage,
  duplicatePackage,
  fetchPackageDetailPageData,
  fetchPackagesListPageData,
  fetchStaffPackages,
} from './api'
import type { PackagesListQuery } from './types'

export const adminPackagesKeys = {
  all: ['admin-packages'] as const,
  list: (q: PackagesListQuery) => [...adminPackagesKeys.all, 'list', q] as const,
  detail: (id: number) => [...adminPackagesKeys.all, 'detail', id] as const,
}

export function usePackagesListPageData(q: PackagesListQuery) {
  return useQuery({
    queryKey: adminPackagesKeys.list(q),
    queryFn: () => fetchPackagesListPageData(q),
    placeholderData: keepPreviousData,
  })
}

/** Сам список пакетов (GET /packages/) — с учётом фильтров из URL. */
export function useStaffPackagesList(q: PackagesListQuery) {
  return useQuery({
    queryKey: [...adminPackagesKeys.all, 'staff-list', q] as const,
    queryFn: () => fetchStaffPackages(q),
    placeholderData: keepPreviousData,
  })
}

export function usePackageDetailPageData(id: number | undefined) {
  return useQuery({
    queryKey: id !== undefined ? adminPackagesKeys.detail(id) : ['admin-packages', 'detail', 'none'],
    queryFn: () => fetchPackageDetailPageData(id!),
    enabled: typeof id === 'number' && Number.isFinite(id),
  })
}

export function useDeletePackageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePackage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminPackagesKeys.all })
    },
  })
}

export function useDuplicatePackageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => duplicatePackage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminPackagesKeys.all })
    },
  })
}
