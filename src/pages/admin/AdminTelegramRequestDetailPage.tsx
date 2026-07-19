/**
 * Детальная Telegram VIN-заявки (реальный API).
 *
 * Workflow менеджера:
 *   1. Ввести госномер/VIN с фото → PATCH detected_* («Сохранить»).
 *   2. «Найти авто» → POST find-client-car (автопривязка если найден один,
 *      иначе выбор из possible_client_cars).
 *   3. «Присвоить VIN» → POST assign-vin {client_car_id, detected_vin_code} →
 *      заявка переходит в done.
 * Статус вычисляется сервером, вручную не задаётся.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useAssignVinMutation,
  useDeleteTelegramRequestMutation,
  useFindClientCarMutation,
  usePatchTelegramRequestMutation,
  useTelegramRequestQuery,
} from '@/features/admin-telegram/queries'
import { telegramStatusMeta } from '@/features/admin-telegram/types'
import type { TelegramClientCar } from '@/features/admin-telegram/types'
import { parseApiError } from '@/features/auth/errors'
import { Card } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { SafeImage } from '@/shared/ui/SafeImage'
import { Spinner } from '@/shared/ui/Spinner'
import { toast } from '@/shared/ui/Toast'
import { formatDateTime, formatMileage } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

export default function AdminTelegramRequestDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const navigate = useNavigate()
  const { data, isLoading, isError } = useTelegramRequestQuery(id)

  const [plate, setPlate] = useState('')
  const [vin, setVin] = useState('')
  const initedRef = useRef<number | null>(null)

  const patchMut = usePatchTelegramRequestMutation(id ?? 0)
  const findMut = useFindClientCarMutation(id ?? 0)
  const assignMut = useAssignVinMutation(id ?? 0)
  const deleteMut = useDeleteTelegramRequestMutation(id ?? 0)

  useEffect(() => {
    if (data && initedRef.current !== data.id) {
      setPlate(data.detected_license_plate ?? '')
      setVin(data.detected_vin_code ?? '')
      initedRef.current = data.id
    }
  }, [data])

  if (isLoading) {
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
          <p className="font-bold text-red-700">Заявка не найдена.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate('/telegram')}>
            ← К заявкам
          </Button>
        </Card>
      </section>
    )
  }

  const meta = telegramStatusMeta(data.status)
  const car = data.client_car
  const vinAssigned = Boolean(car?.vin_code)
  const candidates = data.possible_client_cars ?? []

  const onError = (err: unknown, fallback: string) =>
    toast.error(parseApiError(err, fallback).general ?? fallback)

  const saveData = () => {
    patchMut.mutate(
      { detected_license_plate: plate.trim(), detected_vin_code: vin.trim() },
      {
        onSuccess: () => toast.success('Данные сохранены.'),
        onError: (e) => onError(e, 'Не удалось сохранить данные.'),
      },
    )
  }

  const findCar = () => {
    const plateValue = plate.trim()
    if (!plateValue) {
      toast.error('Сначала введите госномер.')
      return
    }
    findMut.mutate(
      { detected_license_plate: plateValue },
      {
        onSuccess: () => toast.success('Поиск выполнен — см. подходящие авто ниже.'),
        onError: (e) => onError(e, 'Не удалось выполнить поиск авто.'),
      },
    )
  }

  const bindCar = (clientCarId: number) => {
    patchMut.mutate(
      { client_car_id: clientCarId },
      {
        onSuccess: () => toast.success('Автомобиль привязан к заявке.'),
        onError: (e) => onError(e, 'Не удалось привязать автомобиль.'),
      },
    )
  }

  const assign = () => {
    if (!car) {
      toast.error('Сначала привяжите автомобиль клиента.')
      return
    }
    const vinValue = vin.trim()
    if (!vinValue) {
      toast.error('Введите VIN.')
      return
    }
    assignMut.mutate(
      { client_car_id: car.id, detected_vin_code: vinValue },
      {
        onSuccess: () => toast.success('VIN присвоен автомобилю клиента.'),
        onError: (e) => onError(e, 'Не удалось присвоить VIN.'),
      },
    )
  }

  const remove = () => {
    if (!window.confirm(`Удалить Telegram-заявку #${data.id}? Действие необратимо.`)) return
    deleteMut.mutate(undefined, {
      onSuccess: () => {
        toast.success('Заявка удалена.')
        navigate('/telegram')
      },
      onError: (e) => onError(e, 'Не удалось удалить заявку.'),
    })
  }

  const busy = patchMut.isPending || findMut.isPending || assignMut.isPending

  return (
    <section className="space-y-6">
      <Link
        to="/telegram"
        className="inline-flex items-center gap-2 text-[11px] font-900 uppercase tracking-widest text-brandBlue hover:underline"
      >
        ← Назад к Telegram-заявкам
      </Link>

      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-900 uppercase tracking-[0.22em] text-brandBlue">
            Telegram Vehicle Request
          </p>
          <h1 className="mt-1 text-2xl font-900 uppercase tracking-tight text-textPrimary md:text-4xl">
            {data.page?.title ?? `Telegram-заявка #${data.id}`}
          </h1>
          <p className="mt-2 text-sm font-medium text-textSecondary">
            Создана {formatDateTime(data.created_at)} • источник: Telegram-бот
          </p>
        </div>
        <span className={cn('inline-block self-start rounded-md px-3 py-1.5 text-[11px] font-900 uppercase tracking-widest', meta.tone)}>
          {meta.label}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Контент */}
        <div className="space-y-4 lg:col-span-8">
          {/* Фото */}
          <Card className="p-5 md:p-6">
            <SectionTitle>Фото из Telegram</SectionTitle>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PhotoBox label="Фото госномера" url={data.plate_photo_url} />
              <PhotoBox label="Фото VIN-кода" url={data.vin_photo_url} />
            </div>
          </Card>

          {/* Привязанный автомобиль */}
          <Card className="p-5 md:p-6">
            <SectionTitle>Привязанный автомобиль</SectionTitle>
            {car ? (
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-900 uppercase tracking-tight text-textPrimary">{car.full_car_title}</h3>
                  {vinAssigned ? (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-900 uppercase tracking-widest text-green-700">VIN присвоен</span>
                  ) : (
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-900 uppercase tracking-widest text-orange-700">VIN ещё не присвоен</span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MiniRow label="Клиент" value={car.client_name} />
                  <MiniRow label="Телефон" value={car.client_phone} mono />
                  <MiniRow label="Госномер" value={car.license_plate || '—'} mono />
                  <MiniRow label="VIN" value={car.vin_code || '—'} mono />
                  <MiniRow label="Пробег" value={car.latest_mileage_km != null ? formatMileage(car.latest_mileage_km) : '—'} />
                  <MiniRow label="Авто по умолчанию" value={car.is_default ? 'Да' : 'Нет'} />
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-sct border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                Автомобиль не привязан. Введите госномер и нажмите «Найти авто по госномеру».
              </p>
            )}
          </Card>

          {/* Подходящие авто клиента */}
          {candidates.length > 0 && (
            <Card className="p-5 md:p-6">
              <SectionTitle>Подходящие автомобили клиента</SectionTitle>
              <ul className="mt-3 space-y-2">
                {candidates.map((c) => (
                  <CandidateRow
                    key={c.id}
                    car={c}
                    bound={car?.id === c.id}
                    disabled={busy}
                    onBind={() => bindCar(c.id)}
                  />
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Сайдбар */}
        <aside className="lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-24">
            {/* Обработка заявки */}
            <Card className="p-5 md:p-6">
              <SectionTitle>Распознанные данные</SectionTitle>
              <div className="mt-3 space-y-3">
                <Input label="Госномер" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="847ATB02" />
                <Input label="VIN-код" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} placeholder="JTDBR32E720000000" />
              </div>
              <div className="mt-4 space-y-2">
                <Button variant="primary" fullWidth onClick={saveData} loading={patchMut.isPending} disabled={busy}>
                  Сохранить данные
                </Button>
                <Button variant="secondary" fullWidth onClick={findCar} loading={findMut.isPending} disabled={busy}>
                  Найти авто по госномеру
                </Button>
                <Button variant="primary" fullWidth onClick={assign} loading={assignMut.isPending} disabled={busy || !car}>
                  Присвоить VIN автомобилю
                </Button>
              </div>
            </Card>

            {/* Источник */}
            <Card className="p-5 md:p-6">
              <SectionTitle>Источник заявки</SectionTitle>
              <div className="mt-3 space-y-3">
                <MiniRow label="Telegram username" value={`@${data.telegram_username}`} mono />
                <MiniRow label="Telegram User ID" value={String(data.telegram_user_id ?? '—')} mono />
                <MiniRow label="Chat ID" value={String(data.telegram_chat_id ?? '—')} mono />
              </div>
            </Card>

            {/* Опасная зона */}
            <Card className="p-5 md:p-6">
              <SectionTitle>Управление</SectionTitle>
              <Button variant="danger" fullWidth className="mt-3" onClick={remove} loading={deleteMut.isPending}>
                Удалить заявку
              </Button>
            </Card>
          </div>
        </aside>
      </div>
    </section>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-900 uppercase tracking-widest text-textSecondary">{children}</p>
}

function MiniRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-sct border border-borderLight bg-surfaceLight p-3">
      <p className="text-[10px] font-900 uppercase tracking-widest text-textSecondary">{label}</p>
      <p className={cn('mt-1 text-sm font-bold text-textPrimary', mono && 'font-mono text-[13px]')}>{value}</p>
    </div>
  )
}

function CandidateRow({
  car,
  bound,
  disabled,
  onBind,
}: {
  car: TelegramClientCar
  bound: boolean
  disabled: boolean
  onBind: () => void
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-sct border border-borderLight bg-white p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-900 uppercase tracking-tight text-textPrimary">{car.full_car_title}</p>
        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-textSecondary">
          {car.client_name} · <span className="font-mono">{car.license_plate}</span> · {car.client_phone}
        </p>
      </div>
      {bound ? (
        <span className="rounded-md bg-green-50 px-3 py-1.5 text-[10px] font-900 uppercase tracking-widest text-green-700">
          Привязано
        </span>
      ) : (
        <Button variant="secondary" size="sm" onClick={onBind} disabled={disabled}>
          Привязать
        </Button>
      )}
    </li>
  )
}

function PhotoBox({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="overflow-hidden rounded-sct border border-borderLight">
      <div className="border-b border-borderLight bg-surfaceLight px-4 py-2">
        <p className="text-[11px] font-900 uppercase tracking-widest text-textPrimary">{label}</p>
      </div>
      <a
        href={url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('block h-48 bg-gradient-to-br from-surfaceLight to-surfaceMuted', !url && 'pointer-events-none')}
      >
        <SafeImage
          src={url ?? undefined}
          alt={label}
          className="h-full w-full object-contain"
          fallback={
            <div className="flex h-full w-full items-center justify-center text-center text-textSecondary/60">
              <div>
                <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h1l1.5-2h9L17 7h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
                </svg>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest">Фото недоступно</p>
              </div>
            </div>
          }
        />
      </a>
    </div>
  )
}
