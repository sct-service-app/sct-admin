/**
 * Форма логина в админку. В отличие от клиентской — отдельная страница, не
 * модалка, и принимает username (не телефон).
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useStaffAuthStore } from './store'
import { loginStaff } from './api'
import { parseApiError } from '@/features/auth/errors'

const loginSchema = z.object({
  username: z.string().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
})
type LoginValues = z.infer<typeof loginSchema>

export function StaffLoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const setSession = useStaffAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (values: LoginValues) => {
    setServerError(null)
    try {
      const data = await loginStaff(values)
      if (!data.user) {
        setServerError('Сервер не вернул профиль пользователя.')
        return
      }
      setSession(data.access, data.refresh, data.user)
      const next = searchParams.get('next')
      navigate(next ? decodeURIComponent(next) : '/packages', { replace: true })
    } catch (err) {
      const parsed = parseApiError(err, 'Неверный логин или пароль.')
      for (const [field, message] of Object.entries(parsed.fields)) {
        if (field === 'username' || field === 'password') {
          setError(field, { type: 'server', message })
        }
      }
      if (parsed.general) setServerError(parsed.general)
    }
  }

  return (
    <Card className="w-full max-w-md p-6 md:p-8">
      <p className="text-[10px] font-900 uppercase tracking-[0.3em] text-brandBlue">
        SCT Admin
      </p>
      <h1 className="mt-3 text-3xl font-900 uppercase tracking-tight text-textPrimary">
        Вход в админку
      </h1>
      <p className="mt-2 text-sm text-textSecondary">
        Доступ только для сотрудников SCT Service.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Логин"
          autoComplete="username"
          {...register('username')}
          error={errors.username?.message}
        />
        <Input
          label="Пароль"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
        />

        {serverError && (
          <div className="rounded-sct border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {serverError}
          </div>
        )}

        <Button type="submit" fullWidth loading={isSubmitting}>
          Войти
        </Button>
      </form>
    </Card>
  )
}
