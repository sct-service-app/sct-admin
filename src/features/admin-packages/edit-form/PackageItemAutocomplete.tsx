/**
 * Поиск товара/услуги по названию. По input'у дёргает
 * /staff_endpoints/packages/package-items/?autocomplete=1&q=...
 *
 * Минимум 2 символа, debounce 300ms. Результаты — выпадающий список.
 * Клик по строке вызывает onSelect c полным объектом item.
 */
import { useEffect, useRef, useState } from 'react'
import { usePackageItemSearch } from './queries'
import type { StaffPackageItemSearchResult } from './api'
import { Input } from '@/shared/ui/Input'
import { Spinner } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'

interface Props {
  onSelect: (item: StaffPackageItemSearchResult) => void
}

export function PackageItemAutocomplete({ onSelect }: Props) {
  const [input, setInput] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 300)
    return () => clearTimeout(t)
  }, [input])

  // закрытие по клику вне
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const { data, isFetching } = usePackageItemSearch(debounced)

  const handleSelect = (item: StaffPackageItemSearchResult) => {
    onSelect(item)
    setInput('')
    setDebounced('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        label="Добавить товар или услугу"
        placeholder="Начните вводить — масло, фильтр, диагностика..."
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />

      {open && debounced.length >= 2 && (
        <div className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-sct border border-borderLight bg-white shadow-soft-card">
          {isFetching && (
            <div className="flex items-center justify-center p-4">
              <Spinner />
            </div>
          )}
          {!isFetching && (!data || data.length === 0) && (
            <p className="p-4 text-sm font-medium text-textSecondary">
              Ничего не нашлось. Попробуйте другой запрос.
            </p>
          )}
          {!isFetching && data && data.length > 0 && (
            <ul className="divide-y divide-borderLight">
              {data.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surfaceLight"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-textPrimary">
                        {item.name}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-textSecondary">
                        {item.article || '—'} · {item.external_code || '—'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-900 uppercase tracking-widest',
                        item.item_type === 'SERVICE'
                          ? 'border-blue-100 bg-blue-50 text-brandBlue'
                          : 'border-borderLight bg-surfaceLight text-textSecondary',
                      )}
                    >
                      {item.item_type === 'SERVICE' ? 'Усл.' : 'Тов.'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
