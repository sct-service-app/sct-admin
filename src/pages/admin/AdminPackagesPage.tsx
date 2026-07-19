/**
 * Список пакетов в админке.
 *
 * Бэк (сверено на dev 2026-07-02) разделил данные на два источника:
 *  - GET /packages/list-page-data/ — оболочка: page{title,description},
 *    stats.summary, filters (справочники). Список пакетов НЕ возвращает.
 *  - GET /packages/ — сам список: results[] + pagination.
 *
 * Поэтому тянем оба: list-page-data для шапки/статистики/справочников,
 * /packages/ — для строк таблицы и пагинации. Состояние фильтров живёт в URL.
 *
 * Вкладки (all/published/draft/promotional) бэк больше не отдаёт — держим их
 * на фронте (маппятся на status / has_promotion). Панель «фильтры по авто»
 * убрана: бэк перестал присылать справочники марок/моделей.
 */
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  usePackagesListPageData,
  useStaffPackagesList,
} from '@/features/admin-packages/queries'
import { Spinner } from '@/shared/ui/Spinner'
import { Button } from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { Card } from '@/shared/ui/Card'
import { formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import type {
  PackageListItem,
  PackagesListQuery,
  StatsSummary,
} from '@/features/admin-packages/types'

const ALLOWED_PAGE_SIZES = [10, 20, 50, 100] as const
type PageSize = (typeof ALLOWED_PAGE_SIZES)[number]

interface TabDef {
  key: string
  label: string
  filter: { status?: string; has_promotion?: boolean }
}

const TABS: TabDef[] = [
  { key: 'all', label: 'Все', filter: {} },
  { key: 'published', label: 'Опубликованные', filter: { status: 'PUBLISHED' } },
  { key: 'draft', label: 'Черновики', filter: { status: 'DRAFT' } },
  { key: 'promotional', label: 'Акционные', filter: { has_promotion: true } },
]

function parsePageSize(raw: string | null): PageSize {
  const n = Number(raw)
  return (ALLOWED_PAGE_SIZES as readonly number[]).includes(n) ? (n as PageSize) : 20
}

export default function AdminPackagesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query: PackagesListQuery = useMemo(
    () => ({
      search: searchParams.get('search') ?? undefined,
      category: numberOrUndefined(searchParams.get('category')),
      status: searchParams.get('status') ?? undefined,
      has_promotion: booleanOrUndefined(searchParams.get('has_promotion')),
      ordering: searchParams.get('ordering') ?? undefined,
      page: Number(searchParams.get('page')) || 1,
      page_size: parsePageSize(searchParams.get('page_size')),
    }),
    [searchParams],
  )

  const anyFiltersActive = ['search', 'category', 'status', 'has_promotion'].filter((k) =>
    searchParams.get(k),
  ).length

  // Оболочка страницы (статистика + справочники) — глобальная, без фильтров.
  const { data, isLoading, isError, refetch } = usePackagesListPageData({})
  // Сам список — с учётом фильтров из URL.
  const listQuery = useStaffPackagesList(query)

  const updateParam = (patch: Record<string, string | undefined | null>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') next.delete(k)
      else next.set(k, v)
    })
    // При смене фильтров сбрасываем страницу.
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <section className="container-admin py-10">
        <Card className="p-6 text-center">
          <p className="font-bold text-red-700">Не удалось загрузить пакеты.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Повторить
          </Button>
        </Card>
      </section>
    )
  }

  const currentTabKey = guessActiveTab(query, TABS)
  const packages = listQuery.data

  return (
    <section className="container-admin space-y-6 py-8 md:space-y-8 md:py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-900 uppercase tracking-[0.3em] text-brandBlue">
            Каталог / Пакеты услуг
          </p>
          <h1 className="mt-2 text-3xl font-900 uppercase tracking-tight text-textPrimary md:text-4xl">
            {data.page.title}
          </h1>
          {data.page.description && (
            <p className="mt-1 text-sm font-medium text-textSecondary">
              {data.page.description}
            </p>
          )}
        </div>
        <Link to="/packages/new">
          <Button variant="primary" size="md">
            + Создать пакет
          </Button>
        </Link>
      </header>

      <StatsRow summary={data.stats.summary} />

      {/* Вкладки (клиентские — бэк их больше не отдаёт) */}
      <div className="flex flex-wrap gap-2 border-b border-borderLight pb-2">
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            isActive={tab.key === currentTabKey}
            onClick={() =>
              updateParam({
                status: tab.filter.status ?? null,
                has_promotion:
                  typeof tab.filter.has_promotion === 'boolean'
                    ? String(tab.filter.has_promotion)
                    : null,
              })
            }
          />
        ))}
      </div>

      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <Input
              label="Поиск"
              placeholder="Название, авто, артикул…"
              value={searchParams.get('search') ?? ''}
              onChange={(e) => updateParam({ search: e.target.value || null })}
            />
          </div>
          <div className="md:col-span-3">
            <Select
              label="Категория"
              value={searchParams.get('category') ?? ''}
              onChange={(e) => updateParam({ category: e.target.value || null })}
            >
              <option value="">Все категории</option>
              {data.filters.categories.map((opt) => (
                <option key={opt.id} value={String(opt.id)}>
                  {opt.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Select
              label="Акции"
              value={searchParams.get('has_promotion') ?? ''}
              onChange={(e) => updateParam({ has_promotion: e.target.value || null })}
            >
              <option value="">Все</option>
              <option value="true">Только акции</option>
              <option value="false">Без акции</option>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select
              label="Сортировка"
              value={searchParams.get('ordering') ?? ''}
              onChange={(e) => updateParam({ ordering: e.target.value || null })}
            >
              <option value="">По умолчанию</option>
              <option value="title">Название ↑</option>
              <option value="-title">Название ↓</option>
              <option value="final_price">Цена ↑</option>
              <option value="-final_price">Цена ↓</option>
              <option value="-created_at">Создано ↓</option>
              <option value="-updated_at">Обновлено ↓</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-borderLight pt-4">
          <div className="w-40">
            <Select
              label="На странице"
              value={String(query.page_size)}
              onChange={(e) => updateParam({ page_size: e.target.value, page: '1' })}
            >
              {ALLOWED_PAGE_SIZES.map((size) => (
                <option key={size} value={String(size)}>
                  {size}
                </option>
              ))}
            </Select>
          </div>
          {anyFiltersActive > 0 && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="text-[11px] font-900 uppercase tracking-widest text-red-600 hover:underline"
            >
              Сбросить все
            </button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {listQuery.isError ? (
          <div className="p-10 text-center">
            <p className="font-bold text-red-700">Не удалось загрузить список пакетов.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => listQuery.refetch()}
            >
              Повторить
            </Button>
          </div>
        ) : (
          <ResultsTable items={packages?.results ?? []} loading={listQuery.isFetching} />
        )}
      </Card>

      {packages?.pagination && (
        <PaginationBar
          page={packages.pagination.page}
          totalPages={packages.pagination.total_pages}
          count={packages.pagination.count}
          pageSize={packages.pagination.page_size}
          onChange={(p) => updateParam({ page: String(p) })}
        />
      )}
    </section>
  )
}

function guessActiveTab(q: PackagesListQuery, tabs: TabDef[]): string {
  for (const tab of tabs) {
    const keys = Object.keys(tab.filter)
    if (keys.length === 0) continue // вкладка 'all' — по умолчанию
    const matches = keys.every((k) => {
      const actual = (q as Record<string, unknown>)[k] ?? null
      const expected = (tab.filter as Record<string, unknown>)[k] ?? null
      return actual === expected
    })
    if (matches) return tab.key
  }
  return 'all'
}

function StatsRow({ summary }: { summary: StatsSummary }) {
  const cards = [
    { label: 'Всего', value: summary.total, accent: 'border-l-brandBlue' },
    { label: 'Опубликовано', value: summary.published, accent: 'border-l-green-500' },
    { label: 'Акционные', value: summary.with_promotion, accent: 'border-l-brandYellow' },
    { label: 'Черновики', value: summary.draft, accent: 'border-l-slate-400' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-sct border border-borderLight bg-white p-4 shadow-sct-soft border-l-4 ${c.accent}`}
        >
          <p className="text-[10px] font-900 uppercase tracking-widest text-textSecondary">
            {c.label}
          </p>
          <p className="mt-1.5 text-3xl font-900 tracking-tighter text-textPrimary">
            {c.value.toLocaleString('ru-RU')}
          </p>
        </div>
      ))}
    </div>
  )
}

function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: TabDef
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-4 py-2 text-[12px] font-900 uppercase tracking-widest transition-colors',
        isActive
          ? 'bg-brandBlue text-white shadow-soft-blue'
          : 'text-textSecondary hover:bg-surfaceLight hover:text-textPrimary',
      )}
    >
      {tab.label}
    </button>
  )
}

function ResultsTable({ items, loading }: { items: PackageListItem[]; loading: boolean }) {
  if (items.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-base font-bold text-textSecondary">
          Под выбранные фильтры пакетов не найдено.
        </p>
      </div>
    )
  }
  return (
    <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-borderLight bg-surfaceLight text-[10px] font-900 uppercase tracking-widest text-textSecondary">
            <th className="px-6 py-4 text-left">ID</th>
            <th className="px-6 py-4 text-left">Пакет</th>
            <th className="px-6 py-4 text-left">Категория</th>
            <th className="px-6 py-4 text-left">Автомобиль</th>
            <th className="px-6 py-4 text-center">Акция</th>
            <th className="px-6 py-4 text-left">Статус</th>
            <th className="px-6 py-4 text-right">Цена</th>
            <th className="px-6 py-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-borderLight">
          {items.map((pkg) => (
            <tr key={pkg.id} className="transition-colors hover:bg-surfaceLight/60">
              <td className="px-6 py-4 font-mono text-xs font-bold text-textSecondary">
                #{pkg.id}
              </td>
              <td className="px-6 py-4">
                <div className="font-bold text-textPrimary">{pkg.title}</div>
              </td>
              <td className="px-6 py-4 text-textSecondary">{pkg.category?.name ?? '—'}</td>
              <td className="px-6 py-4">
                <div className="font-bold text-textPrimary">{pkg.car_title || '—'}</div>
              </td>
              <td className="px-6 py-4 text-center">
                {pkg.has_promotion ? (
                  <span className="rounded-md bg-brandYellow/30 px-2 py-0.5 text-[10px] font-900 uppercase tracking-widest text-orange-700">
                    Да
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-textSecondary/40">—</span>
                )}
              </td>
              <td className="px-6 py-4">
                <StatusBadge value={pkg.status} label={pkg.status_display} />
              </td>
              <td className="px-6 py-4 text-right font-900 text-brandBlue">
                {formatMoney(pkg.final_price, pkg.currency)}
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  to={`/packages/${pkg.id}`}
                  className="text-[11px] font-bold uppercase tracking-widest text-brandBlue hover:underline"
                >
                  Открыть →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ value, label }: { value: string; label: string }) {
  const cls =
    value === 'PUBLISHED'
      ? 'bg-green-50 text-green-700 border-green-100'
      : value === 'DRAFT'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : value === 'UNPUBLISHED'
      ? 'bg-surfaceMuted text-textSecondary border-borderLight'
      : 'bg-red-50 text-red-700 border-red-100'
  return (
    <span className={cn('inline-block rounded-full border px-3 py-1 text-[10px] font-900 uppercase tracking-widest', cls)}>
      {label}
    </span>
  )
}

function PaginationBar({
  page,
  totalPages,
  count,
  pageSize,
  onChange,
}: {
  page: number
  totalPages: number
  count: number
  pageSize: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-center text-[11px] font-bold uppercase tracking-widest text-textSecondary">
        Всего пакетов: {count.toLocaleString('ru-RU')}
      </p>
    )
  }
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, count)
  return (
    <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
      <p className="text-[11px] font-bold uppercase tracking-widest text-textSecondary">
        Показано {start}–{end} из {count.toLocaleString('ru-RU')}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Назад
        </Button>
        <span className="text-xs font-bold uppercase tracking-widest text-textSecondary">
          Стр. {page} из {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Вперёд →
        </Button>
      </div>
    </div>
  )
}

function numberOrUndefined(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function booleanOrUndefined(value: string | null): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}
