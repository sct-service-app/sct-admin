/**
 * Текстовое поле с лейблом, ошибкой и опциональной иконкой справа.
 * Совместим с react-hook-form через forwardRef.
 *
 * Использование:
 *   <Input label="Номер телефона" {...register('phone')} error={errors.phone?.message} />
 */
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  rightSlot?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, rightSlot, className, id, ...rest }, ref) => {
    const inputId = id ?? `inp-${rest.name ?? Math.random().toString(36).slice(2, 8)}`
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-[11px] font-800 uppercase tracking-widest text-textSecondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'h-12 w-full rounded-sct border bg-surfaceLight px-4 text-sm font-medium text-textPrimary outline-none transition-all',
              'placeholder:text-textSecondary/60',
              'focus:bg-white focus:ring-2 focus:ring-brandBlue/15',
              error
                ? 'border-red-400 focus:border-red-500'
                : 'border-borderLight focus:border-brandBlue',
              rightSlot && 'pr-12',
              className,
            )}
            {...rest}
          />
          {rightSlot && (
            <div className="absolute inset-y-0 right-3 flex items-center text-textSecondary">
              {rightSlot}
            </div>
          )}
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
Input.displayName = 'Input'
