/**
 * Универсальная форма для создания и редактирования пакета.
 *
 * Сценарии:
 *   - mode='create' → defaultValues пустые, submit → POST /create/
 *   - mode='edit' → defaultValues из fetchPackageForEdit, submit → PATCH /edit/
 *
 * Состав пакета — массив строк, добавляются через автокомплит
 * /package-items/?autocomplete=1. Удаление — кнопкой ×.
 *
 * Валидация zod синхронно, errors показываем под полями. Серверные ошибки
 * (DRF response.data.errors / detail) парсим через parseApiError и
 * показываем в красной плашке сверху формы.
 */
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Textarea } from '@/shared/ui/Textarea'
import { Toggle } from '@/shared/ui/Toggle'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui/Toast'
import { parseApiError } from '@/features/auth/errors'
import { slugify } from '@/shared/lib/slugify'
import { PackageItemAutocomplete } from './PackageItemAutocomplete'
import { ModificationPicker } from './ModificationPicker'
import {
  PACKAGE_FORM_DEFAULTS,
  packageFormSchema,
  type PackageFormValues,
} from './schema'
import {
  useCreatePackageMutation,
  useUpdatePackageMutation,
} from './queries'
import { uploadPackageImage } from './api'
import type { StaffPackageItemSearchResult } from './api'
import { usePackagesListPageData } from '../queries'
import type {
  StaffServicePackageDetail,
  StaffServicePackageWriteRequest,
} from '@/shared/api/types'

interface PackageFormProps {
  mode: 'create' | 'edit'
  // для edit передаём id и данные предзаполнения
  packageId?: number
  initial?: StaffServicePackageDetail
}

export function PackageForm({ mode, packageId, initial }: PackageFormProps) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  // Категории берём из list-page-data (там filters.categories = { id, name, slug }) —
  // отдельного endpoint'а у бэка нет. Запрашиваем минимально.
  const { data: listData } = usePackagesListPageData({ page: 1, page_size: 10 })
  const categories = listData?.filters?.categories ?? []

  const createMut = useCreatePackageMutation()
  const updateMut = useUpdatePackageMutation(packageId ?? 0)

  const defaultValues = initial ? mapServerToForm(initial) : PACKAGE_FORM_DEFAULTS

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const itemsArray = useFieldArray({ control: form.control, name: 'package_items' })

  // Фото пакета: imageFile — выбранный (ещё не загруженный) файл, imagePreview —
  // что показываем (object-url выбранного файла ИЛИ текущий image_url с бэка).
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    (initial as { image_url?: string | null })?.image_url ?? null,
  )
  // Slug авто-генерится из названия латиницей, пока пользователь не правил поле
  // руками. В edit-mode считаем, что slug уже задан (не перетираем).
  const [slugEdited, setSlugEdited] = useState(
    Boolean((initial as { slug?: string })?.slug),
  )

  // Если предзаполнение пришло асинхронно (edit-mode), переустанавливаем values.
  useEffect(() => {
    if (initial) {
      form.reset(mapServerToForm(initial))
      setImageFile(null)
      setImagePreview((initial as { image_url?: string | null }).image_url ?? null)
      setSlugEdited(Boolean((initial as { slug?: string }).slug))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id])

  const watchedItems = form.watch('package_items')
  const watchedPriceMode = form.watch('price_mode')
  const watchedDiscountType = form.watch('discount_type')
  const watchedPromotion = form.watch('has_promotion')
  const watchedModificationId = form.watch('modification_id')
  const watchedTitle = form.watch('title')

  // Пока slug не трогали вручную — держим его синхронным с названием (латиница).
  useEffect(() => {
    if (!slugEdited) form.setValue('slug', slugify(watchedTitle ?? ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTitle, slugEdited])

  // Локальная метка вида «Toyota Camry — 2.5 AT (181 л.с.)», которую
  // показываем под полем после выбора через ModificationPicker. Хранится
  // в useState (не в форме), потому что бэк её отдельно не возвращает.
  const [pickerOpen, setPickerOpen] = useState(false)
  const [modificationLabel, setModificationLabel] = useState<string>('')

  const computedSummary = computeLocalSummary(watchedItems)

  // register для slug держим отдельно, чтобы дополнить onChange/onBlur:
  // ручная правка отключает авто-синк с названием, а на blur приводим к латинице.
  const slugField = form.register('slug')

  const onAddItem = (item: StaffPackageItemSearchResult) => {
    // Бэк требует price_id у каждой позиции состава (иначе — "Ошибка валидации
    // данных пакета услуг"). Берём id активной цены из результата поиска.
    const priceId = item.price_id ?? item.active_price?.id ?? null
    if (priceId == null) {
      toast.error('У позиции нет активной цены — добавить в пакет нельзя.')
      return
    }
    itemsArray.append({
      id: null,
      item_id: item.id,
      item_name: item.name,
      item_type: item.item_type,
      price_id: priceId,
      quantity: '1',
      discount_type: 'NONE',
      discount_percent: '0.00',
      discount_amount: '0.00',
      is_required: true,
      is_included: true,
      sort_order: (itemsArray.fields.length + 1) * 10,
      comment: '',
    })
  }

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // позволяем выбрать тот же файл повторно
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Можно загрузить только изображение.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл больше 5 МБ — выберите поменьше.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const cancelPickedImage = () => {
    setImageFile(null)
    setImagePreview((initial as { image_url?: string | null })?.image_url ?? null)
  }

  const onSubmit = async (values: PackageFormValues) => {
    setServerError(null)
    // Страховка: бэк требует price_id у каждой позиции. В норме он
    // проставляется при добавлении из поиска и при загрузке пакета на
    // редактирование; если всё же пусто — не шлём заведомо провальный
    // запрос, а подсказываем, как починить.
    const noPrice = values.package_items.find((l) => l.price_id == null)
    if (noPrice) {
      setServerError(
        `У позиции «${noPrice.item_name}» не определена цена — удалите её и добавьте заново из поиска.`,
      )
      return
    }
    try {
      const payload = mapFormToServer(values)
      const result =
        mode === 'create'
          ? await createMut.mutateAsync(payload)
          : await updateMut.mutateAsync(payload)
      // Фото — вторым шагом (multipart PATCH), только если выбран новый файл.
      if (imageFile && typeof result.id === 'number') {
        try {
          await uploadPackageImage(result.id, imageFile)
        } catch {
          toast.warning('Пакет сохранён, но фото не загрузилось — попробуйте ещё раз.')
        }
      }
      toast.success(mode === 'create' ? 'Пакет создан' : 'Изменения сохранены')
      if (typeof result.id === 'number') {
        navigate(`/packages/${result.id}`, { replace: mode === 'create' })
      } else {
        navigate('/packages')
      }
    } catch (err) {
      const parsed = parseApiError(err, 'Не удалось сохранить пакет.')
      // server field errors → подсветим под полями
      for (const [field, message] of Object.entries(parsed.fields)) {
        if (field in form.getValues()) {
          form.setError(field as keyof PackageFormValues, { type: 'server', message })
        }
      }
      setServerError(parsed.general)
    }
  }

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-sct border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {serverError}
        </div>
      )}

      {/* 1. Основная инфо */}
      <Section title="1. Основная информация">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Название пакета *"
              placeholder="Полное ТО для Toyota Camry"
              {...form.register('title')}
              error={form.formState.errors.title?.message}
            />
          </div>
          <Select
            label="Статус *"
            {...form.register('status')}
            error={form.formState.errors.status?.message}
          >
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликован</option>
            <option value="UNPUBLISHED">Снят с публикации</option>
            <option value="ARCHIVED">В архиве</option>
          </Select>
          <Select
            label="Категория *"
            {...form.register('category_id', { valueAsNumber: true })}
            error={form.formState.errors.category_id?.message}
          >
            <option value={0}>— выберите —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Slug"
            placeholder="auto / latin / dashes"
            {...slugField}
            onChange={(e) => {
              slugField.onChange(e)
              setSlugEdited(true)
            }}
            onBlur={(e) => {
              slugField.onBlur(e)
              form.setValue('slug', slugify(e.target.value), { shouldDirty: true })
            }}
            hint="Только латиница. Если пусто — сгенерируется из названия."
          />
          <Input
            type="number"
            label="Порядок сортировки"
            {...form.register('sort_order', { valueAsNumber: true })}
          />
        </div>
        <div className="mt-4">
          <Toggle
            checked={form.watch('is_featured')}
            onChange={(v) => form.setValue('is_featured', v)}
            label="Избранный пакет"
            description="Будет выделен в каталоге как «Рекомендуемый»."
          />
        </div>
      </Section>

      {/* 2. Описание */}
      <Section title="2. Описание и фото">
        <div className="space-y-4">
          <Textarea
            label="Краткое описание"
            rows={3}
            placeholder="1-2 предложения для карточки в списке."
            {...form.register('short_description')}
            error={form.formState.errors.short_description?.message}
          />
          <Textarea
            label="Полное описание"
            rows={6}
            placeholder="Технический регламент, этапы, особенности..."
            {...form.register('description')}
            hint="Простой текст. Rich text появится в следующей версии."
            error={form.formState.errors.description?.message}
          />

          {/* Фотография пакета */}
          <div>
            <p className="mb-2 block text-[11px] font-800 uppercase tracking-widest text-textSecondary">
              Фотография пакета
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="h-24 w-32 shrink-0 overflow-hidden rounded-sct border border-borderLight bg-surfaceLight">
                {imagePreview ? (
                  <img src={imagePreview} alt="Фото пакета" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-textSecondary/40">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-sct border border-borderLight bg-white px-4 py-2 text-[11px] font-900 uppercase tracking-widest text-textSecondary transition-colors hover:border-brandBlue hover:text-brandBlue">
                  {imagePreview ? 'Заменить фото' : 'Загрузить фото'}
                  <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
                </label>
                {imageFile && (
                  <button
                    type="button"
                    onClick={cancelPickedImage}
                    className="text-left text-[11px] font-bold uppercase tracking-widest text-textSecondary/70 hover:text-red-600"
                  >
                    Отменить выбор
                  </button>
                )}
                <p className="text-[10px] font-medium text-textSecondary/70">
                  JPG/PNG до 5 МБ. {imageFile ? 'Загрузится после «Сохранить».' : 'Сохранится после нажатия «Сохранить».'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Привязка к авто */}
      <Section title="3. Привязка к автомобилю">
        <div>
          <p className="mb-2 block text-[11px] font-800 uppercase tracking-widest text-textSecondary">
            Модификация авто *
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-sct border border-borderLight bg-surfaceLight px-4 py-3">
              {watchedModificationId ? (
                <>
                  <p className="truncate text-sm font-900 uppercase tracking-tight text-textPrimary">
                    {modificationLabel || 'Модификация выбрана'}
                  </p>
                  <p className="mt-1 truncate font-mono text-[10px] text-textSecondary/70">
                    id: {watchedModificationId}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-textSecondary">
                  Модификация не выбрана
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPickerOpen(true)}
            >
              {watchedModificationId ? 'Сменить' : 'Выбрать модификацию'}
            </Button>
          </div>
          {form.formState.errors.modification_id?.message && (
            <p className="mt-1.5 text-[11px] font-semibold text-red-600">
              {form.formState.errors.modification_id.message}
            </p>
          )}
          {/* hidden input — RHF регистрирует значение, чтобы submit нёс его в payload */}
          <input type="hidden" {...form.register('modification_id')} />
        </div>

        <ModificationPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(modificationId, label) => {
            form.setValue('modification_id', String(modificationId), {
              shouldValidate: true,
              shouldDirty: true,
            })
            setModificationLabel(label)
          }}
        />
      </Section>

      {/* 4. Состав */}
      <Section title="4. Состав пакета">
        <PackageItemAutocomplete onSelect={onAddItem} />

        {itemsArray.fields.length === 0 ? (
          <p className="mt-6 rounded-sct border border-dashed border-borderLight bg-surfaceLight/60 p-6 text-center text-sm font-medium text-textSecondary">
            В пакете пока ничего нет. Найдите товар или услугу выше и добавьте в состав.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-borderLight bg-surfaceLight text-[10px] font-900 uppercase tracking-widest text-textSecondary">
                  <th className="px-4 py-3 text-left">Номенклатура</th>
                  <th className="px-4 py-3 text-center">Кол-во</th>
                  <th className="px-4 py-3 text-center">Скидка</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {itemsArray.fields.map((field, index) => (
                  <tr key={field.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-bold text-textPrimary">{field.item_name}</p>
                      <p className="mt-1 font-mono text-[10px] text-textSecondary">
                        id {field.item_id} · {field.item_type === 'SERVICE' ? 'услуга' : 'товар'}
                      </p>
                      <input
                        type="hidden"
                        {...form.register(`package_items.${index}.item_id` as const, {
                          valueAsNumber: true,
                        })}
                      />
                      <input
                        type="hidden"
                        {...form.register(`package_items.${index}.sort_order` as const, {
                          valueAsNumber: true,
                        })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        className="!h-10 !text-sm"
                        {...form.register(`package_items.${index}.quantity` as const)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <Select
                          className="!h-10 !text-sm"
                          {...form.register(`package_items.${index}.discount_type` as const)}
                        >
                          <option value="NONE">без скидки</option>
                          <option value="PERCENT">процент</option>
                          <option value="FIXED">сумма</option>
                        </Select>
                        {form.watch(`package_items.${index}.discount_type` as const) === 'PERCENT' && (
                          <Input
                            className="!h-10 !text-sm"
                            placeholder="0.00"
                            {...form.register(`package_items.${index}.discount_percent` as const)}
                          />
                        )}
                        {form.watch(`package_items.${index}.discount_type` as const) === 'FIXED' && (
                          <Input
                            className="!h-10 !text-sm"
                            placeholder="0.00"
                            {...form.register(`package_items.${index}.discount_amount` as const)}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => itemsArray.remove(index)}
                        className="text-textSecondary/40 transition-colors hover:text-red-500"
                        title="Удалить из пакета"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 rounded-sct border border-borderLight bg-surfaceLight p-4 text-[11px] font-bold uppercase tracking-widest text-textSecondary">
          <p>
            Позиций в пакете: <span className="text-brandBlue">{computedSummary.count}</span>
          </p>
          <p className="mt-1 text-[10px] font-medium normal-case opacity-70">
            Точная итоговая цена пересчитается на бэке после сохранения.
          </p>
        </div>
      </Section>

      {/* 5. Цена */}
      <Section title="5. Цена и скидка">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select label="Режим цены" {...form.register('price_mode')}>
            <option value="AUTO">Авто (по составу)</option>
            <option value="MANUAL">Вручную</option>
          </Select>
          {watchedPriceMode === 'MANUAL' && (
            <Input
              label="Ручная цена"
              placeholder="42000.00"
              {...form.register('manual_price')}
            />
          )}
          <Input label="Валюта" {...form.register('currency')} hint="KZT" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select label="Тип скидки" {...form.register('discount_type')}>
            <option value="NONE">Без скидки</option>
            <option value="PERCENT">Процент</option>
            <option value="FIXED">Сумма</option>
          </Select>
          {watchedDiscountType === 'PERCENT' && (
            <Input
              label="Скидка, %"
              placeholder="5.00"
              {...form.register('discount_percent')}
            />
          )}
          {watchedDiscountType === 'FIXED' && (
            <Input
              label="Скидка, ₸"
              placeholder="1000.00"
              {...form.register('discount_amount')}
            />
          )}
        </div>
      </Section>

      {/* 6. Акция */}
      <Section title="6. Промо-акция">
        <Toggle
          checked={watchedPromotion}
          onChange={(v) => form.setValue('has_promotion', v)}
          label="Активировать акцию"
          description="Если включено — пакет попадёт в раздел «Акционные» на клиенте."
        />
        {watchedPromotion && (
          <div className="mt-4 space-y-4">
            <Input
              label="Заголовок акции"
              placeholder="Скидка −20% на работы"
              {...form.register('promotion_title')}
              error={form.formState.errors.promotion_title?.message}
            />
            <Textarea
              label="Условия акции"
              rows={3}
              placeholder="Бесплатная диагностика ходовой при покупке пакета..."
              {...form.register('promotion_terms')}
              error={form.formState.errors.promotion_terms?.message}
            />
          </div>
        )}
      </Section>

      {/* Footer */}
      <div className="flex flex-col-reverse items-stretch gap-3 md:flex-row md:items-center md:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate(packageId ? `/packages/${packageId}` : '/packages')}
          disabled={submitting}
        >
          Отмена
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {mode === 'create' ? 'Создать пакет' : 'Сохранить изменения'}
        </Button>
      </div>
    </form>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-5 md:p-6">
      <h3 className="mb-4 text-base font-900 uppercase tracking-tight text-textPrimary md:text-lg">
        {title}
      </h3>
      {children}
    </Card>
  )
}

/**
 * Маппинг ответа GET /packages/{id}/ в форму. Сервер использует строковые
 * поля для decimal, и вкладывает item внутрь package_items[i].item.
 */
function mapServerToForm(src: StaffServicePackageDetail): PackageFormValues {
  return {
    title: src.title ?? '',
    slug: src.slug ?? '',
    status: (src.status ?? 'DRAFT') as PackageFormValues['status'],
    category_id: src.category?.id ?? (0 as unknown as number),
    modification_id: (() => {
      const mid = (src as { modification_id?: number | null }).modification_id
      return mid != null ? String(mid) : ''
    })(),
    short_description: src.short_description ?? '',
    description: src.description ?? '',
    price_mode: (src.price_mode ?? 'AUTO') as PackageFormValues['price_mode'],
    currency: src.currency ?? 'KZT',
    discount_type: (src.discount_type ?? 'NONE') as PackageFormValues['discount_type'],
    discount_percent: src.discount_percent ?? '0.00',
    discount_amount: src.discount_amount ?? '0.00',
    manual_price: src.manual_price ?? null,
    has_promotion: Boolean(src.has_promotion),
    promotion_title: src.promotion_title ?? '',
    promotion_terms: src.promotion_terms ?? '',
    is_featured: Boolean(src.is_featured),
    sort_order: src.sort_order ?? 100,
    package_items: (src.package_items ?? []).map((line) => {
      const itemObj = (line as { item?: { id?: number; name?: string; item_type?: string } }).item
      return {
        id: (line as { id?: number }).id ?? null,
        item_id: (line as { item_id?: number }).item_id ?? itemObj?.id ?? 0,
        item_name: itemObj?.name ?? (line as { item_name?: string }).item_name ?? '',
        item_type: (itemObj?.item_type ?? 'PRODUCT') as 'PRODUCT' | 'SERVICE',
        // Read-сторона отдаёт id цены в поле `price` (integer), НЕ `price_id`.
        // Раньше читали `price_id` → всегда null → при пересохранении пакета
        // падала валидация "price_id: This field is required".
        price_id:
          (line as { price?: number | null }).price ??
          (line as { price_id?: number | null }).price_id ??
          null,
        quantity: stripTrailingZeros((line as { quantity?: string }).quantity ?? '1'),
        discount_type:
          ((line as { discount_type?: string }).discount_type as
            | 'NONE'
            | 'PERCENT'
            | 'FIXED') ?? 'NONE',
        discount_percent: (line as { discount_percent?: string }).discount_percent ?? '0.00',
        discount_amount: (line as { discount_amount?: string }).discount_amount ?? '0.00',
        is_required: Boolean((line as { is_required?: boolean }).is_required ?? true),
        is_included: Boolean((line as { is_included?: boolean }).is_included ?? true),
        sort_order: (line as { sort_order?: number }).sort_order ?? 10,
        comment: (line as { comment?: string }).comment ?? '',
      }
    }),
  }
}

/**
 * Маппинг значений формы в payload для бэка.
 * Бэк ждёт строковые decimal'ы и массив items.
 */
function mapFormToServer(values: PackageFormValues): StaffServicePackageWriteRequest {
  const payload = {
    category_id: values.category_id,
    // Бэк перешёл на числовой modification_id (Template (4).yaml); autogen-схема
    // ещё знает только старый modification_source_id, поэтому каст ниже.
    modification_id: Number(values.modification_id),
    title: values.title,
    // Страховка: slug всегда латиницей (бэк из кириллицы генерил кириллический).
    slug: slugify(values.slug || values.title) || undefined,
    status: values.status,
    short_description: values.short_description,
    description: values.description,
    has_promotion: values.has_promotion,
    promotion_title: values.promotion_title,
    promotion_terms: values.promotion_terms,
    price_mode: values.price_mode,
    currency: values.currency,
    discount_type: values.discount_type,
    discount_percent: values.discount_percent,
    discount_amount: values.discount_amount,
    manual_price: values.price_mode === 'MANUAL' ? values.manual_price : null,
    is_featured: values.is_featured,
    sort_order: values.sort_order,
    package_items: values.package_items.map((line) => ({
      item_id: line.item_id,
      price_id: line.price_id ?? null,
      quantity: line.quantity,
      discount_type: line.discount_type,
      discount_percent: line.discount_percent,
      discount_amount: line.discount_amount,
      is_required: line.is_required,
      is_included: line.is_included,
      sort_order: line.sort_order,
      comment: line.comment,
    })),
  }
  // Каст: autogen-схема знает только старый modification_source_id, а бэк ждёт
  // числовой modification_id (Template (4).yaml). Остальные поля валидны.
  return payload as unknown as StaffServicePackageWriteRequest
}

/** Локальный счётчик позиций — для UI-плашки. Реальный итог считает бэк. */
function computeLocalSummary(rows: PackageFormValues['package_items']) {
  return { count: rows.length }
}

/**
 * Убирает лишние нули в дробной части для показа в поле «Кол-во».
 * Бэк всегда отдаёт количество с тремя знаками ("1.000", "4.000"), а в
 * форме показываем по-человечески: "1.000" → "1", "1.500" → "1.5",
 * "0.350" → "0.35". Целые числа без точки не трогаем ("100" → "100").
 * Бэк принимает и "1", и "1.5" — паттерн decimal допускает оба.
 */
function stripTrailingZeros(value: string): string {
  const v = value.trim()
  if (!v.includes('.')) return v
  return v.replace(/\.?0+$/, '') || '0'
}
