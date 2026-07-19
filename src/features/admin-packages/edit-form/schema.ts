/**
 * Zod-схема формы пакета. Валидируем на фронте, но сохраняем поведение
 * "бэк всё равно проверит" — поэтому правила мягкие.
 *
 * Decimal-поля держим строками: бэк ждёт строки "12000.00" / "5.00" / "1.000",
 * а не number. Не превращаем в числа на input'е — это сломает отображение
 * trailing zeros и регулярные округления.
 */
import { z } from 'zod'

const decimal = (msg = 'Введите число') =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || /^-?\d+([.,]\d+)?$/.test(v.replace(',', '.')), msg)
    .transform((v) => (v === '' ? '0.00' : v.replace(',', '.')))

export const packageItemRowSchema = z.object({
  // id есть у существующих строк (из API), новые — без id.
  id: z.number().nullable(),
  item_id: z.number({ message: 'Выберите товар или услугу' }),
  item_name: z.string(),
  item_type: z.enum(['PRODUCT', 'SERVICE']).optional(),
  price_id: z.number().nullable().optional(),
  quantity: decimal('Кол-во должно быть числом'),
  // Бэковый DiscountTypeEnum: NONE | PERCENT | FIXED («фиксированная сумма»).
  discount_type: z.enum(['NONE', 'PERCENT', 'FIXED']),
  discount_percent: decimal(),
  discount_amount: decimal(),
  is_required: z.boolean(),
  is_included: z.boolean(),
  sort_order: z.number().int().nonnegative(),
  comment: z.string(),
})

export const packageFormSchema = z.object({
  // Основное
  title: z.string().min(1, 'Название обязательно').max(255),
  slug: z.string().max(255).optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED']),
  category_id: z
    .number({ message: 'Выберите категорию' })
    .int()
    .positive('Выберите категорию'),
  modification_id: z
    .string()
    .min(1, 'Укажите модификацию'),

  short_description: z.string().max(1000),
  description: z.string().max(10_000),

  // Цена
  price_mode: z.enum(['AUTO', 'MANUAL']),
  currency: z.string().min(2),
  discount_type: z.enum(['NONE', 'PERCENT', 'FIXED']),
  discount_percent: decimal(),
  discount_amount: decimal(),
  manual_price: z.string().nullable(),

  // Промо
  has_promotion: z.boolean(),
  promotion_title: z.string().max(255),
  promotion_terms: z.string().max(2000),

  // Прочее
  is_featured: z.boolean(),
  sort_order: z.number().int().min(0).max(99999),

  // Состав
  package_items: z.array(packageItemRowSchema),
}).superRefine((val, ctx) => {
  // Если включена акция — заголовок обязателен (бэк это тоже проверяет и
  // возвращает error.details.promotion_title). Ловим на фронте заранее.
  if (val.has_promotion && !val.promotion_title.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['promotion_title'],
      message: 'Если включена акция, укажите заголовок акции.',
    })
  }
})

export type PackageFormValues = z.infer<typeof packageFormSchema>
export type PackageItemRow = z.infer<typeof packageItemRowSchema>

/** Дефолт для нового пакета. */
export const PACKAGE_FORM_DEFAULTS: PackageFormValues = {
  title: '',
  slug: '',
  status: 'DRAFT',
  category_id: 0 as unknown as number, // вынуждены так — RHF не любит undefined у number
  modification_id: '',
  short_description: '',
  description: '',
  price_mode: 'AUTO',
  currency: 'KZT',
  discount_type: 'NONE',
  discount_percent: '0.00',
  discount_amount: '0.00',
  manual_price: null,
  has_promotion: false,
  promotion_title: '',
  promotion_terms: '',
  is_featured: false,
  sort_order: 100,
  package_items: [],
}
