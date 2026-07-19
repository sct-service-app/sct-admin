import { staffHttp } from '@/shared/api/staff-http'
import { endpoints } from '@/shared/api/endpoints'
import type { AdminCarsListPageData, AdminCarsListQuery } from './types'
import type { StaffCarDetailPageDataResponse } from '@/shared/api/types'

export async function fetchAdminCarsList(q: AdminCarsListQuery) {
  const response = await staffHttp.get<AdminCarsListPageData>(
    endpoints.staffCarsListPageData,
    { params: clean(q as Record<string, unknown>) },
  )
  return response.data
}

export async function fetchAdminCarDetail(sourceId: string) {
  const response = await staffHttp.get<StaffCarDetailPageDataResponse>(
    endpoints.staffCarDetailPageData(sourceId),
  )
  return response.data
}

function clean(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v
  }
  return out
}
