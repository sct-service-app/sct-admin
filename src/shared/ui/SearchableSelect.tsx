/**
 * Combobox: селект с поиском по вводу. Выглядит как наш <Select>, но при
 * открытии показывает поле поиска и фильтрует опции по подстроке (например,
 * ввод «toyo» оставит «Toyota»). Нужен для длинных списков (411 марок).
 *
 * Управляемый: value — строка ('' = ничего не выбрано). onChange отдаёт
 * строковое значение опции (или '' при сбросе) — совместимо с тем, как
 * раньше работал нативный <select> (e.target.value).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'

export interface SearchableSelectOption {
  value: string | number
  label: string
  /** Доп. строка для поиска (не показывается). Напр. латинское имя марки —
   *  чтобы ввод «toyo» находил «Тойота». */
  keywords?: string
}

interface SearchableSelectProps {
  label?: string
  value: string
  options: SearchableSelectOption[]
  onChange: (next: string) => void
  disabled?: boolean
  /** Текст в свёрнутом состоянии, когда ничего не выбрано. */
  placeholder?: string
  /** Подпись опции сброса в списке (по умолчанию = placeholder или «Все»). */
  emptyLabel?: string
}

export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder = 'Все',
  emptyLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => String(o.value) === value) ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) =>
      `${o.label} ${o.keywords ?? ''}`.toLowerCase().includes(q),
    )
  }, [options, query])

  // Закрытие по клику вне и по Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Фокус в поле поиска при открытии.
  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setQuery('')
  }, [open])

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full">
      {label && (
        <label className="mb-2 block text-[11px] font-800 uppercase tracking-widest text-textSecondary">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-12 w-full items-center justify-between gap-2 rounded-sct border bg-surfaceLight pl-4 pr-3 text-left text-sm font-medium outline-none transition-all',
          open ? 'border-brandBlue bg-white ring-2 ring-brandBlue/15' : 'border-borderLight',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span className={cn('truncate', selected ? 'text-textPrimary' : 'text-textSecondary/70')}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={cn('h-4 w-4 shrink-0 text-textSecondary transition-transform', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-sct border border-borderLight bg-white shadow-soft-card">
          <div className="border-b border-borderLight p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск…"
              className="h-9 w-full rounded-md border border-borderLight bg-surfaceLight px-3 text-sm font-medium text-textPrimary outline-none focus:border-brandBlue focus:bg-white"
            />
          </div>
          <ul className="max-h-64 overflow-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => pick('')}
                className={cn(
                  'block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surfaceLight',
                  !selected ? 'font-bold text-brandBlue' : 'text-textSecondary',
                )}
              >
                {emptyLabel ?? placeholder}
              </button>
            </li>
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => pick(String(o.value))}
                  className={cn(
                    'block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surfaceLight',
                    String(o.value) === value ? 'font-bold text-brandBlue' : 'text-textPrimary',
                  )}
                >
                  {o.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-center text-sm font-medium text-textSecondary">
                Ничего не найдено
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
