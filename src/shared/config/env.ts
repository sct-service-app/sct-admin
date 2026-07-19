/**
 * Все переменные окружения собираем в одном месте, чтобы было видно весь
 * контракт. Если переменной нет — кидаем понятную ошибку, а не undefined
 * летит в axios.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing env variable: ${name}. Проверь .env`)
  }
  return value
}

export const env = {
  API_BASE_URL: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
} as const
