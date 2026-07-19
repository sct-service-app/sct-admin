/**
 * Модалка выбора модификации авто для админ-формы пакета.
 *
 * Источник — ПУБЛИЧНЫЙ конфигуратор `/api/v1/cars/*` (marks → models →
 * filters → modifications), тот же, что в клиентском флоу добавления авто
 * (`features/garage/add-car`). Раньше пикер тянул марки из
 * `/staff_endpoints/cars/cars-list-page-data/` — это список клиентских
 * гаражей, поэтому в «Марка» попадали только уже добавленные кем-то марки
 * (бэкендщик заметил «очень мало вариантов марок», 05.06). Теперь каталог
 * полный (411 марок).
 *
 * Каскад: Марка → Модель → уточняющие фильтры (Год / Кузов / Поколение /
 * Топливо / Объём / Мощность / КПП / Привод / Руль) → список модификаций.
 * Клик по модификации отдаёт её числовой `id` — это и есть `modification_id`
 * формы пакета (бэк перешёл с source_id на id, см. Template (4).yaml).
 */
import { useMemo, useState } from 'react'
import {
  useFiltersQuery,
  useMarksQuery,
  useModelsQuery,
  useModificationsQuery,
} from '@/features/garage/add-car/queries'
import type { CarsQuery, Mark, Model, Modification } from '@/features/garage/add-car/types'
import { Modal } from '@/shared/ui/Modal'
import { SearchableSelect } from '@/shared/ui/SearchableSelect'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { SafeImage } from '@/shared/ui/SafeImage'
import { cn } from '@/shared/lib/cn'
import { formatEngineVolume } from '@/shared/lib/format'

interface ModificationPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (modificationId: number, label: string) => void
}

const PAGE_SIZE = 20

/** Уточняющие параметры (всё опционально, постепенно сужают выборку). */
interface Specs {
  year?: number
  body_type?: number
  generation?: number
  fuel_type?: string
  engine_volume?: number
  horse_power?: number
  transmission_type?: string
  drive_type?: string
  steering_wheel_position?: string
}

const EMPTY_SPECS: Specs = {}

export function ModificationPicker({ open, onClose, onSelect }: ModificationPickerProps) {
  const [markId, setMarkId] = useState<number | null>(null)
  const [modelId, setModelId] = useState<number | null>(null)
  const [specs, setSpecs] = useState<Specs>(EMPTY_SPECS)
  const [page, setPage] = useState(1)

  // filters/modifications требуют mark И model — до их выбора не запрашиваем.
  const ready = markId !== null && modelId !== null

  const baseQuery: CarsQuery | null = useMemo(
    () => (ready ? { mark: markId!, model: modelId!, ...specs } : null),
    [ready, markId, modelId, specs],
  )

  const { data: marksData, isLoading: marksLoading } = useMarksQuery()
  const { data: modelsData, isLoading: modelsLoading } = useModelsQuery(markId)
  const { data: filters } = useFiltersQuery(baseQuery)
  const {
    data: mods,
    isLoading: modsLoading,
    isFetching: modsFetching,
    isError: modsError,
  } = useModificationsQuery(baseQuery ? { ...baseQuery, page, page_size: PAGE_SIZE } : null)

  const marks = marksData?.results ?? []
  const models = modelsData?.results ?? []
  const items = mods?.results ?? []
  const totalPages = mods ? Math.max(1, Math.ceil((mods.count ?? 0) / PAGE_SIZE)) : 1

  const selectedMark = marks.find((m) => m.id === markId) ?? null
  const selectedModel = models.find((m) => m.id === modelId) ?? null

  const changeMark = (v: string) => {
    setMarkId(v ? Number(v) : null)
    setModelId(null)
    setSpecs(EMPTY_SPECS)
    setPage(1)
  }

  const changeModel = (v: string) => {
    setModelId(v ? Number(v) : null)
    setSpecs(EMPTY_SPECS)
    setPage(1)
  }

  const setSpec = (patch: Specs) => {
    setSpecs((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  const reset = () => {
    setMarkId(null)
    setModelId(null)
    setSpecs(EMPTY_SPECS)
    setPage(1)
  }

  const handleSelect = (mod: Modification) => {
    // full_title — готовый полный лейбл от бэка («Audi | 100 | IV (C4) | …»).
    // Если его нет — склеиваем из выбранной марки/модели (display_name модели
    // уже содержит марку, поэтому это только фолбэк).
    const markName = selectedMark?.display_name || selectedMark?.name || ''
    const modelName = selectedModel?.display_name || selectedModel?.name || ''
    const group = mod.configuration_name ? ` (${mod.configuration_name})` : ''
    const label = mod.full_title || `${markName} ${modelName} — ${modTitle(mod)}${group}`.trim()
    onSelect(mod.id, label)
    onClose()
  }

  // Опции уточняющих селектов из filters/?mark=&model=&…
  const yearOpts = (filters?.years ?? []).map((y) => ({ value: y, label: String(y) }))
  const bodyOpts = (filters?.body_types ?? []).map((b) => ({ value: b.id, label: b.name || b.code }))
  const genOpts = (filters?.generations ?? []).map((g) => ({
    value: g.id,
    label: `${g.display_name}${g.year_from ? ` (${g.year_from}${g.year_to ? `–${g.year_to}` : ''})` : ''}`,
  }))
  const fuelOpts = (filters?.fuel_types ?? []).map((f) => ({ value: f.value, label: f.label || f.value }))
  const volumeOpts = (filters?.engine_volumes ?? []).map((o) => ({
    value: o.value,
    label: formatEngineVolume(o.value) ?? String(o.value),
  }))
  const powerOpts = (filters?.horse_powers ?? []).map((o) => ({ value: o.value, label: `${o.value} л.с.` }))
  const transOpts = (filters?.transmission_types ?? []).map((o) => ({
    value: o.value,
    label: o.label ?? o.name ?? o.code ?? o.value,
  }))
  const driveOpts = (filters?.drive_types ?? []).map((o) => ({
    value: o.value,
    label: o.label ?? o.name ?? o.code ?? o.value,
  }))
  const steerOpts = (filters?.steering_positions ?? []).map((o) => ({
    value: o.value,
    label: o.label ?? o.name ?? o.code ?? o.value,
  }))

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="mb-5">
        <h2 className="text-2xl font-900 uppercase tracking-tight text-textPrimary md:text-3xl">
          Выбор модификации
        </h2>
        <p className="mt-1.5 text-sm text-textSecondary">
          Полный каталог авто. Выберите марку и модель, при необходимости уточните фильтрами.
        </p>
      </div>

      {/* Марка → Модель */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SelectCol
          label="Марка"
          value={markId !== null ? String(markId) : ''}
          onChange={changeMark}
          placeholder={marksLoading ? 'Загрузка…' : '— Выберите марку —'}
          disabled={marksLoading}
          options={marks.map((m: Mark) => ({
            value: m.id,
            // Только латиница в названии марки (по требованию): m.name = латинское.
            label: `${m.name || m.display_name}${m.modifications_count ? ` (${m.modifications_count})` : ''}`,
            // в поиске оставляем и кириллицу: ввод «тойо» тоже найдёт.
            keywords: [m.name, m.name_ru, m.display_name].filter(Boolean).join(' '),
          }))}
        />
        <SelectCol
          label="Модель"
          value={modelId !== null ? String(modelId) : ''}
          onChange={changeModel}
          placeholder={
            markId === null ? 'Сначала марка' : modelsLoading ? 'Загрузка…' : '— Выберите модель —'
          }
          disabled={markId === null || modelsLoading}
          options={models.map((m: Model) => ({
            value: m.id,
            label: `${m.display_name || m.name}${m.modifications_count ? ` (${m.modifications_count})` : ''}`,
            keywords: [m.name, m.name_ru].filter(Boolean).join(' '),
          }))}
        />
      </div>

      {/* Уточняющие фильтры — активны после выбора марки и модели */}
      <div
        className={cn(
          'mt-3 grid grid-cols-2 gap-3 md:grid-cols-4',
          !ready && 'pointer-events-none opacity-40',
        )}
      >
        <SelectCol
          label="Год"
          value={specs.year !== undefined ? String(specs.year) : ''}
          onChange={(v) =>
            setSpec({ year: v ? Number(v) : undefined, body_type: undefined, generation: undefined })
          }
          options={yearOpts}
          disabled={!ready}
        />
        <SelectCol
          label="Кузов"
          value={specs.body_type !== undefined ? String(specs.body_type) : ''}
          onChange={(v) => setSpec({ body_type: v ? Number(v) : undefined, generation: undefined })}
          options={bodyOpts}
          disabled={!ready}
        />
        <SelectCol
          label="Поколение"
          value={specs.generation !== undefined ? String(specs.generation) : ''}
          onChange={(v) => setSpec({ generation: v ? Number(v) : undefined })}
          options={genOpts}
          disabled={!ready}
        />
        <SelectCol
          label="Топливо"
          value={specs.fuel_type ?? ''}
          onChange={(v) => setSpec({ fuel_type: v || undefined })}
          options={fuelOpts}
          disabled={!ready}
        />
        <SelectCol
          label="Объём"
          value={specs.engine_volume !== undefined ? String(specs.engine_volume) : ''}
          onChange={(v) => setSpec({ engine_volume: v ? Number(v) : undefined })}
          options={volumeOpts}
          disabled={!ready}
        />
        <SelectCol
          label="Мощность"
          value={specs.horse_power !== undefined ? String(specs.horse_power) : ''}
          onChange={(v) => setSpec({ horse_power: v ? Number(v) : undefined })}
          options={powerOpts}
          disabled={!ready}
        />
        <SelectCol
          label="КПП"
          value={specs.transmission_type ?? ''}
          onChange={(v) => setSpec({ transmission_type: v || undefined })}
          options={transOpts}
          disabled={!ready}
        />
        <SelectCol
          label="Привод"
          value={specs.drive_type ?? ''}
          onChange={(v) => setSpec({ drive_type: v || undefined })}
          options={driveOpts}
          disabled={!ready}
        />
        <SelectCol
          label="Руль"
          value={specs.steering_wheel_position ?? ''}
          onChange={(v) => setSpec({ steering_wheel_position: v || undefined })}
          options={steerOpts}
          disabled={!ready}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={reset}
          disabled={markId === null}
          className="rounded-sct border border-borderLight bg-white px-4 py-2 text-[11px] font-900 uppercase tracking-widest text-textSecondary transition-colors hover:border-brandBlue hover:text-brandBlue disabled:cursor-not-allowed disabled:opacity-50"
        >
          Сбросить
        </button>
      </div>

      {/* Результаты */}
      <div className="mt-4 max-h-[360px] overflow-y-auto rounded-sct border border-borderLight">
        {!ready ? (
          <div className="p-10 text-center text-sm font-bold text-textSecondary">
            Выберите марку и модель, чтобы увидеть модификации.
          </div>
        ) : modsLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner />
          </div>
        ) : modsError ? (
          <div className="p-10 text-center text-sm font-bold text-red-700">
            Не удалось загрузить модификации.
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm font-bold text-textSecondary">
            Ничего не нашлось. Уберите часть фильтров.
          </div>
        ) : (
          <ul className={cn('divide-y divide-borderLight', modsFetching && 'opacity-60')}>
            {items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(m)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surfaceLight"
                >
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-borderLight bg-surfaceLight">
                    <SafeImage
                      src={m.photo_url ?? undefined}
                      alt={modTitle(m)}
                      className="h-full w-full object-cover"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-900 uppercase text-borderLight">
                          {modTitle(m).slice(0, 2)}
                        </div>
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    {m.configuration_name && (
                      <p className="truncate text-[10px] font-900 uppercase tracking-widest text-brandBlue">
                        {m.configuration_name}
                      </p>
                    )}
                    <p className="truncate text-sm font-900 uppercase tracking-tight text-textPrimary">
                      {modTitle(m)}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-tighter text-textSecondary">
                      {modSub(m)}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-textSecondary/70">
                      id: {m.id}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Пагинация */}
      {ready && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-textSecondary">
            Стр. {page} из {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Назад
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд →
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Закрыть
        </Button>
      </div>
    </Modal>
  )
}

function modTitle(m: Modification): string {
  return m.name || m.full_title || m.display_name || m.title || `Модификация ${m.id}`
}

function modSub(m: Modification): string {
  const yearRange =
    m.year_from || m.year_to ? `${m.year_from ?? ''}${m.year_to ? `–${m.year_to}` : ''}` : null
  return (
    [
      m.configuration_name,
      yearRange,
      m.power_display || (m.horse_power ? `${m.horse_power} л.с.` : null),
      m.transmission_type_label,
      m.drive_type_label,
    ]
      .filter(Boolean)
      .join(' · ') || `MOD ${m.id}`
  )
}

function SelectCol({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder,
}: {
  label: string
  value: string
  options: Array<{ value: string | number; label: string; keywords?: string }>
  onChange: (next: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <SearchableSelect
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder ?? 'Все'}
    />
  )
}
