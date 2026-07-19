/**
 * Хранилище JWT-токенов. Поддерживает две независимые сессии:
 *   - client (обычный пользователь)
 *   - staff (админ панели)
 *
 * Это нужно, чтобы стафф-пользователь мог зайти в админку, не разлогинивая
 * клиента в соседней вкладке (и наоборот). Ключи разные, axios-инстансы
 * разные.
 *
 * Сейчас используется localStorage — этого достаточно для MVP. Если потом
 * перейдём на httpOnly cookies (безопаснее против XSS), меняем только этот
 * файл, остальной код не трогаем.
 */

export type Scope = 'client' | 'staff'

const KEYS: Record<Scope, { access: string; refresh: string }> = {
  client: { access: 'sct_client_access', refresh: 'sct_client_refresh' },
  staff: { access: 'sct_staff_access', refresh: 'sct_staff_refresh' },
}

function makeStorage(scope: Scope) {
  const { access, refresh } = KEYS[scope]
  return {
    getAccess(): string | null {
      return localStorage.getItem(access)
    },
    getRefresh(): string | null {
      return localStorage.getItem(refresh)
    },
    setTokens(accessValue: string, refreshValue: string): void {
      localStorage.setItem(access, accessValue)
      localStorage.setItem(refresh, refreshValue)
    },
    setAccess(value: string): void {
      localStorage.setItem(access, value)
    },
    clear(): void {
      localStorage.removeItem(access)
      localStorage.removeItem(refresh)
    },
    hasSession(): boolean {
      return Boolean(localStorage.getItem(access))
    },
  }
}

// Старая API для совместимости.
export const tokenStorage = makeStorage('client')

// Новые scoped-хранилища.
export const clientTokens = tokenStorage
export const staffTokens = makeStorage('staff')
