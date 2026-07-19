/**
 * Утилиты для работы с казахстанскими номерами телефонов.
 *
 * Формат отображения: `+7 (XXX) XXX-XX-XX`
 * Формат для бэка:    `+7XXXXXXXXXX` (только цифры с `+7` префиксом)
 *
 * Бэк регекс из OpenAPI:  `^\+?[0-9\s\-()]{7,32}$`
 * — он принимает и с маской, и без. Но чтобы избежать сюрпризов,
 * на submit отправляем «чистую» форму без скобок и пробелов.
 */

/**
 * Применяет маску к произвольной строке. Используется для onChange
 * input'а — пользователь вводит цифры, мы возвращаем строку с
 * подставленными +7, скобками и пробелами.
 *
 * Поведение:
 *   ''         → ''        (пусто = пусто, чтобы placeholder показывался)
 *   '7'        → '+7'
 *   '8'        → '+7'       (8 → 7 — частая привычка казахстанцев)
 *   '77'       → '+7 (7'
 *   '+7777'    → '+7 (777) '
 *   '+77758512345' → '+7 (775) 851-23-45'
 */
export function formatPhoneInput(raw: string): string {
  // 1. Извлекаем только цифры
  let digits = raw.replace(/\D/g, '')

  // 2. Если начинается с 8 — заменяем на 7 (старый российско-казахстанский формат)
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1)
  }

  // 3. Если первая цифра не 7 — считаем, что пользователь ввёл локальную часть,
  //    добавляем 7 в начало
  if (digits.length > 0 && !digits.startsWith('7')) {
    digits = '7' + digits
  }

  // 4. Берём максимум 11 цифр (7 + 10 цифр номера)
  digits = digits.slice(0, 11)

  if (digits.length === 0) return ''

  // 5. Собираем маску посимвольно
  const rest = digits.slice(1) // без ведущей 7
  let out = '+7'
  if (rest.length > 0) {
    out += ' (' + rest.slice(0, 3)
  }
  if (rest.length >= 3) {
    out += ') ' + rest.slice(3, 6)
  }
  if (rest.length >= 6) {
    out += '-' + rest.slice(6, 8)
  }
  if (rest.length >= 8) {
    out += '-' + rest.slice(8, 10)
  }

  return out
}

/**
 * Возвращает «чистую» форму телефона для отправки на бэк.
 *   '+7 (775) 851-23-45' → '+77758512345'
 *   '' (пусто)            → ''
 */
export function unformatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits ? '+' + digits : ''
}

/**
 * Проверяет, что номер «полный» (11 цифр после +) — для валидации формы.
 */
export function isPhoneComplete(value: string): boolean {
  return value.replace(/\D/g, '').length === 11
}
