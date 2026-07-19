/**
 * Разворачивание единого конверта ответов бэка.
 *
 * Бэк ввёл обработчик, который успешные ответы оборачивает в
 *   { success: true, message?, data: <полезная нагрузка> }
 * Но миграция частичная: часть ручек ещё отдаёт «плоский» ответ
 * (напр. garage/cars → { count, results }). Чтобы остальной код читал
 * `response.data.X` единообразно, разворачиваем конверт прозрачно:
 * если это `{ success: true, data }` — возвращаем `data`, иначе — как есть.
 *
 * Ошибки (success:false / 4xx) сюда не попадают — их разбирает parseApiError.
 */
export function unwrapEnvelope(data: unknown): unknown {
  if (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    (data as { success?: unknown }).success === true &&
    'data' in (data as object)
  ) {
    return (data as { data: unknown }).data
  }
  return data
}
