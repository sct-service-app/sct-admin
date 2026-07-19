import { QueryClient } from '@tanstack/react-query'

/**
 * Глобальный QueryClient. Подобран под наши данные: они меняются редко
 * (профиль, гараж, пакеты), но если что — invalidate'ом обновим явно.
 *
 *   staleTime: 1 минута   — за это время повторно не дёргаем сетку
 *   gcTime:    10 минут   — кэш живёт даже после unmount компонента
 *   retry:     1 раз      — лишний раз не долбим сервер
 *   refetchOnWindowFocus: false — иначе при возврате на вкладку всё перезапросится
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
