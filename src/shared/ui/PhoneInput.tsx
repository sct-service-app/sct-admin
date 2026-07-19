/**
 * Inputs с маской `+7 (XXX) XXX-XX-XX` для казахстанских номеров.
 *
 * Под капотом — обычный `<Input>` (наша дизайн-система) с controlled
 * value. Маска применяется на onChange через `formatPhoneInput`. RHF
 * мы оборачиваем через `<Controller>` снаружи; здесь компонент остаётся
 * простым controlled.
 *
 * Использование с RHF:
 *
 *   <Controller
 *     name="phone"
 *     control={control}
 *     render={({ field }) => (
 *       <PhoneInput
 *         label="Номер телефона"
 *         value={field.value}
 *         onChange={field.onChange}
 *         error={errors.phone?.message}
 *       />
 *     )}
 *   />
 *
 * `value` хранится в форме в маскированном виде ('+7 (775) ...'). При
 * сабмите перегоняем через `unformatPhone()`.
 */
import { forwardRef, useCallback, type InputHTMLAttributes } from 'react'
import { Input, type InputProps } from './Input'
import { formatPhoneInput } from '@/shared/lib/phone'

export interface PhoneInputProps
  extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'inputMode'> {
  value: string
  onChange: (value: string) => void
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...rest }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value
        // Backspace по форматирующему символу (пробел/скобка/дефис): текст
        // стал короче, но повторное маскирование возвращает прежнее значение —
        // удаление «зависает». В этом случае убираем последнюю цифру.
        if (text.length < value.length && formatPhoneInput(text) === value) {
          const digits = value.replace(/\D/g, '')
          onChange(formatPhoneInput(digits.slice(0, -1)))
          return
        }
        onChange(formatPhoneInput(text))
      },
      [onChange, value],
    )

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+7 (___) ___-__-__"
        value={value}
        onChange={handleChange}
        {...(rest as InputHTMLAttributes<HTMLInputElement>)}
      />
    )
  },
)
PhoneInput.displayName = 'PhoneInput'
