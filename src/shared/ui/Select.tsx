/**
 * Стилизованный нативный <select>.
 *
 * Берём нативный (а не кастомный listbox) — потому что на мобилке он
 * открывает системный пикер, что лучше с точки зрения UX. Минус — нет
 * автокомплита/поиска. Когда понадобится для длинных списков (например,
 * выбор модели среди 100), сделаем отдельный Combobox через Radix или
 * Headless UI.
 *
 * Чтобы выглядел как наши инпуты — скрываем нативную стрелку через
 * `appearance: none` + класс из tailwind, и рисуем свою через
 * background-image SVG. Цвет stroke совпадает с textSecondary.
 */
import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
}

// SVG chevron-down с stroke=#4B5968 (textSecondary), encoded для url().
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234B5968' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")"

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, className, id, children, disabled, ...rest }, ref) => {
    const selectId = id ?? `sel-${rest.name ?? Math.random().toString(36).slice(2, 8)}`
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-2 block text-[11px] font-800 uppercase tracking-widest text-textSecondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'h-12 w-full appearance-none rounded-sct border bg-surfaceLight pl-4 pr-11 text-sm font-medium text-textPrimary outline-none transition-all',
              'focus:bg-white focus:ring-2 focus:ring-brandBlue/15',
              error
                ? 'border-red-400 focus:border-red-500'
                : 'border-borderLight focus:border-brandBlue',
              disabled && 'cursor-not-allowed opacity-50',
              className,
            )}
            style={{
              backgroundImage: CHEVRON,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.875rem center',
              backgroundSize: '1rem',
            }}
            {...rest}
          >
            {children}
          </select>
        </div>
        {error ? (
          <p className="mt-1.5 text-[11px] font-semibold text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-[11px] text-textSecondary/70">{hint}</p>
        ) : null}
      </div>
    )
  },
)
Select.displayName = 'Select'
