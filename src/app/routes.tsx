/**
 * Роутер админки SCT.
 *
 * Админка вынесена в отдельный проект (sct-admin) и деплоится на свой домен,
 * поэтому отдаётся с корня — без префикса /admin.
 *
 *   /login                    — вход стаффа (без StaffLayout)
 *   /                         — редирект на /packages
 *   /bookings                 — записи
 *   /telegram                 — VIN-заявки
 *   /packages                 — пакеты услуг
 *   /cars                     — автомобили
 */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { StaffLayout } from '@/app/StaffLayout'
import { RequireStaff } from '@/app/RequireStaff'

const StaffLoginPage = lazy(() => import('@/pages/admin/StaffLoginPage'))
const AdminPackagesPage = lazy(() => import('@/pages/admin/AdminPackagesPage'))
const AdminPackageDetailPage = lazy(() => import('@/pages/admin/AdminPackageDetailPage'))
const AdminPackageEditPage = lazy(() => import('@/pages/admin/AdminPackageEditPage'))
const AdminCarsPage = lazy(() => import('@/pages/admin/AdminCarsPage'))
const AdminCarDetailPage = lazy(() => import('@/pages/admin/AdminCarDetailPage'))
const AdminBookingsPage = lazy(() => import('@/pages/admin/AdminBookingsPage'))
const AdminBookingDetailPage = lazy(() => import('@/pages/admin/AdminBookingDetailPage'))
const AdminTelegramRequestsPage = lazy(() => import('@/pages/admin/AdminTelegramRequestsPage'))
const AdminTelegramRequestDetailPage = lazy(
  () => import('@/pages/admin/AdminTelegramRequestDetailPage'),
)

export const router = createBrowserRouter([
  // Логин — отдельной страницей без StaffLayout (header админки показывать
  // нет смысла, пока стафф не вошёл).
  { path: '/login', element: <StaffLoginPage /> },
  {
    path: '/',
    element: (
      <RequireStaff>
        <StaffLayout />
      </RequireStaff>
    ),
    children: [
      { index: true, element: <Navigate to="/packages" replace /> },
      { path: 'packages', element: <AdminPackagesPage /> },
      { path: 'packages/new', element: <AdminPackageEditPage /> },
      { path: 'packages/:id', element: <AdminPackageDetailPage /> },
      { path: 'packages/:id/edit', element: <AdminPackageEditPage /> },
      { path: 'cars', element: <AdminCarsPage /> },
      { path: 'cars/:sourceId', element: <AdminCarDetailPage /> },
      { path: 'bookings', element: <AdminBookingsPage /> },
      { path: 'bookings/:id', element: <AdminBookingDetailPage /> },
      { path: 'telegram', element: <AdminTelegramRequestsPage /> },
      { path: 'telegram/:id', element: <AdminTelegramRequestDetailPage /> },
    ],
  },
  // Всё неизвестное — в корень (RequireStaff сам решит, показать контент
  // или увести на /login).
  { path: '*', element: <Navigate to="/" replace /> },
])
