import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Утилита для объединения tailwind-классов с дедупликацией конфликтующих.
 * Использовать везде, где соединяешь классы условно:
 *   cn('p-4 rounded', isActive && 'bg-brandBlue text-white', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
