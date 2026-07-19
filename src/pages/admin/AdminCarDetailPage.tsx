/**
 * Админка → детальная карточка модификации авто.
 *
 * Маршрут: /cars/:sourceId
 * Источник: GET /staff_endpoints/cars/{source_id}/detail-page-data/
 *
 * Структура страницы:
 *   - Hero (фото + название + бейджи)
 *   - Stat-плашки (клиентов / пакетов)
 *   - Технический паспорт (раскрывающиеся секции с items)
 *   - Привязанные пакеты услуг
 *   - Родственные модификации (соседние варианты той же конфигурации)
 */
import { Link, useParams } from 'react-router-dom'
import { useAdminCarDetail } from '@/features/admin-cars/queries'
import { Spinner } from '@/shared/ui/Spinner'
import { Card } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { SafeImage } from '@/shared/ui/SafeImage'
import { formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

export default function AdminCarDetailPage() {
  const params = useParams<{ sourceId: string }>()
  const sourceId = params.sourceId
  const { data, isLoading, isError, refetch } = useAdminCarDetail(sourceId)

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
          <p className="font-bold text-red-700">Модификация не найдена.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
            <Link to="/cars">
              <Button variant="ghost" size="sm">
                К списку
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    )
  }

  // Бэк отдаёт большую структуру, не покрытую schema.yml. Используем `any`,
  // потому что описывать все вложенности здесь не имеет смысла.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any
  const hero = d.hero ?? {}
  const breadcrumbs = (d.breadcrumbs as { label: string; key: string }[]) ?? []
  const technical = d.technical ?? { sections: [] }
  const servicePackages = d.service_packages ?? { results: [] }
  const related = d.related_modifications ?? { results: [] }
  const clientCars = d.client_cars ?? {}
  const compatibleParts = d.compatible_parts ?? { results: [], total: 0, has_parts: false }
  const meta = d.meta ?? {}

  return (
    <section className="container-admin space-y-6 py-8 md:space-y-8 md:py-10">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-textSecondary">
        <Link to="/cars" className="hover:text-brandBlue">
          Staff / Автомобили
        </Link>
        {breadcrumbs.length > 0 && (
          <>
            <span className="text-textSecondary/40">/</span>
            <span className="truncate text-textPrimary max-w-[260px] md:max-w-md">
              {breadcrumbs[breadcrumbs.length - 1]?.label}
            </span>
          </>
        )}
      </nav>

      {/* Hero */}
      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-12 md:p-8">
          <div className="md:col-span-4">
            <div className="aspect-[4/3] overflow-hidden rounded-sct-lg border border-borderLight bg-surfaceLight">
              <SafeImage
                src={hero.image?.url}
                alt={hero.image?.alt ?? hero.full_title}
                className="h-full w-full object-cover"
                fallback={
                  <div className="flex h-full w-full items-center justify-center text-4xl font-900 uppercase text-borderLight">
                    {String(hero.title ?? '').slice(0, 2)}
                  </div>
                }
              />
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-borderLight bg-white">
                <SafeImage
                  src={hero.logo?.url}
                  alt={hero.logo?.alt}
                  className="h-full w-full object-contain p-1"
                  fallback={<div className="h-full w-full" />}
                />
              </div>
              {hero.status?.label && (
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-[10px] font-900 uppercase tracking-widest',
                    hero.status.tone === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-surfaceMuted text-textSecondary',
                  )}
                >
                  {hero.status.label}
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-900 uppercase leading-tight tracking-tight text-textPrimary md:text-4xl">
              {hero.title}
            </h1>
            <p className="mt-2 text-sm font-bold uppercase tracking-tight text-textSecondary md:text-base">
              {hero.full_title}
            </p>
            {hero.badges && hero.badges.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {hero.badges.map((b: { label: string; tone: string }, i: number) => (
                  <Badge key={i} tone={b.tone}>{b.label}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-5">
        <StatCard
          label="Клиентских авто"
          value={clientCars.total ?? 0}
          accent="border-l-brandBlue"
        />
        <StatCard
          label="Активных пакетов"
          value={servicePackages.total ?? 0}
          accent="border-l-green-500"
        />
        <StatCard
          label="Совместимых запчастей"
          value={compatibleParts.total ?? 0}
          accent="border-l-sky-500"
        />
        <StatCard
          label="Родственных модификаций"
          value={related.total ?? 0}
          accent="border-l-brandYellow"
        />
      </div>

      {/* Технический паспорт */}
      {technical.has_specification && technical.sections?.length > 0 && (
        <Card className="overflow-hidden">
          <header className="border-b border-borderLight bg-surfaceLight px-6 py-4">
            <h3 className="text-xl font-900 uppercase tracking-tight">
              Технический паспорт
            </h3>
            <p className="mt-1 text-[11px] font-medium text-textSecondary">
              Полные данные модификации из справочника
            </p>
          </header>

          <div className="space-y-6 p-6 md:p-8">
            {technical.sections.map((section: {
              key: string; title: string; description?: string;
              items: { key: string; label: string; display: string; unit?: string; important?: boolean; is_empty?: boolean }[]
            }) => (
              <section key={section.key}>
                <h4 className="text-[12px] font-900 uppercase tracking-widest text-brandBlue">
                  {section.title}
                </h4>
                {section.description && (
                  <p className="mt-1 text-[11px] text-textSecondary/70">
                    {section.description}
                  </p>
                )}
                <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2 lg:grid-cols-3">
                  {section.items
                    .filter((i) => !i.is_empty)
                    .map((item) => (
                      <div
                        key={item.key}
                        className={cn(
                          'flex justify-between gap-3 border-b border-borderLight/60 pb-1.5',
                          item.important && 'font-bold',
                        )}
                      >
                        <dt className="text-[12px] text-textSecondary">{item.label}</dt>
                        <dd
                          className={cn(
                            'text-right text-[12px]',
                            item.important ? 'text-brandBlue' : 'text-textPrimary',
                          )}
                        >
                          {item.display}
                          {item.unit && (
                            <span className="ml-1 text-[10px] text-textSecondary/60">
                              {item.unit}
                            </span>
                          )}
                        </dd>
                      </div>
                    ))}
                </dl>
              </section>
            ))}
          </div>
        </Card>
      )}

      {/* Сервисные пакеты */}
      <Card className="overflow-hidden">
        <header className="flex items-center justify-between border-b border-borderLight bg-surfaceLight px-6 py-4">
          <div>
            <h3 className="text-xl font-900 uppercase tracking-tight">
              Привязанные пакеты услуг
            </h3>
            <p className="mt-1 text-[11px] font-medium text-textSecondary">
              Всего: {servicePackages.total ?? 0}
            </p>
          </div>
        </header>
        {servicePackages.has_packages && servicePackages.results?.length > 0 ? (
          <ul className="divide-y divide-borderLight">
            {servicePackages.results.map((p: {
              id: number; title: string; category?: { name: string };
              status: string; status_display: string;
              final_price: string; currency: string;
              has_promotion: boolean; items_count?: number;
            }) => (
              <li key={p.id}>
                <Link
                  to={`/packages/${p.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surfaceLight/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-900 uppercase tracking-widest text-brandBlue">
                      {p.category?.name}
                    </p>
                    <p className="mt-1 truncate text-sm font-900 uppercase tracking-tight text-textPrimary">
                      {p.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <PkgStatusBadge value={p.status} label={p.status_display} />
                      {p.has_promotion && (
                        <span className="rounded-md bg-brandYellow/30 px-2 py-0.5 text-[10px] font-900 uppercase tracking-widest text-orange-700">
                          Акция
                        </span>
                      )}
                      {p.items_count != null && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary/70">
                          {p.items_count} поз.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-900 tracking-tighter text-brandBlue">
                      {formatMoney(p.final_price, p.currency)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-sm font-bold text-textSecondary">
            Пакетов услуг пока нет.
          </div>
        )}
      </Card>

      {/* Совместимые запчасти */}
      <Card className="overflow-hidden">
        <header className="flex items-center justify-between border-b border-borderLight bg-surfaceLight px-6 py-4">
          <div>
            <h3 className="text-xl font-900 uppercase tracking-tight">
              Совместимые запчасти
            </h3>
            <p className="mt-1 text-[11px] font-medium text-textSecondary">
              Позиции, используемые в пакетах для этой модификации · всего:{' '}
              {compatibleParts.total ?? 0}
            </p>
          </div>
        </header>

        {compatibleParts.has_parts && compatibleParts.results?.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surfaceLight text-[10px] font-900 uppercase tracking-widest text-textSecondary">
                  <tr>
                    <th className="px-6 py-3">Наименование</th>
                    <th className="px-5 py-3">Код</th>
                    <th className="px-5 py-3">Категория</th>
                    <th className="px-5 py-3">Используется в пакетах</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLight">
                  {compatibleParts.results.map((part: CompatiblePart) => (
                    <tr key={part.id} className="align-top transition-colors hover:bg-surfaceLight/60">
                      <td className="px-6 py-3.5">
                        <p className="font-bold text-textPrimary">{part.name}</p>
                        {part.article && (
                          <p className="mt-0.5 text-[11px] font-medium text-textSecondary/70">
                            Артикул: {part.article}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-textSecondary">
                        {part.display_code ?? part.article ?? '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {part.category?.name ? (
                          <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-900 uppercase tracking-widest text-sky-700">
                            {part.category.name}
                          </span>
                        ) : (
                          <span className="text-textSecondary/50">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <PartPackages packages={part.used_in_packages} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-borderLight md:hidden">
              {compatibleParts.results.map((part: CompatiblePart) => (
                <li key={part.id} className="px-5 py-4">
                  <p className="text-sm font-bold text-textPrimary">{part.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-textSecondary">
                    <span className="font-mono">{part.display_code ?? part.article ?? '—'}</span>
                    {part.category?.name && (
                      <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-900 uppercase tracking-widest text-sky-700">
                        {part.category.name}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <PartPackages packages={part.used_in_packages} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="p-8 text-center text-sm font-bold text-textSecondary">
            Совместимых запчастей пока нет.
          </div>
        )}
      </Card>

      {/* Родственные модификации */}
      {related.results?.length > 0 && (
        <Card className="overflow-hidden">
          <header className="border-b border-borderLight bg-surfaceLight px-6 py-4">
            <h3 className="text-xl font-900 uppercase tracking-tight">
              Соседние модификации
            </h3>
            <p className="mt-1 text-[11px] font-medium text-textSecondary">
              Другие варианты конфигурации той же модели
            </p>
          </header>
          <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-2">
            {related.results.map((r: {
              id: number; trim_source_id: string; name: string;
              power_hp?: number; transmission?: string; drive?: string;
              is_current?: boolean;
            }) => (
              <Link
                key={r.id}
                to={`/cars/${encodeURIComponent(r.trim_source_id)}`}
                className={cn(
                  'flex items-center justify-between rounded-sct border bg-white p-4 transition-all hover:border-brandBlue',
                  r.is_current && 'border-brandBlue shadow-soft-blue',
                )}
              >
                <div>
                  <p className="text-sm font-900 uppercase tracking-tight text-textPrimary">
                    {r.name}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-textSecondary">
                    {r.power_hp && `${r.power_hp} л.с. · `}
                    {r.transmission} · {r.drive}
                  </p>
                </div>
                {r.is_current && (
                  <span className="rounded-md bg-brandBlue px-2 py-1 text-[10px] font-900 uppercase tracking-widest text-white">
                    Текущая
                  </span>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Meta */}
      <Card className="bg-surfaceLight p-5 text-[11px] font-bold text-textSecondary">
        <div className="flex flex-col gap-2 md:flex-row md:justify-between">
          <span>Создано: <span className="text-textPrimary">{meta.created_at_display ?? '—'}</span></span>
          <span>Обновлено: <span className="text-textPrimary">{meta.updated_at_display ?? '—'}</span></span>
        </div>
      </Card>
    </section>
  )
}

/** Запчасть из compatible_parts.results (плоский дедуплицированный список). */
interface CompatiblePartPackage {
  id: number
  title: string
  slug?: string
  quantity?: string
  unit_price?: string
  final_total?: string
  currency?: string
}
interface CompatiblePart {
  id: number
  name: string
  article?: string
  display_code?: string
  item_type?: string
  category?: { id: number; name: string }
  used_in_packages?: CompatiblePartPackage[]
}

function PartPackages({ packages }: { packages?: CompatiblePartPackage[] }) {
  if (!packages || packages.length === 0) {
    return <span className="text-[11px] text-textSecondary/50">—</span>
  }
  return (
    <ul className="space-y-1">
      {packages.map((pkg) => (
        <li key={pkg.id}>
          <Link
            to={`/packages/${pkg.id}`}
            className="inline-flex items-baseline gap-1.5 text-[12px] font-medium text-brandBlue hover:underline"
          >
            <span className="line-clamp-1 max-w-[280px]">{pkg.title}</span>
            {pkg.quantity != null && (
              <span className="shrink-0 text-[10px] font-bold text-textSecondary/70">
                ×{Number(pkg.quantity)}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  const cls =
    tone === 'blue'
      ? 'bg-blue-50 text-brandBlue border-blue-100'
      : tone === 'yellow'
      ? 'bg-brandYellow/20 text-orange-700 border-brandYellow/30'
      : tone === 'success'
      ? 'bg-green-50 text-green-700 border-green-100'
      : 'bg-surfaceLight text-textSecondary border-borderLight'
  return (
    <span className={cn('rounded-md border px-2.5 py-1 text-[10px] font-900 uppercase tracking-widest', cls)}>
      {children}
    </span>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div
      className={`rounded-sct border border-borderLight bg-white p-4 shadow-sct-soft border-l-4 ${accent}`}
    >
      <p className="text-[10px] font-900 uppercase tracking-widest text-textSecondary">
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-900 tracking-tighter text-textPrimary">
        {value.toLocaleString('ru-RU')}
      </p>
    </div>
  )
}

function PkgStatusBadge({ value, label }: { value: string; label: string }) {
  const cls =
    value === 'PUBLISHED'
      ? 'bg-green-50 text-green-700 border-green-100'
      : value === 'DRAFT'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-surfaceMuted text-textSecondary border-borderLight'
  return (
    <span className={cn('rounded border px-2 py-0.5 text-[10px] font-900 uppercase tracking-widest', cls)}>
      {label}
    </span>
  )
}
