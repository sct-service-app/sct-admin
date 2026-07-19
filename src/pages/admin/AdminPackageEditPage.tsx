/**
 * Страница создания и редактирования пакета.
 *
 * Один компонент для двух режимов:
 *   /packages/new          → mode='create'
 *   /packages/:id/edit     → mode='edit', грузим initial через GET /packages/{id}/
 */
import { Link, useParams } from 'react-router-dom'
import { PackageForm } from '@/features/admin-packages/edit-form/PackageForm'
import { usePackageForEdit } from '@/features/admin-packages/edit-form/queries'
import { Spinner } from '@/shared/ui/Spinner'
import { Card } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'

export default function AdminPackageEditPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const mode: 'create' | 'edit' = typeof id === 'number' && Number.isFinite(id) ? 'edit' : 'create'

  const { data, isLoading, isError } = usePackageForEdit(mode === 'edit' ? id : undefined)

  if (mode === 'edit' && isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (mode === 'edit' && (isError || !data)) {
    return (
      <section className="container-admin py-10">
        <Card className="p-6 text-center">
          <p className="font-bold text-red-700">Не удалось загрузить пакет для редактирования.</p>
          <Link to="/packages" className="mt-4 inline-block">
            <Button variant="ghost" size="sm">
              К списку
            </Button>
          </Link>
        </Card>
      </section>
    )
  }

  return (
    <section className="container-admin space-y-6 py-8 md:py-10">
      <header>
        <Link
          to={mode === 'edit' ? `/packages/${id}` : '/packages'}
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-textSecondary hover:text-brandBlue"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Назад
        </Link>
        <h1 className="mt-3 text-3xl font-900 uppercase tracking-tight text-textPrimary md:text-4xl">
          {mode === 'create' ? 'Новый пакет' : `Редактирование пакета #${id}`}
        </h1>
      </header>

      <PackageForm mode={mode} packageId={mode === 'edit' ? id : undefined} initial={data} />
    </section>
  )
}
