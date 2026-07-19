/**
 * <img>, который при ошибке загрузки молча скрывает себя и показывает
 * fallback. Нужен, потому что бэк отдаёт URL'ы на S3-бакет, который иногда
 * 403/404 (видимо, не все логотипы залиты).
 */
import { useState, type ImgHTMLAttributes, type ReactNode } from 'react'

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: ReactNode
}

export function SafeImage({ fallback, src, alt, className, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return <>{fallback ?? null}</>
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
      {...rest}
    />
  )
}
