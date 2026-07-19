/**
 * Детальная админ-запись (v2, по bookings_detail_v2.html).
 *
 * Единая форма + dirty-diff PATCH: по «Сохранить изменения» сравниваем стейт
 * с серверным detail и шлём ОДНИМ PATCH только изменённые поля. Быстрые
 * действия в сайдбаре — мгновенный PATCH статуса. Отмена — отдельный POST,
 * блок вшит в форму.
 *
 * Ограничение API: пробег = только mileage_km (полей источника/комментария
 * в схеме нет). Время визита редактируем датой+временем → scheduled_datetime.
 * status_label бэк не отдаёт — ярлык из STATUS_META. Без italic.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useCancelStaffBookingMutation,
  useStaffBookingQuery,
  useStaffBookingsOptionsQuery,
  useUpdateStaffBookingMutation,
} from '@/features/admin-bookings/queries'
import { Card } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { SearchableSelect } from '@/shared/ui/SearchableSelect'
import { Textarea } from '@/shared/ui/Textarea'
import { Spinner } from '@/shared/ui/Spinner'
import { toast } from '@/shared/ui/Toast'
import { parseApiError } from '@/features/auth/errors'
import { formatDateTime, formatMoney } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import type { StaffBookingDetail, StaffBookingPatch } from '@/features/admin-bookings/types'

const STATUS_META: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: 'Черновик', tone: 'bg-surfaceMuted text-textSecondary' },
  CREATED: { label: 'Новая', tone: 'bg-blue-50 text-brandBlue' },
  CONFIRMED: { label: 'Подтверждена', tone: 'bg-green-50 text-green-700' },
  IN_PROGRESS: { label: 'В работе', tone: 'bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Завершена', tone: 'bg-slate-100 text-slate-700' },
  CANCELLED_BY_CLIENT: { label: 'Отменена клиентом', tone: 'bg-rose-50 text-rose-700' },
  CANCELLED_BY_STAFF: { label: 'Отменена сотрудником', tone: 'bg-rose-50 text-rose-700' },
  NO_SHOW: { label: 'Не приехал', tone: 'bg-rose-50 text-rose-700' },
}
const STATUS_ORDER = [
  'DRAFT',
  'CREATED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED_BY_CLIENT',
  'CANCELLED_BY_STAFF',
  'NO_SHOW',
]

interface FormState {
  status: string
  visit_date: string
  visit_time: string
  service_station_id: string
  service_type: 'PACKAGE' | 'DEFAULT'
  service_package_id: string
  default_service_page_id: string
  mileage_km: string
  price_snapshot: string
  staff_comment: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function toDateInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function toTimeInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function combineMs(date: string, time: string): number | null {
  if (!date) return null
  const d = new Date(`${date}T${time || '00:00'}`)
  return Number.isNaN(d.getTime()) ? null : d.getTime()
}
function combineIso(date: string, time: string): string | null {
  const ms = combineMs(date, time)
  return ms === null ? null : new Date(ms).toISOString()
}

function buildForm(d: StaffBookingDetail): FormState {
  const sched = d.scheduled_datetime ?? d.preferred_datetime ?? null
  const type = (d.service_type ?? d.service?.type ?? 'PACKAGE') as 'PACKAGE' | 'DEFAULT'
  return {
    status: d.status,
    visit_date: toDateInput(d.scheduled_datetime ?? sched),
    visit_time: toTimeInput(d.scheduled_datetime ?? sched),
    service_station_id: String(d.service_station_id ?? d.station_id ?? '' ?? ''),
    service_type: type === 'DEFAULT' ? 'DEFAULT' : 'PACKAGE',
    service_package_id: String(d.service_package_id ?? d.service?.service_package_id ?? '' ?? ''),
    default_service_page_id: String(
      d.default_service_page_id ?? d.service?.default_service_page_id ?? '' ?? '',
    ),
    mileage_km: d.mileage_km != null ? String(d.mileage_km) : '',
    price_snapshot: d.price_snapshot ?? '',
    staff_comment: d.staff_comment ?? '',
  }
}

/**
 * Dirty-diff: сравниваем форму с её ЖЕ исходным снапшотом (строка-в-строку),
 * а не с сырым detail — иначе минутная точность инпута времени даёт ложный
 * diff против секунд из API.
 */
function buildPatch(form: FormState, init: FormState): StaffBookingPatch {
  const patch: StaffBookingPatch = {}

  if (form.status !== init.status) patch.status = form.status

  if (form.visit_date !== init.visit_date || form.visit_time !== init.visit_time) {
    patch.scheduled_datetime = combineIso(form.visit_date, form.visit_time)
  }

  if (form.service_station_id !== init.service_station_id) {
    patch.service_station_id = form.service_station_id ? Number(form.service_station_id) : null
  }

  if (
    form.service_type !== init.service_type ||
    form.service_package_id !== init.service_package_id ||
    form.default_service_page_id !== init.default_service_page_id
  ) {
    if (form.service_type === 'PACKAGE') {
      patch.service_type = 'PACKAGE'
      patch.service_package_id = form.service_package_id ? Number(form.service_package_id) : null
      patch.default_service_page_id = null
    } else {
      patch.service_type = 'DEFAULT'
      patch.default_service_page_id = form.default_service_page_id
        ? Number(form.default_service_page_id)
        : null
      patch.service_package_id = null
    }
  }

  if (form.mileage_km !== init.mileage_km) {
    patch.mileage_km = form.mileage_km.trim() ? Number(form.mileage_km) : null
  }

  if (form.price_snapshot !== init.price_snapshot) {
    patch.price_snapshot = form.price_snapshot.trim() || null
  }

  if (form.staff_comment !== init.staff_comment) patch.staff_comment = form.staff_comment

  return patch
}

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const navigate = useNavigate()

  const { data, isLoading, isError } = useStaffBookingQuery(id)
  const { data: options } = useStaffBookingsOptionsQuery()
  const updateMut = useUpdateStaffBookingMutation(id ?? 0)
  const cancelMut = useCancelStaffBookingMutation(id ?? 0)

  const [form, setForm] = useState<FormState | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const initedRef = useRef<number | null>(null)
  const initialRef = useRef<FormState | null>(null)

  useEffect(() => {
    if (data && initedRef.current !== data.id) {
      const f = buildForm(data)
      setForm(f)
      initialRef.current = { ...f }
      initedRef.current = data.id
    }
  }, [data])

  const packageOptions = useMemo(
    () =>
      (options?.service_packages ?? []).map((p) => ({
        value: String(p.id),
        label:
          p.price != null
            ? `${p.label} · ${formatMoney(String(p.price), p.currency ?? 'KZT')}`
            : p.label,
        keywords: p.label,
      })),
    [options],
  )

  if (isLoading || !form) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isError || !data || !id) {
    return (
      <section>
        <Card className="p-6 text-center">
          <p className="font-bold text-red-700">Запись не найдена или недоступна.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate('/bookings')}>
            ← К списку
          </Button>
        </Card>
      </section>
    )
  }

  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f))
  const meta = STATUS_META[form.status]
  const terminal = form.status === 'COMPLETED' || form.status.startsWith('CANCELLED') || form.status === 'NO_SHOW'


  const save = () => {
    const patch = buildPatch(form, initialRef.current ?? form)
    if (Object.keys(patch).length === 0) {
      toast.info('Изменений нет')
      return
    }
    updateMut.mutate(patch, {
      onSuccess: () => {
        initialRef.current = { ...form }
        toast.success('Изменения сохранены')
      },
      onError: (e) => toast.error(parseApiError(e, 'Не удалось сохранить.').general),
    })
  }

  const quickStatus = (status: string) => {
    set({ status })
    updateMut.mutate(
      { status },
      {
        onSuccess: () => {
          if (initialRef.current) initialRef.current.status = status
          toast.success('Статус обновлён')
        },
        onError: (e) => toast.error(parseApiError(e, 'Не удалось обновить статус.').general),
      },
    )
  }

  const doCancel = () => {
    cancelMut.mutate(
      { cancel_reason: cancelReason.trim() || undefined },
      {
        onSuccess: () => {
          set({ status: 'CANCELLED_BY_STAFF' })
          if (initialRef.current) initialRef.current.status = 'CANCELLED_BY_STAFF'
          toast.success('Запись отменена')
          setCancelReason('')
        },
        onError: (e) => toast.error(parseApiError(e, 'Не удалось отменить запись.').general),
      },
    )
  }

  const heroDate = form.visit_date
    ? formatDateTime(combineIso(form.visit_date, form.visit_time) ?? '')
    : 'Не назначено'
  const heroStation =
    options?.stations.find((s) => String(s.id) === form.service_station_id)?.label ??
    data.station ??
    'Не выбрано'

  return (
    <section className="space-y-6">
      <Link
        to="/bookings"
        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-textSecondary hover:text-brandBlue"
      >
        ← К списку записей
      </Link>

      {/* Hero */}
      <div className="rounded-sct-lg bg-navy p-5 text-white md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-900 uppercase tracking-widest text-white/50">
              Запись · создана {data.created_at ? formatDateTime(data.created_at) : '—'}
            </p>
            <h1 className="mt-1 text-3xl font-900 uppercase tracking-tight md:text-4xl">
              Заявка #{data.id}
            </h1>
          </div>
          <span
            className={cn(
              'inline-block self-start rounded-md px-3 py-1.5 text-[11px] font-900 uppercase tracking-widest',
              meta?.tone ?? 'bg-white/10 text-white',
            )}
          >
            {meta?.label ?? form.status}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <HeroCard label="Статус" value={meta?.label ?? form.status} />
          <HeroCard label="Дата визита" value={heroDate} />
          <HeroCard label="СТО" value={heroStation} />
          <HeroCard label="Пробег" value={form.mileage_km ? `${Number(form.mileage_km).toLocaleString('ru-RU')} км` : '—'} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Форма */}
        <div className="space-y-4 lg:col-span-8">
          <Card className="p-5 md:p-6">
            <SectionTitle>Дата и время визита</SectionTitle>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input type="date" label="Дата визита" value={form.visit_date} onChange={(e) => set({ visit_date: e.target.value })} />
              <Input type="time" label="Время визита" value={form.visit_time} onChange={(e) => set({ visit_time: e.target.value })} />
            </div>
            <p className="mt-3 text-[11px] font-medium text-textSecondary">
              Исходное время клиента:{' '}
              <span className="font-bold text-textPrimary">
                {data.preferred_datetime ? formatDateTime(data.preferred_datetime) : '—'}
              </span>
            </p>
          </Card>

          <Card className="p-5 md:p-6">
            <SectionTitle>СТО и статус</SectionTitle>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Сервисный центр" value={form.service_station_id} onChange={(e) => set({ service_station_id: e.target.value })}>
                <option value="">— Не выбрано —</option>
                {(options?.stations ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <Select label="Статус" value={form.status} onChange={(e) => set({ status: e.target.value })}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s]?.label ?? s}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <Card className="p-5 md:p-6">
            <SectionTitle>Услуга</SectionTitle>
            <div className="mt-3">
              <Select label="Тип услуги" value={form.service_type} onChange={(e) => set({ service_type: e.target.value as 'PACKAGE' | 'DEFAULT' })}>
                <option value="PACKAGE">Пакет услуги</option>
                <option value="DEFAULT">Дефолтная услуга</option>
              </Select>
            </div>

            {form.service_type === 'PACKAGE' ? (
              <div className="mt-3">
                <SearchableSelect
                  label="Пакет услуги"
                  placeholder="— Выберите пакет —"
                  value={form.service_package_id}
                  onChange={(v) => set({ service_package_id: v })}
                  options={packageOptions}
                />
              </div>
            ) : (
              <div className="mt-3">
                <Select label="Дефолтная услуга" value={form.default_service_page_id} onChange={(e) => set({ default_service_page_id: e.target.value })}>
                  <option value="">— Выберите —</option>
                  {(options?.default_services ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                      {s.price_note ? ` · ${s.price_note}` : ''}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="mt-4">
              <Input
                label="Индивидуальная цена (price_snapshot)"
                inputMode="decimal"
                placeholder="напр. 15000.00"
                value={form.price_snapshot}
                onChange={(e) => set({ price_snapshot: e.target.value.replace(/[^\d.,]/g, '').replace(',', '.') })}
              />
            </div>
          </Card>

          <Card className="p-5 md:p-6">
            <SectionTitle>Пробег автомобиля</SectionTitle>
            <div className="mt-3">
              <Input
                label="Пробег, км"
                inputMode="numeric"
                placeholder="напр. 85000"
                value={form.mileage_km}
                onChange={(e) => set({ mileage_km: e.target.value.replace(/[^\d]/g, '') })}
              />
            </div>
            <p className="mt-2 text-[11px] font-medium text-textSecondary">
              Источник и комментарий пробега бэк пока не принимает — только значение.
            </p>
          </Card>

          <Card className="p-5 md:p-6">
            <SectionTitle>Заметка сотрудника</SectionTitle>
            <p className="mb-3 mt-1 text-[11px] font-medium text-textSecondary">Видна только команде, клиент её не видит.</p>
            <Textarea rows={4} value={form.staff_comment} onChange={(e) => set({ staff_comment: e.target.value })} />
          </Card>

          {data.comment && (
            <Card className="p-5 md:p-6">
              <SectionTitle>Комментарий клиента</SectionTitle>
              <p className="mt-3 whitespace-pre-line rounded-sct border border-borderLight bg-surfaceLight/40 p-3 text-sm text-textPrimary">
                {data.comment}
              </p>
            </Card>
          )}

          <div className="flex justify-end">
            <Button variant="primary" size="lg" loading={updateMut.isPending} onClick={save}>
              Сохранить изменения
            </Button>
          </div>

          {/* Отмена */}
          <Card className="border-rose-200 p-5 md:p-6">
            <SectionTitle danger>Отмена заявки</SectionTitle>
            {data.cancel_reason ? (
              <p className="mt-3 whitespace-pre-line text-sm text-rose-700">
                Причина: {data.cancel_reason}
              </p>
            ) : (
              <>
                <p className="mb-3 mt-1 text-[11px] font-medium text-textSecondary">
                  Действие нельзя отменить. Укажите причину для истории.
                </p>
                <Textarea rows={2} placeholder="Например: клиент попросил отменить запись…" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                <div className="mt-3 flex justify-end">
                  <Button variant="danger" loading={cancelMut.isPending} disabled={form.status.startsWith('CANCELLED')} onClick={doCancel}>
                    Отменить заявку
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Сайдбар */}
        <aside className="lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-24">
            <Card className="p-5 md:p-6">
              <p className="text-[10px] font-900 uppercase tracking-widest text-textSecondary">Сводка</p>
              <div className="mt-3 space-y-3">
                <SummaryRow label="Клиент" value={data.client_name || data.client?.name || '—'} />
                <SummaryRow label="Телефон" value={data.phone || data.client?.phone || '—'} mono />
                <SummaryRow label="Авто" value={data.car_title || data.car?.title || '—'} />
                <SummaryRow label="Госномер" value={data.plate || data.car?.license_plate || '—'} mono />
                <SummaryRow label="Услуга" value={data.service_title || data.service?.title || '—'} />
                <SummaryRow
                  label="Цена"
                  value={data.price_snapshot ? formatMoney(data.price_snapshot, data.currency ?? 'KZT') : data.price ? formatMoney(String(data.price), data.currency ?? 'KZT') : '—'}
                  accent
                />
              </div>
            </Card>

            <Card className="p-5 md:p-6">
              <p className="text-[10px] font-900 uppercase tracking-widest text-textSecondary">Быстрые действия</p>
              <div className="mt-3 space-y-2">
                <QuickBtn label="Подтвердить заявку" disabled={updateMut.isPending || terminal || form.status === 'CONFIRMED'} onClick={() => quickStatus('CONFIRMED')} />
                <QuickBtn label="Начать работу" disabled={updateMut.isPending || terminal || form.status === 'IN_PROGRESS'} onClick={() => quickStatus('IN_PROGRESS')} />
                <QuickBtn label="Завершить заявку" disabled={updateMut.isPending || terminal} onClick={() => quickStatus('COMPLETED')} />
                <QuickBtn label="Отменить заявку" danger disabled={cancelMut.isPending || form.status.startsWith('CANCELLED')} onClick={() => quickStatus('CANCELLED_BY_STAFF')} />
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </section>
  )
}

function SectionTitle({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <p className={cn('text-[10px] font-900 uppercase tracking-widest', danger ? 'text-rose-700' : 'text-textSecondary')}>
      {children}
    </p>
  )
}

function HeroCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sct bg-white/5 p-3">
      <p className="text-[10px] font-900 uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-1 truncate text-sm font-900 text-white">{value}</p>
    </div>
  )
}

function SummaryRow({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary">{label}</span>
      <span className={cn('text-right', mono && 'font-mono text-[12px]', accent ? 'font-900 text-brandBlue' : 'font-bold text-textPrimary')}>
        {value}
      </span>
    </div>
  )
}

function QuickBtn({ label, onClick, disabled, danger }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-sct border px-4 py-3 text-[12px] font-900 uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-40',
        danger ? 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50' : 'border-borderLight bg-white text-textPrimary hover:border-brandBlue hover:text-brandBlue',
      )}
    >
      {label}
      <span aria-hidden>→</span>
    </button>
  )
}
