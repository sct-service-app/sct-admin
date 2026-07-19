/**
 * Layout админки: отдельный header, своя навигация, ссылка на выход.
 *
 * Цветовая схема та же, но навигация компактнее, и в правом углу — username
 * стаффа и кнопка Logout, которая дёргает /staff/auth/logout/.
 */
import { Suspense } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStaffAuthStore } from '@/features/staff-auth/store'
import { Spinner } from '@/shared/ui/Spinner'
import { ToastViewport } from '@/shared/ui/Toast'
import { ErrorBoundary } from './ErrorBoundary'
import { cn } from '@/shared/lib/cn'

const nav = [
  { to: '/bookings', label: 'Записи' },
  { to: '/telegram', label: 'VIN-заявки' },
  { to: '/packages', label: 'Пакеты услуг' },
  { to: '/cars', label: 'Автомобили' },
]

export function StaffLayout() {
  const user = useStaffAuthStore((s) => s.user)
  const logout = useStaffAuthStore((s) => s.logout)
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-surfaceLight/60">
      <header className="sticky top-0 z-40 border-b border-borderLight bg-white/95 backdrop-blur">
        <div className="container-admin flex h-16 items-center justify-between md:h-20">
          <div className="flex items-center gap-8 md:gap-12">
            <Link to="/packages" className="text-xl font-900 uppercase tracking-tight text-brandBlue md:text-2xl">
              SCT <span className="text-textPrimary">Admin</span>
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-bold transition-colors',
                      isActive
                        ? 'bg-blue-50 text-brandBlue'
                        : 'text-textSecondary hover:bg-surfaceLight hover:text-textPrimary',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden text-right md:block">
                <p className="text-[12px] font-900 uppercase leading-none text-textPrimary">
                  {user.username || 'Администратор'}
                </p>
                <button
                  onClick={() => logout()}
                  className="mt-1 text-[10px] font-bold uppercase tracking-widest text-brandBlue hover:underline"
                >
                  Выйти
                </button>
              </div>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brandBlue text-sm font-900 text-white shadow-lg shadow-blue-200">
              {(user?.username?.charAt(0) || 'A').toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <ErrorBoundary resetKeys={[location.pathname]}>
          <Suspense
            fallback={
              <div className="flex min-h-[50vh] items-center justify-center">
                <Spinner />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <ToastViewport />
    </div>
  )
}
