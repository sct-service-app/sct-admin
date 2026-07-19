/**
 * React Query хуки для админских записей на сервис.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelStaffBooking,
  fetchStaffBooking,
  fetchStaffBookings,
  fetchStaffBookingsOptions,
  updateStaffBooking,
} from './api'
import type {
  CancelPayload,
  StaffBookingPatch,
  StaffBookingsQuery,
} from './types'

export const staffBookingsKeys = {
  all: ['staff-bookings'] as const,
  list: (q?: StaffBookingsQuery) => [...staffBookingsKeys.all, 'list', q ?? {}] as const,
  detail: (id: number) => [...staffBookingsKeys.all, 'detail', id] as const,
  options: () => [...staffBookingsKeys.all, 'options'] as const,
}

export function useStaffBookingsQuery(q?: StaffBookingsQuery) {
  return useQuery({
    queryKey: staffBookingsKeys.list(q),
    queryFn: () => fetchStaffBookings(q),
  })
}

export function useStaffBookingQuery(id: number | undefined) {
  return useQuery({
    queryKey:
      id !== undefined
        ? staffBookingsKeys.detail(id)
        : [...staffBookingsKeys.all, 'detail', 'none'],
    queryFn: () => fetchStaffBooking(id!),
    enabled: typeof id === 'number' && Number.isFinite(id),
  })
}

export function useStaffBookingsOptionsQuery() {
  return useQuery({
    queryKey: staffBookingsKeys.options(),
    queryFn: fetchStaffBookingsOptions,
    staleTime: 5 * 60 * 1000,
  })
}

function invalidateBookings(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: staffBookingsKeys.all })
}

/** Универсальная мутация PATCH /staff/bookings/{id}/ — для всех действий. */
export function useUpdateStaffBookingMutation(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: StaffBookingPatch) => updateStaffBooking(id, payload),
    onSuccess: () => invalidateBookings(qc),
  })
}

export function useCancelStaffBookingMutation(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CancelPayload) => cancelStaffBooking(id, payload),
    onSuccess: () => invalidateBookings(qc),
  })
}
