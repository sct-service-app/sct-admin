/**
 * Один раз при старте админки пробует подтянуть профиль стаффа по
 * сохранённому в localStorage access-токену.
 *
 * До завершения hydrate всё, что под RequireStaff, показывает спиннер —
 * чтобы не мигало «гость» → «авторизован».
 */
import { useEffect, type ReactNode } from 'react'
import { useStaffAuthStore } from '@/features/staff-auth/store'

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const staffPhase = useStaffAuthStore((s) => s.phase)
  const hydrateStaff = useStaffAuthStore((s) => s.hydrate)

  useEffect(() => {
    if (staffPhase === 'idle') void hydrateStaff()
  }, [staffPhase, hydrateStaff])

  return <>{children}</>
}
