/**
 * Guard для admin-роутов. Если стафф не залогинен — редирект на /login.
 * После успешного входа RequireStaff пропустит запросом, и страница покажет
 * нужный контент.
 */
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useStaffAuthStore } from '@/features/staff-auth/store'
import { Spinner } from '@/shared/ui/Spinner'

export function RequireStaff({ children }: { children: ReactNode }) {
  const phase = useStaffAuthStore((s) => s.phase)
  const location = useLocation()

  if (phase === 'idle' || phase === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (phase === 'guest') {
    const nextPath = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${nextPath}`} replace />
  }
  return <>{children}</>
}
