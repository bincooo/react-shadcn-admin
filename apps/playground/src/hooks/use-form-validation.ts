import { useState } from 'react'

/** 表单提交后持续校验；错误文案按字段保存，由调用方直接展示。 */
export function useFormValidation<T extends object>(
  values: T,
  validate: (values: T) => Partial<Record<keyof T, string>>,
) {
  const [submittedState, setSubmitted] = useState(false)
  const errors: Partial<Record<keyof T, string>> = submittedState
    ? validate(values)
    : {}

  const validateBeforeSubmit = () => {
    setSubmitted(true)
    return Object.keys(validate(values)).length === 0
  }

  /** 控件与错误文案共享 id，避免各表单重复拼接无障碍属性。 */
  const getFieldProps = (field: keyof T, id: string) => ({
    id,
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `${id}-error` : undefined,
  })

  return { errors, validateBeforeSubmit, getFieldProps }
}
