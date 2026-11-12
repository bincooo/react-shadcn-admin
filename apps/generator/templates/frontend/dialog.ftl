import { useState, type FormEvent } from 'react'
<#if features.hasInput>import { Input } from '@repo/ui/components/input'
</#if><#if features.hasEnum>import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
</#if><#if features.hasTextarea>import { Textarea } from '@repo/ui/components/textarea'
</#if>import {
  FormField,
  FormSheet,<#if features.hasBoolean>
  FormSwitchField,</#if>
} from '@/components/common/form-sheet'
import { useFormValidation } from '@/hooks/use-form-validation'
import type { ${entity}, ${entity}Input } from '../types'
import type { ${entity}State } from './use-${entityKebab}'

<#list enumColumns as column>const ${column.optionsName} = [
<#list column.enumItems as item>  { value: ${item.value?js}, label: ${item.label?js} },
</#list>]
<#if column_has_next>
</#if></#list>interface FormState {
<#list businessColumns as column>  ${column.javaName}: <#if column.isBoolean>boolean<#else>string</#if>
</#list>}

<#if features.hasDateTime>/** Instant -> <input type="datetime-local"> 的本地时间字符串 */
function toLocalDateTime(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part: number) => String(part).padStart(2, '0')
  return `\${date.getFullYear()}-\${pad(date.getMonth() + 1)}-\${pad(date.getDate())}T\${pad(date.getHours())}:\${pad(date.getMinutes())}`
}

</#if>function withFormState(<#if businessColumns?size gt 0>editing<#else>_editing</#if>: ${entity} | null): FormState {
  return {
<#list businessColumns as column>    ${column.javaName}: <#if column.isBoolean>editing ? Boolean(editing.${column.javaName}) : <#if column.defaultValue == 'true'>true<#else>false</#if><#elseif column.isDateTime>toLocalDateTime(editing?.${column.javaName})<#elseif column.isDate>editing?.${column.javaName}?.slice(0, 10) ?? ''<#elseif column.isEnum>editing ? String(editing.${column.javaName} ?? '') : ${column.enumDefault?js}<#else>editing ? String(editing.${column.javaName} ?? '') : ${column.defaultValue?js}</#if>,
</#list>  }
}

<#if businessColumns?size gt 0>function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
<#list businessColumns as column><#if !column.isBoolean><#if !column.nullable><#if column.isEnum || column.isDate || column.isDateTime>  if (!form.${column.javaName}) errors.${column.javaName} = ${(column.label + '不能为空')?js}
<#else>  if (!form.${column.javaName}.trim()) errors.${column.javaName} = ${(column.label + '不能为空')?js}
</#if></#if><#if (column.isString || column.isText || column.isUuid) && column.length>  if (form.${column.javaName}.trim().length > ${column.length}) errors.${column.javaName} = ${(column.label + '长度不能超过 ' + column.length)?js}
</#if><#if column.isNumeric>  if (form.${column.javaName}.trim() && !Number.isFinite(Number(form.${column.javaName}))) errors.${column.javaName} = '请输入数字'
</#if><#if column.isEnum && column.enumValues?size gt 0>  if (form.${column.javaName} && ![${column.enumValuesJs}].includes(form.${column.javaName})) errors.${column.javaName} = '请选择有效值'
</#if></#if></#list>  return errors
}
<#else>function validate(_form: FormState): Partial<Record<keyof FormState, string>> {
  return {}
}
</#if>

/** 新建 / 编辑${displayName}表单。 */
export function ${entity}Dialog({ state }: { state: ${entity}State }) {
  const editing = state.dialog.editing
  const isCreate = editing === null
  // 父组件通过 key 重挂载，保证打开 / 切换目标时以最新对象重建初值
  const [formState, setForm] = useState<FormState>(() => withFormState(editing))
  const { errors, validateBeforeSubmit, getFieldProps } = useFormValidation(
    formState,
    validate,
  )
  const setField = (changes: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...changes }))
  const pending = state.saveMutation.isPending

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pending || !validateBeforeSubmit()) return
    const input: ${entity}Input = {
<#list businessColumns as column>      ${column.javaName}: <#if column.isBoolean>formState.${column.javaName}<#elseif column.isNumeric><#if column.nullable>formState.${column.javaName}.trim() ? Number(formState.${column.javaName}) : undefined<#else>Number(formState.${column.javaName})</#if><#elseif column.isDateTime><#if column.nullable>formState.${column.javaName} ? new Date(formState.${column.javaName}).toISOString() : undefined<#else>new Date(formState.${column.javaName}).toISOString()</#if><#elseif column.isDate><#if column.nullable>formState.${column.javaName} || undefined<#else>formState.${column.javaName}</#if><#elseif column.isEnum>formState.${column.javaName} as ${entity}Input[${column.javaName?js}]<#elseif column.isJson><#if column.nullable>formState.${column.javaName} || undefined<#else>formState.${column.javaName}</#if><#else><#if column.nullable>formState.${column.javaName}.trim() || undefined<#else>formState.${column.javaName}.trim()</#if></#if>,
</#list>    }
    state.saveMutation.mutate({ id: isCreate ? null : editing.id, input })
  }

  return (
    <FormSheet
      open={state.dialog.open}
      onClose={state.closeDialog}
      title={isCreate ? ${('新增' + displayName)?js} : ${('编辑' + displayName)?js}}
      description=${tableCommentJsx}
      pending={pending}
      onSubmit={submit}
    >
<#list businessColumns as column><#if column.isBoolean>      <FormSwitchField
        label=${column.label?jsx}
        htmlFor="${column.inputId}"
        checked={formState.${column.javaName}}
        onCheckedChange={(checked) => setField({ ${column.javaName}: checked })}
      />
<#elseif column.isEnum>      <FormField
        label=${column.label?jsx}
        htmlFor="${column.inputId}"
        error={errors.${column.javaName}}<#if !column.nullable>
        required</#if>
      >
        <Select
          value={formState.${column.javaName}}
          items={${column.optionsName}}
          onValueChange={(value) => setField({ ${column.javaName}: value ?? '' })}
        >
          <SelectTrigger id="${column.inputId}" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {${column.optionsName}.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
<#elseif column.isText || column.isJson>      <FormField
        label=${column.label?jsx}
        htmlFor="${column.inputId}"
        error={errors.${column.javaName}}<#if !column.nullable>
        required</#if>
      >
        <Textarea
          {...getFieldProps(${column.javaName?js}, "${column.inputId}")}
          rows={4}
          value={formState.${column.javaName}}
          onChange={(event) => setField({ ${column.javaName}: event.target.value })}
        />
      </FormField>
<#else>      <FormField
        label=${column.label?jsx}
        htmlFor="${column.inputId}"
        error={errors.${column.javaName}}<#if !column.nullable>
        required</#if>
      >
        <Input
          {...getFieldProps(${column.javaName?js}, "${column.inputId}")}<#if column.inputType?has_content>
          type="${column.inputType}"<#if column.step?has_content>
          step="${column.step}"</#if></#if>
          value={formState.${column.javaName}}
          onChange={(event) => setField({ ${column.javaName}: event.target.value })}
        />
      </FormField>
</#if></#list>    </FormSheet>
  )
}
