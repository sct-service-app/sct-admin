/**
 * React Query хуки Telegram VIN-заявок. Источник — реальный staff-API (api.ts).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  assignVin,
  deleteTelegramRequest,
  fetchTelegramRequest,
  fetchTelegramRequests,
  fetchTelegramStats,
  findClientCar,
  patchTelegramRequest,
} from './api'
import type {
  TelegramAssignVinPayload,
  TelegramFindCarPayload,
  TelegramRequestPatch,
  TelegramRequestsQuery,
} from './types'

export const telegramKeys = {
  all: ['telegram-requests'] as const,
  list: (q?: TelegramRequestsQuery) => [...telegramKeys.all, 'list', q ?? {}] as const,
  detail: (id: number) => [...telegramKeys.all, 'detail', id] as const,
  stats: () => [...telegramKeys.all, 'stats'] as const,
}

export function useTelegramRequestsQuery(q?: TelegramRequestsQuery) {
  return useQuery({
    queryKey: telegramKeys.list(q),
    queryFn: () => fetchTelegramRequests(q),
    staleTime: 30_000,
  })
}

export function useTelegramRequestQuery(id: number | undefined) {
  return useQuery({
    queryKey:
      id !== undefined ? telegramKeys.detail(id) : [...telegramKeys.all, 'detail', 'none'],
    queryFn: () => fetchTelegramRequest(id!),
    enabled: typeof id === 'number' && Number.isFinite(id),
  })
}

export function useTelegramStatsQuery() {
  return useQuery({
    queryKey: telegramKeys.stats(),
    queryFn: fetchTelegramStats,
    staleTime: 30_000,
  })
}

function invalidateTelegram(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: telegramKeys.all })
}

export function usePatchTelegramRequestMutation(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: TelegramRequestPatch) => patchTelegramRequest(id, payload),
    onSuccess: () => invalidateTelegram(qc),
  })
}

export function useFindClientCarMutation(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: TelegramFindCarPayload) => findClientCar(id, payload),
    onSuccess: () => invalidateTelegram(qc),
  })
}

export function useAssignVinMutation(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: TelegramAssignVinPayload) => assignVin(id, payload),
    onSuccess: () => invalidateTelegram(qc),
  })
}

export function useDeleteTelegramRequestMutation(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deleteTelegramRequest(id),
    onSuccess: () => invalidateTelegram(qc),
  })
}
