/**
 * Skeleton-плейсхолдер для лоадинга. Серая плашка с лёгкой пульсацией.
 *
 * Используется вместо `<Spinner />` на страницах, где есть структура —
 * для уменьшения CLS и быстрого вижуал-фидбека. Spinner оставляем для
 * коротких операций (submit, refetch) и небольших модалок.
 *
 * Готовые варианты:
 *   <Skeleton.Box />        — прямоугольник, кастомные классы через className
 *   <Skeleton.Text />       — строка текста
 *   <Skeleton.Card />       — карточка (рамка + содержимое)
 *   <Skeleton.Hero />       — крупный hero-блок
 */
import { cn } from '@/shared/lib/cn'

interface BoxProps {
  className?: string
}

function Box({ className }: BoxProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surfaceMuted',
        className,
      )}
    />
  )
}

function TextLine({ className }: BoxProps) {
  return <Box className={cn('h-4 w-full', className)} />
}

function Card({ className }: BoxProps) {
  return (
    <div
      className={cn(
        'rounded-sct border border-borderLight bg-white p-5 md:p-6',
        className,
      )}
    >
      <Box className="h-5 w-3/4" />
      <Box className="mt-3 h-3 w-1/2" />
      <Box className="mt-4 h-20 w-full" />
    </div>
  )
}

function Hero({ className }: BoxProps) {
  return (
    <div className={cn('rounded-sct-lg bg-surfaceMuted p-6 md:p-10', className)}>
      <Box className="h-3 w-24 bg-white/40" />
      <Box className="mt-4 h-8 w-3/4 bg-white/40" />
      <Box className="mt-3 h-4 w-1/2 bg-white/30" />
    </div>
  )
}

function Row({ className }: BoxProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-sct border border-borderLight bg-white p-4',
        className,
      )}
    >
      <Box className="h-12 w-20 shrink-0" />
      <div className="flex-1 space-y-2">
        <Box className="h-4 w-3/4" />
        <Box className="h-3 w-1/2" />
      </div>
    </div>
  )
}

function TableRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Row key={i} />
      ))}
    </div>
  )
}

export const Skeleton = {
  Box,
  TextLine,
  Card,
  Hero,
  Row,
  TableRows,
}
