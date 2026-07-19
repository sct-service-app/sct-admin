/**
 * Базовая кнопка с вариантами.
 * Стили подобраны под дизайн SCT: uppercase-болды (прямой шрифт) + скругления sct.
 *
 * Использование:
 *   <Button variant="primary">Войти</Button>
 *   <Button variant="ghost" size="sm">Отмена</Button>
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brandBlue text-white hover:bg-brandBlueDark shadow-soft-blue disabled:opacity-50',
  secondary:
    'bg-surfaceLight text-textPrimary border border-borderLight hover:bg-surfaceMuted',
  ghost:
    'bg-transparent text-textSecondary hover:text-textPrimary hover:bg-surfaceLight',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
  dark: 'bg-textPrimary text-white hover:bg-brandBlue shadow-soft-blue',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[11px] tracking-widest',
  md: 'h-12 px-6 text-xs tracking-[0.15em]',
  lg: 'h-14 px-8 text-sm tracking-[0.2em]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-sct font-900 uppercase transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    )
  },
)
Button.displayName = 'Button'
