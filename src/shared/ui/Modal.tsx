/**
 * Простая модалка через Portal (без зависимостей).
 *
 * Если потом понадобится фокус-трап, скролл-лок и стек модалок —
 * заменим внутренности на Radix UI Dialog, наружный API оставим тот же.
 *
 * Использование:
 *   <Modal open={open} onClose={() => setOpen(false)} title="Вход">
 *     ...
 *   </Modal>
 */
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

type ModalSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  size?: ModalSize
  /** Заблокировать закрытие по клику на overlay (например, во время сабмита). */
  disableOverlayClose?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = 'md',
  disableOverlayClose,
}: ModalProps) {
  // Эскейп закрывает модалку, и блокируем скролл body, пока она открыта.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-textPrimary/85 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!disableOverlayClose) onClose()
      }}
    >
      <div
        className={cn(
          // Внешний контейнер — фиксированной max-height, чтобы модалка не
          // вылезала за экран. Скролл вешаем на внутренний div, чтобы
          // X-кнопка (top-right) всегда оставалась видимой.
          'relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-sct-xl bg-white shadow-2xl animate-fade',
          sizeClasses[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-textSecondary backdrop-blur-sm transition-colors hover:bg-surfaceLight hover:text-textPrimary"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="overflow-y-auto p-6 md:p-8">
          {title && (
            <h2 className="mb-6 text-2xl font-900 uppercase tracking-tight text-textPrimary">
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
