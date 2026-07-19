/**
 * Глобальный Error Boundary.
 *
 * React всё ещё требует Class Component для catch-логики (хуки этого
 * сделать не могут). Под капотом — тонкий wrapper, наружу — обычный
 * компонент с пропами {children, fallback?, resetKeys?}.
 *
 * Использование:
 *   <ErrorBoundary>
 *     <Outlet />
 *   </ErrorBoundary>
 *
 * `resetKeys` — массив значений (например, [pathname]). При их смене
 * boundary сбрасывает ошибку и пытается отрендерить заново. Это нужно,
 * чтобы после ошибки на одной странице, переход на другую страницу не
 * показывал тот же ErrorScreen.
 *
 * В dev-режиме показываем stack trace, в prod — только заголовок и
 * кнопки.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Если переданы — при изменении любого из них boundary сбрасывает state. */
  resetKeys?: ReadonlyArray<unknown>
  /** Кастомный fallback вместо стандартного экрана. */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Логируем в консоль с component stack для отладки. В проде сюда же
    // можно подключить Sentry / Bugsnag.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Если resetKeys изменились (например, сменился pathname) — сбрасываем
    // error, чтобы попробовать отрендериться снова.
    if (this.state.error && !shallowEqualArrays(prevProps.resetKeys, this.props.resetKeys)) {
      this.setState({ error: null })
    }
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) return this.props.fallback(error, this.reset)
    return <DefaultErrorScreen error={error} onReset={this.reset} />
  }
}

function shallowEqualArrays(
  a: ReadonlyArray<unknown> | undefined,
  b: ReadonlyArray<unknown> | undefined,
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function DefaultErrorScreen({ error, onReset }: { error: Error; onReset: () => void }) {
  const isDev = import.meta.env.DEV

  return (
    <section className="container-sct flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600">
        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12.25a2 2 0 00-3.48 0L3.19 16a2 2 0 001.74 3z"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-900 uppercase tracking-tight text-textPrimary md:text-4xl">
        Что-то пошло не так
      </h1>
      <p className="mt-3 max-w-md text-sm font-medium text-textSecondary md:text-base">
        Произошла непредвиденная ошибка. Можно попробовать обновить страницу
        или вернуться на главную.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            onReset()
            window.location.reload()
          }}
          className="rounded-sct bg-brandBlue px-5 py-3 text-[11px] font-900 uppercase tracking-widest text-white shadow-soft-blue hover:bg-brandBlueDark"
        >
          Обновить страницу
        </button>
        <Link
          to="/"
          onClick={onReset}
          className="rounded-sct border border-borderLight bg-white px-5 py-3 text-[11px] font-900 uppercase tracking-widest text-textSecondary hover:border-brandBlue hover:text-brandBlue"
        >
          На главную
        </Link>
      </div>

      {isDev && (
        <details className="mt-10 w-full max-w-2xl text-left">
          <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-textSecondary/60">
            Подробности ошибки (только в dev)
          </summary>
          <pre className="mt-3 max-h-64 overflow-auto rounded-sct border border-red-200 bg-red-50 p-4 text-[11px] text-red-900">
            {error.name}: {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
    </section>
  )
}
