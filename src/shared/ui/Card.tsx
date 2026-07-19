import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Базовая карточка. Использовать как контейнер для секций с белым фоном
 * и тонкой обводкой — это базовый блок дизайн-системы SCT.
 */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-sct-lg border border-borderLight bg-white shadow-sct-soft',
        className,
      )}
      {...rest}
    />
  )
}
