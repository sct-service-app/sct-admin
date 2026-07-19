/**
 * Список Telegram VIN-заявок (реальный API).
 *
 * Сверху стат-карточки (из /stats/) = серверные фильтры (status / has_car /
 * has_vin). Поиск и фильтры уходят на бэк (?search=&status=&has_*=).
 * Колонки: ID / Дата / Фото / Госномер / VIN / Авто клиента / Telegram /
 * Статус / Действие.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useTelegramRequestsQuery,
  useTelegramStatsQuery,
} from '@/features/admin-telegram/queries'
import { telegramStatusMeta } from '@/features/admin-telegram/types'
import type {
  TelegramRequest,
  TelegramRequestsQuery,
} from '@/features/admin-telegram/types'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { SafeImage } from '@/shared/ui/SafeImage'
import { Spinner } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'
import { formatDateTime } from '@/shared/lib/format'

type Bucket = 'all' | 'new' | 'with_car' | 'with_vin' | 'no_car'

const BUCKET_QUERY: Record<Bucket, TelegramRequestsQuery> = {
  all: {},
  new: { status: 'new' },
  with_car: { has_car: true },
  with_vin: { has_vin: true },
  no_car: { has_car: false },
}

export default function AdminTelegramRequestsPage() {
  const [bucket, setBucket] = useState<Bucket>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Дебаунс поиска — на бэк уходит не на каждое нажатие.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const query = useMemo<TelegramRequestsQuery>(
    () => ({ ...BUCKET_QUERY[bucket], ...(search ? { search } : {}), ordering: '-created_at' }),
    [bucket, search],
  )

  const { data: stats } = useTelegramStatsQuery()
  const { data, isLoading, isError, refetch } = useTelegramRequestsQuery(query)
  const rows = data ?? []

  return (
    <section className="space-y-6">
      <header>
        <p className="text-[11px] font-900 uppercase tracking-[0.22em] text-brandBlue">Telegram VIN</p>
        <h1 className="mt-1 text-2xl font-900 uppercase tracking-tight text-textPrimary md:text-3xl">
          VIN-заявки из Telegram
        </h1>
        <p className="mt-2 text-sm font-medium text-textSecondary">
          Касса присылает фото госномера и VIN — менеджер находит авто и присваивает VIN.
        </p>
      </header>

      {/* Стат-карточки = серверные фильтры */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Всего" value={stats?.total} active={bucket === 'all'} onClick={() => setBucket('all')} tone="text-textPrimary" />
        <StatCard label="Новые" value={stats?.new} active={bucket === 'new'} onClick={() => setBucket('new')} tone="text-brandBlue" />
        <StatCard label="С авто" value={stats?.with_car} active={bucket === 'with_car'} onClick={() => setBucket('with_car')} tone="text-indigo-700" />
        <StatCard label="С VIN" value={stats?.with_vin} active={bucket === 'with_vin'} onClick={() => setBucket('with_vin')} tone="text-green-700" />
        <StatCard label="Без авто" value={stats?.without_car} active={bucket === 'no_car'} onClick={() => setBucket('no_car')} tone="text-amber-700" />
      </div>

      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-2">
            {bucket !== 'all' && (
              <button
                type="button"
                onClick={() => setBucket('all')}
                className="rounded-full border border-borderLight bg-white px-4 py-2 text-[11px] font-900 uppercase tracking-widest text-textSecondary transition-colors hover:border-brandBlue/40"
              >
                × Сбросить фильтр
              </button>
            )}
          </div>
          <div className="md:w-80">
            <Input
              label="Поиск"
              placeholder="ID, госномер, VIN, телефон, @username…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p className="text-sm font-bold text-red-700">Не удалось загрузить заявки.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-sct border border-borderLight bg-white px-4 py-2 text-xs font-900 uppercase tracking-widest text-textSecondary hover:border-brandBlue hover:text-brandBlue"
            >
              Повторить
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm font-medium text-textSecondary">
            По выбранным фильтрам заявок нет.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surfaceLight text-[10px] font-900 uppercase tracking-widest text-textSecondary">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Дата</th>
                    <th className="px-5 py-3">Фото</th>
                    <th className="px-5 py-3">Госномер</th>
                    <th className="px-5 py-3">VIN</th>
                    <th className="px-5 py-3">Авто клиента</th>
                    <th className="px-5 py-3">Telegram</th>
                    <th className="px-5 py-3 text-center">Статус</th>
                    <th className="px-5 py-3 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLight">
                  {rows.map((r) => (
                    <Row key={r.id} r={r} />
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-borderLight lg:hidden">
              {rows.map((r) => (
                <CardMobile key={r.id} r={r} />
              ))}
            </ul>
          </>
        )}
      </Card>
    </section>
  )
}

function StatCard({
  label,
  value,
  active,
  onClick,
  tone,
}: {
  label: string
  value: number | undefined
  active: boolean
  onClick: () => void
  tone: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-sct border bg-white p-4 text-left transition-all',
        active ? 'border-brandBlue shadow-soft-blue' : 'border-borderLight hover:border-brandBlue/40',
      )}
    >
      <p className="text-[10px] font-900 uppercase tracking-widest text-textSecondary">{label}</p>
      <p className={cn('mt-1 text-2xl font-900 tracking-tight', tone)}>
        {value ?? '—'}
      </p>
    </button>
  )
}

function PhotoThumb({ url, title }: { url: string | null; title: string }) {
  return (
    <span
      className="block h-9 w-9 overflow-hidden rounded-md border border-borderLight bg-surfaceMuted"
      title={title}
    >
      <SafeImage
        src={url ?? undefined}
        alt={title}
        className="h-full w-full object-cover"
        fallback={
          <span className="flex h-full w-full items-center justify-center text-textSecondary/60">
            <CamIcon />
          </span>
        }
      />
    </span>
  )
}

function CamIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h1l1.5-2h9L17 7h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <circle cx="12" cy="13" r="3" strokeWidth={1.8} />
    </svg>
  )
}

function StatusPill({ r }: { r: TelegramRequest }) {
  const meta = telegramStatusMeta(r.status)
  return (
    <span className={cn('inline-block rounded-md px-2.5 py-1 text-[10px] font-900 uppercase tracking-widest', meta.tone)}>
      {meta.label}
    </span>
  )
}

function Row({ r }: { r: TelegramRequest }) {
  return (
    <tr className="hover:bg-surfaceLight/50">
      <td className="px-5 py-4 font-900 text-textPrimary">#{r.id}</td>
      <td className="px-5 py-4 text-textSecondary">{formatDateTime(r.created_at)}</td>
      <td className="px-5 py-4">
        <div className="flex gap-1.5">
          <PhotoThumb url={r.plate_photo_url} title="Фото госномера" />
          <PhotoThumb url={r.vin_photo_url} title="Фото VIN" />
        </div>
      </td>
      <td className="px-5 py-4">
        {r.detected_license_plate ? (
          <span className="rounded bg-surfaceMuted px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-textPrimary">{r.detected_license_plate}</span>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">нет</span>
        )}
      </td>
      <td className="px-5 py-4">
        {r.detected_vin_code ? (
          <span className="font-mono text-[11px] text-textPrimary">{r.detected_vin_code}</span>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">нет</span>
        )}
      </td>
      <td className="px-5 py-4">
        {r.client_car ? (
          <span className="font-bold text-textPrimary">{r.client_car.full_car_title}</span>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-widest text-rose-600">не привязано</span>
        )}
      </td>
      <td className="px-5 py-4 font-mono text-[12px] text-textSecondary">@{r.telegram_username}</td>
      <td className="px-5 py-4 text-center"><StatusPill r={r} /></td>
      <td className="px-5 py-4 text-right">
        <Link to={`/telegram/${r.id}`} className="inline-block rounded-md bg-brandBlue px-3 py-1.5 text-[10px] font-900 uppercase tracking-widest text-white hover:bg-brandBlueDark">
          Открыть
        </Link>
      </td>
    </tr>
  )
}

function CardMobile({ r }: { r: TelegramRequest }) {
  return (
    <li>
      <Link to={`/telegram/${r.id}`} className="block p-4 transition-colors hover:bg-surfaceLight/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-900 text-textPrimary">#{r.id}</p>
            <p className="mt-0.5 text-[12px] font-bold text-textSecondary">{formatDateTime(r.created_at)}</p>
          </div>
          <StatusPill r={r} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="font-mono font-bold text-textPrimary">{r.detected_license_plate || 'без госномера'}</span>
          <span className="text-textSecondary/50">·</span>
          <span className="text-textSecondary">{r.client_car?.full_car_title ?? 'авто не привязано'}</span>
        </div>
      </Link>
    </li>
  )
}
