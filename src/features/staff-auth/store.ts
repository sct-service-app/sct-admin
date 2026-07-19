/**
 * Глобальный auth-store админки.
 * Аналогичен клиентскому, но хранит StaffUser и работает с staffTokens.
 */
import { create } from 'zustand'
import type { StaffUser } from '@/shared/api/types'
import { staffTokens } from '@/shared/api/token-storage'
import { fetchStaffProfile, logoutStaff } from './api'

type StaffPhase = 'idle' | 'loading' | 'authed' | 'guest'

interface StaffAuthState {
  phase: StaffPhase
  user: StaffUser | null
  setSession: (access: string, refresh: string, user: StaffUser) => void
  setUser: (user: StaffUser) => void
  logout: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useStaffAuthStore = create<StaffAuthState>((set) => ({
  phase: 'idle',
  user: null,

  setSession: (access, refresh, user) => {
    staffTokens.setTokens(access, refresh)
    set({ phase: 'authed', user })
  },

  setUser: (user) => set({ user, phase: 'authed' }),

  logout: async () => {
    const refresh = staffTokens.getRefresh()
    if (refresh) {
      try {
        await logoutStaff(refresh)
      } catch {
        // даже если бэк не смог blacklist'нуть refresh — токены локально стираем
      }
    }
    staffTokens.clear()
    set({ phase: 'guest', user: null })
  },

  hydrate: async () => {
    if (!staffTokens.hasSession()) {
      set({ phase: 'guest', user: null })
      return
    }
    set({ phase: 'loading' })
    try {
      const user = await fetchStaffProfile()
      set({ phase: 'authed', user })
    } catch {
      staffTokens.clear()
      set({ phase: 'guest', user: null })
    }
  },
}))
