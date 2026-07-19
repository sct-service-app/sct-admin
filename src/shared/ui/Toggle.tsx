/**
 * iOS-style toggle. Простой — без accessibility-фокусов (на v2 завернём в
 * Headless UI Switch для полной keyboard navigation).
 */
import { cn } from '@/shared/lib/cn'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
}

export function Toggle({ checked, onChange, disabled, label, description }: ToggleProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-4',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandBlue/40',
          checked ? 'bg-brandBlue' : 'bg-surfaceMuted',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
      {(label || description) && (
        <div className="min-w-0 flex-1">
          {label && (
            <p className="text-sm font-bold text-textPrimary">{label}</p>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-textSecondary">{description}</p>
          )}
        </div>
      )}
    </label>
  )
}
