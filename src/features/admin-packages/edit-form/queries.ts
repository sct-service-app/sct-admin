import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPackage,
  fetchPackageForEdit,
  searchPackageItems,
  updatePackage,
} from './api'
import { adminPackagesKeys } from '../queries'

export const editFormKeys = {
  package: (id: number) => ['admin-packages', 'edit-source', id] as const,
  itemSearch: (q: string) => ['admin-packages', 'item-search', q] as const,
}

export function usePackageForEdit(id: number | undefined) {
  return useQuery({
    queryKey: id !== undefined ? editFormKeys.package(id) : ['admin-packages', 'edit-source', 'none'],
    queryFn: () => fetchPackageForEdit(id!),
    enabled: typeof id === 'number' && Number.isFinite(id),
  })
}

export function useCreatePackageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPackage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminPackagesKeys.all })
    },
  })
}

export function useUpdatePackageMutation(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof updatePackage>[1]) => updatePackage(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminPackagesKeys.all })
      qc.invalidateQueries({ queryKey: editFormKeys.package(id) })
    },
  })
}

export function usePackageItemSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: editFormKeys.itemSearch(trimmed),
    queryFn: () => searchPackageItems(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  })
}
