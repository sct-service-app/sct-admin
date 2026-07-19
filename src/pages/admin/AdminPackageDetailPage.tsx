/**
 * Просмотр пакета в админке. Источник — staff /packages/{id}/detail-page-data/.
 *
 * Левая колонка (md:col-span-8):
 *   - заголовок, статус, категория
 *   - описание + промо
 *   - состав пакета (товары/услуги отдельно), цены, скидки
 *   - итог (products + services + discount = final)
 *
 * Правая колонка (md:col-span-4):
 *   - обложка
 *   - привязанное авто (модификация + характеристики)
 *   - служебные данные (created_at, updated_at, slug)
 *
 * Действия: «Редактировать», «Дублировать», «Удалить» — берём из ответа,
 * не хардкодим URL'ы.
 */
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useDeletePackageMutation,
  useDuplicatePackageMutation,
  usePackageDetailPageData,
} from '@/features/admin-packages/queries'
import { Spinner } from '@/shared/ui/Spinner'
import { Card } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { SafeImage } from '@/shared/ui/SafeImage'
import { formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { parseApiError } from '@/features/auth/errors'
import type { CompositionItem, DetailCarSpec } from '@/features/admin-packages/detail-types'

export default function AdminPackageDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = usePackageDetailPageData(id)
  const remove = useDeletePackageMutation()
  const duplicate = useDuplicatePackageMutation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

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
          <p className="font-bold text-red-700">Пакет не найден или недоступен.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
            <Link to="/packages">
              <Button variant="ghost" size="sm">
                К списку
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    )
  }

  const pkg = data.package
  const car = data.car
  const totals = data.totals

  const onDelete = () => {
    if (!id) return
    setActionError(null)
    remove.mutate(id, {
      onSuccess: () => navigate('/packages', { replace: true }),
      onError: (err) => {
        setActionError(parseApiError(err, 'Не удалось удалить пакет.').general)
      },
    })
  }

  const onDuplicate = () => {
    if (!id) return
    setActionError(null)
    duplicate.mutate(id, {
      onSuccess: (newPkg) => {
        if (typeof newPkg.id === 'number') {
          navigate(`/packages/${newPkg.id}/edit`, { replace: false })
        }
      },
      onError: (err) => {
        setActionError(parseApiError(err, 'Не удалось дублировать пакет.').general)
      },
    })
  }

  return (
    <section className="container-admin space-y-6 py-8 md:space-y-8 md:py-10">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-textSecondary">
        {data.page.breadcrumbs.map((b, i) => (
          <span key={b.key} className="flex items-center gap-2">
            {i === 0 ? (
              <Link to="/packages" className="hover:text-brandBlue">
                {b.label}
              </Link>
            ) : i < data.page.breadcrumbs.length - 1 ? (
              <Link to="/packages" className="hover:text-brandBlue">
                {b.label}
              </Link>
            ) : (
              <span className="truncate text-textPrimary max-w-[260px] md:max-w-md">
                {b.label}
              </span>
            )}
            {i < data.page.breadcrumbs.length - 1 && (
              <span className="text-textSecondary/40">/</span>
            )}
          </span>
        ))}
      </nav>

      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge value={pkg.status.value} label={pkg.status.label} />
            <span className="rounded-md bg-blue-50 px-3 py-1 text-[11px] font-900 uppercase tracking-widest text-brandBlue">
              {pkg.category.name}
            </span>
            <span className="font-mono text-xs text-textSecondary">ID: #{pkg.id}</span>
          </div>
          <h1 className="mt-3 text-2xl font-900 uppercase leading-tight tracking-tight text-textPrimary md:text-3xl">
            {pkg.title}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            disabled={!data.actions.delete}
          >
            Удалить
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onDuplicate}
            loading={duplicate.isPending}
            disabled={!data.actions.duplicate}
          >
            Дублировать
          </Button>
          <Link to={`/packages/${pkg.id}/edit`}>
            <Button variant="primary" size="sm">
              Редактировать
            </Button>
          </Link>
        </div>
      </header>

      {actionError && (
        <div className="rounded-sct border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
        {/* Левая колонка */}
        <div className="space-y-6 md:col-span-8">
          {/* Описание + промо */}
          <Card className="p-6 md:p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-6">
                {pkg.short_description && (
                  <div>
                    <Label>Краткое описание</Label>
                    <div className="mt-2 rounded-sct border border-borderLight bg-surfaceLight p-4 text-sm font-medium text-textSecondary">
                      {pkg.short_description}
                    </div>
                  </div>
                )}
                {pkg.description && (
                  <div>
                    <Label>Расширенное описание</Label>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-textPrimary">
                      {pkg.description}
                    </p>
                  </div>
                )}
              </div>

              {pkg.promotion.is_active && (
                <div className="rounded-sct-lg border-2 border-brandYellow bg-surfaceLight p-5">
                  <p className="text-[10px] font-900 uppercase tracking-widest text-orange-700">
                    Акция активна
                  </p>
                  {pkg.promotion.title && (
                    <p className="mt-2 text-base font-900 text-textPrimary">
                      {pkg.promotion.title}
                    </p>
                  )}
                  {pkg.promotion.terms && (
                    <p className="mt-3 text-sm font-medium leading-relaxed text-textSecondary">
                      {pkg.promotion.terms}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Состав пакета */}
          <Card className="overflow-hidden">
            <div className="border-b border-borderLight bg-surfaceLight px-6 py-4">
              <h3 className="text-xl font-900 uppercase tracking-tight">
                Состав пакета ({data.composition.items_count})
              </h3>
            </div>
            <CompositionTable items={data.composition.items} />
          </Card>

          {/* Итог */}
          <Card className="p-6 md:p-8">
            <Label>Итоговая стоимость</Label>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Сумма товаров" value={formatMoney(totals.products_total, totals.currency)} />
              <Row label="Сумма услуг" value={formatMoney(totals.services_total, totals.currency)} />
              <Row
                label="Сумма до скидки"
                value={formatMoney(totals.base_total, totals.currency)}
                strong
              />
              {totals.discount_type.value !== 'NONE' && (
                <Row
                  label={`Скидка (${totals.discount_type.label}${
                    totals.discount_type.value === 'PERCENT' ? ` ${totals.discount_percent}%` : ''
                  })`}
                  value={`− ${formatMoney(totals.discount_amount, totals.currency)}`}
                  tone="orange"
                />
              )}
            </div>
            <div className="mt-6 flex items-end justify-between border-t border-borderLight pt-6">
              <span className="text-[11px] font-900 uppercase tracking-widest text-textSecondary">
                К оплате клиентом
              </span>
              <span className="text-3xl font-900 tracking-tighter text-brandBlue md:text-4xl">
                {formatMoney(totals.final_price, totals.currency)}
              </span>
            </div>
            <p className="mt-2 text-right text-[10px] font-bold uppercase tracking-widest text-textSecondary/70">
              {totals.price_mode.label}
            </p>
          </Card>
        </div>

        {/* Правая колонка */}
        <div className="space-y-6 md:col-span-4">
          {/* Обложка */}
          <Card className="overflow-hidden p-0">
            <div className="aspect-[3/4] w-full bg-surfaceLight">
              <SafeImage
                src={pkg.image?.url || undefined}
                alt={pkg.image?.alt || pkg.title}
                className="h-full w-full object-cover"
                fallback={
                  <div className="flex h-full w-full items-center justify-center text-5xl">🛠️</div>
                }
              />
            </div>
            <div className="border-t border-borderLight p-4">
              <Label>Презентация на сайте</Label>
              <p className="mt-1 text-[12px] text-textSecondary">
                Вертикальная обложка услуги
              </p>
            </div>
          </Card>

          {/* Авто */}
          <Card className="bg-surfaceLight/40 p-5">
            <Label small>Привязанный автомобиль</Label>
            <p className="mt-2 text-xl font-900 uppercase tracking-tighter text-textPrimary">
              {car.mark.display_name} {car.model.name}
            </p>
            <p className="mt-1 text-sm font-bold text-brandBlue">
              {car.generation?.display_name}
              {car.generation && ` (${car.generation.year_from}–${car.generation.year_to})`}
            </p>
            {car.specification && (
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-borderLight pt-4">
                <Spec label="Двигатель" value={car.specification.fuel_type?.label} />
                <Spec label="Привод" value={car.specification.drive_type?.label} />
                <Spec label="КПП" value={car.specification.transmission_type?.label} />
                <Spec
                  label="Мощность"
                  value={
                    typeof car.specification.power_hp === 'number'
                      ? `${car.specification.power_hp} л.с.`
                      : undefined
                  }
                />
                <Spec
                  label="Объём"
                  value={
                    typeof car.specification.displacement_cc === 'number'
                      ? `${(car.specification.displacement_cc / 1000).toFixed(1)} л`
                      : undefined
                  }
                />
                <Spec label="Кузов" value={car.configuration?.name} />
              </div>
            )}
            <div className="mt-4 truncate font-mono text-[10px] text-textSecondary/70">
              source_id: {car.modification_source_id}
            </div>
          </Card>

          {/* Служебные */}
          <Card className="bg-surfaceLight p-5 text-[11px] font-bold text-textSecondary">
            <Row label="ID" value={`#${pkg.id}`} />
            <Row label="Создан" value={data.meta.created_at_display} />
            <Row label="Обновлён" value={data.meta.updated_at_display} />
            <Row label="Slug" value={pkg.slug} mono />
            <Row label="sort_order" value={String(pkg.sort_order)} mono />
            {pkg.is_featured && <Row label="Избранный" value="да" />}
          </Card>
        </div>
      </div>

      <DeleteConfirm
        open={confirmDelete}
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />
    </section>
  )
}

function Label({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <p
      className={cn(
        'font-900 uppercase tracking-widest text-textSecondary',
        small ? 'text-[10px]' : 'text-[11px]',
      )}
    >
      {children}
    </p>
  )
}

function Row({
  label,
  value,
  strong,
  tone,
  mono,
}: {
  label: string
  value: string
  strong?: boolean
  tone?: 'orange'
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="uppercase tracking-tighter text-textSecondary/80">{label}</span>
      <span
        className={cn(
          'text-right',
          strong && 'font-900 text-textPrimary',
          tone === 'orange' && 'text-orange-600 font-900',
          mono && 'font-mono text-[10px] text-brandBlue',
          !strong && !tone && !mono && 'font-bold text-textPrimary',
        )}
      >
        {value || '—'}
      </span>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div>
      <p className="text-[10px] font-900 uppercase tracking-widest text-textSecondary/60">{label}</p>
      <p className="mt-0.5 text-sm font-800 uppercase text-textPrimary">{value || '—'}</p>
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
    <span
      className={cn(
        'inline-block rounded-full border px-3 py-1 text-[10px] font-900 uppercase tracking-widest',
        cls,
      )}
    >
      {label}
    </span>
  )
}

function CompositionTable({ items }: { items: CompositionItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center text-sm font-bold text-textSecondary">
        Состав пакета пуст.
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-borderLight bg-white text-[10px] font-900 uppercase tracking-widest text-textSecondary">
            <th className="px-6 py-4 text-left">Номенклатура</th>
            <th className="px-6 py-4 text-center">Тип</th>
            <th className="px-6 py-4 text-center">Кол-во</th>
            <th className="px-6 py-4 text-right">Цена ед.</th>
            <th className="px-6 py-4 text-right">Скидка</th>
            <th className="px-6 py-4 text-right">Итого</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borderLight">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-surfaceLight/60">
              <td className="px-6 py-4">
                <p className="font-bold uppercase text-textPrimary">{item.name}</p>
                {item.article && (
                  <p className="mt-1 font-mono text-[10px] text-textSecondary/70">
                    арт. {item.article}
                  </p>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <span
                  className={cn(
                    'inline-block rounded-md border px-2 py-0.5 text-[10px] font-900 uppercase tracking-widest',
                    item.item_type === 'SERVICE'
                      ? 'border-blue-100 bg-blue-50 text-brandBlue'
                      : 'border-borderLight bg-surfaceLight text-textSecondary',
                  )}
                >
                  {item.item_type === 'SERVICE' ? 'Услуга' : 'Товар'}
                </span>
              </td>
              <td className="px-6 py-4 text-center font-900 text-brandBlue">
                {Number(item.quantity).toLocaleString('ru-RU', { maximumFractionDigits: 3 })}
                {item.unit_name && (
                  <span className="ml-1 text-[10px] font-bold uppercase text-textSecondary">
                    {item.unit_name}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right font-bold text-textPrimary">
                {formatMoney(item.unit_price)}
              </td>
              <td className="px-6 py-4 text-right">
                {item.discount_type !== 'NONE' ? (
                  <span className="font-900 text-green-600">
                    {item.discount_type === 'PERCENT'
                      ? `−${item.discount_percent}%`
                      : `−${formatMoney(item.discount_amount)}`}
                  </span>
                ) : (
                  <span className="text-textSecondary/40">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-right font-900 text-brandBlue">
                {formatMoney(item.final_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DeleteConfirm({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal open={open} onClose={onCancel} title="Удалить пакет?" disableOverlayClose={loading}>
      <p className="text-sm text-textSecondary">
        Пакет будет удалён вместе с составом. <b>PackageItem</b> в справочнике
        останутся — только связь будет разорвана.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
          Отмена
        </Button>
        <Button variant="danger" fullWidth onClick={onConfirm} loading={loading}>
          Удалить
        </Button>
      </div>
    </Modal>
  )
}

// Используется ниже только для типа TS
export type { DetailCarSpec }
