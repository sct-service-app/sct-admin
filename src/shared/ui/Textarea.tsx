/**
 * <textarea> с общими стилями (как у Input). Не использует Quill — обычная
 * многострочная textarea. Когда понадобится rich text (полное описание
 * пакета с форматированием), переедем на TipTap отдельным компонентом.
 */
import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, rows = 4, ...rest }, ref) => {
    const elId = id ?? `txt-${rest.name ?? Math.random().toString(36).slice(2, 8)}`
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={elId}
            className="mb-2 block text-[11px] font-800 uppercase tracking-widest text-textSecondary"
          >
            {label}
          </label>
        )}
        <textarea
          id={elId}
          ref={ref}
          rows={rows}
          className={cn(
            'w-full rounded-sct border bg-surfaceLight px-4 py-3 text-sm font-medium text-textPrimary outline-none transition-all',
            'focus:bg-white focus:ring-2 focus:ring-brandBlue/15 resize-y',
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-borderLight focus:border-brandBlue',
            className,
          )}
          {...rest}
        />
        {error ? (
          <p className="mt-1.5 text-[11px] font-semibold text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-[11px] text-textSecondary/70">{hint}</p>
        ) : null}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
