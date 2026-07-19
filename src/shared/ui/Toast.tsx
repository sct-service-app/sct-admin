/**
 * Минимальная toast-система без внешних библиотек.
 *
 * Использование:
 *   import { toast } from '@/shared/ui/Toast'
 *   toast.success('Сохранено')
 *   toast.error('Не удалось загрузить')
 *   toast.info('Пакет создан', { duration: 5000 })
 *
 * Не используем react-hot-toast/sonner, чтобы не тянуть лишние пакеты —
 * 200 строк своего кода покрывают наши кейсы. Когда понадобится
 * promise-toast, undo, или actions, можно безболезненно мигрировать на
 * sonner — API почти совместим.
 *
 * Где монтируется: в `Layout.tsx` (под Footer) и в `StaffLayout.tsx`
 * через `<ToastViewport />`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  tone: ToastTone
  message: string
  duration: number
}

interface ToastApi {
  show: (tone: ToastTone, message: string, options?: { duration?: number }) => void
}

// Глобальный API — экспортируем как объект, чтобы можно было `toast.success(...)`.
// Под капотом — pub/sub.
type Subscriber = (item: ToastItem) => void
const subscribers = new Set<Subscriber>()
let nextId = 1

function publish(tone: ToastTone, message: string, duration = 3500) {
  const item: ToastItem = { id: nextId++, tone, message, duration }
  subscribers.forEach((s) => s(item))
}

export const toast = {
  show: (tone: ToastTone, message: string, opts?: { duration?: number }) =>
    publish(tone, message, opts?.duration),
  success: (message: string, opts?: { duration?: number }) =>
    publish('success', message, opts?.duration),
  error: (message: string, opts?: { duration?: number }) =>
    publish('error', message, opts?.duration ?? 5000),
  info: (message: string, opts?: { duration?: number }) =>
    publish('info', message, opts?.duration),
  warning: (message: string, opts?: { duration?: number }) =>
    publish('warning', message, opts?.duration ?? 5000),
}

const ToastContext = createContext<ToastApi | null>(null)

/**
 * Хук на случай, если кто-то захочет toast через React-контекст —
 * сейчас экспортируем глобальный `toast` напрямую, но Context оставлен
 * на будущее (например, для тестов через Provider).
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Без провайдера — используем глобальный pub/sub.
    return { show: (tone, message, options) => publish(tone, message, options?.duration) }
  }
  return ctx
}

/**
 * Viewport — рендерит список активных toast'ов в правом нижнем углу
 * через portal. Подключается один раз в Layout.
 */
export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([])
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    const t = timeoutsRef.current.get(id)
    if (t) {
      clearTimeout(t)
      timeoutsRef.current.delete(id)
    }
  }, [])

  useEffect(() => {
    const sub: Subscriber = (item) => {
      setItems((prev) => [...prev, item])
      const t = setTimeout(() => remove(item.id), item.duration)
      timeoutsRef.current.set(item.id, t)
    }
    subscribers.add(sub)
    return () => {
      subscribers.delete(sub)
    }
  }, [remove])

  // Очистка таймеров при unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t))
      timeoutsRef.current.clear()
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[10001] flex w-full max-w-sm flex-col gap-2 md:bottom-6 md:right-6"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onClose={() => remove(item.id)} />
      ))}
    </div>,
    document.body,
  )
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const tones: Record<ToastTone, string> = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-brandBlueDark',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  const icons: Record<ToastTone, ReactNode> = {
    success: <Icon path="M5 13l4 4L19 7" />,
    error: <Icon path="M6 18L18 6M6 6l12 12" />,
    info: <Icon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    warning: <Icon path="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12.25a2 2 0 00-3.48 0L3.19 16a2 2 0 001.74 3z" />,
  }
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-sct border bg-white p-4 shadow-soft-card animate-fade',
        tones[item.tone],
      )}
      role={item.tone === 'error' ? 'alert' : 'status'}
    >
      <div className="mt-0.5 shrink-0">{icons[item.tone]}</div>
      <p className="flex-1 text-sm font-medium leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md p-0.5 text-current opacity-50 transition-opacity hover:opacity-100"
        aria-label="Закрыть"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function Icon({ path }: { path: string }) {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  )
}
