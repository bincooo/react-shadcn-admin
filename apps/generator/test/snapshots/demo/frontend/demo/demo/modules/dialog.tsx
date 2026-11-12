import { useState, type FormEvent } from 'react'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { Textarea } from '@repo/ui/components/textarea'
import {
  FormField,
  FormSheet,
  FormSwitchField,
} from '@/components/common/form-sheet'
import { useFormValidation } from '@/hooks/use-form-validation'
import type { Demo, DemoInput } from '../types'
import type { DemoState } from './use-demo'

const STATUS_OPTIONS = [
  { value: 'NEW', label: '新建' },
  { value: 'DONE', label: '完成' },
]
interface FormState {
  code: string
  descText: string
  qty: string
  amount: string
  enabled: boolean
  bizDate: string
  createdTime: string
  status: string
  extra: string
  traceId: string
}

/** Instant -> <input type="datetime-local"> 的本地时间字符串 */
function toLocalDateTime(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function withFormState(editing: Demo | null): FormState {
  return {
    code: editing ? String(editing.code ?? '') : '',
    descText: editing ? String(editing.descText ?? '') : '',
    qty: editing ? String(editing.qty ?? '') : '0',
    amount: editing ? String(editing.amount ?? '') : '',
    enabled: editing ? Boolean(editing.enabled) : true,
    bizDate: editing?.bizDate?.slice(0, 10) ?? '',
    createdTime: toLocalDateTime(editing?.createdTime),
    status: editing ? String(editing.status ?? '') : 'NEW',
    extra: editing ? String(editing.extra ?? '') : '',
    traceId: editing ? String(editing.traceId ?? '') : '',
  }
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!form.code.trim()) errors.code = '编码不能为空'
  if (form.code.trim().length > 32) errors.code = '编码长度不能超过 32'
  if (!form.qty.trim()) errors.qty = '数量不能为空'
  if (form.qty.trim() && !Number.isFinite(Number(form.qty))) errors.qty = '请输入数字'
  if (form.amount.trim() && !Number.isFinite(Number(form.amount))) errors.amount = '请输入数字'
  if (!form.status) errors.status = '状态不能为空'
  if (form.status && !['NEW', 'DONE'].includes(form.status)) errors.status = '请选择有效值'
  if (form.traceId.trim().length > 36) errors.traceId = '追踪号长度不能超过 36'
  return errors
}

/** 新建 / 编辑演示表单。 */
export function DemoDialog({ state }: { state: DemoState }) {
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
    const input: DemoInput = {
      code: formState.code.trim(),
      descText: formState.descText.trim() || undefined,
      qty: Number(formState.qty),
      amount: formState.amount.trim() ? Number(formState.amount) : undefined,
      enabled: formState.enabled,
      bizDate: formState.bizDate || undefined,
      createdTime: formState.createdTime ? new Date(formState.createdTime).toISOString() : undefined,
      status: formState.status as DemoInput['status'],
      extra: formState.extra || undefined,
      traceId: formState.traceId.trim() || undefined,
    }
    state.saveMutation.mutate({ id: isCreate ? null : editing.id, input })
  }

  return (
    <FormSheet
      open={state.dialog.open}
      onClose={state.closeDialog}
      title={isCreate ? '新增演示' : '编辑演示'}
      description={"演示表（覆盖全部列类型与明细表）"}
      pending={pending}
      onSubmit={submit}
    >
      <FormField
        label={"编码"}
        htmlFor="demo-code"
        error={errors.code}
        required
      >
        <Input
          {...getFieldProps('code', "demo-code")}
          value={formState.code}
          onChange={(event) => setField({ code: event.target.value })}
        />
      </FormField>
      <FormField
        label={"描述"}
        htmlFor="demo-descText"
        error={errors.descText}
      >
        <Textarea
          {...getFieldProps('descText', "demo-descText")}
          rows={4}
          value={formState.descText}
          onChange={(event) => setField({ descText: event.target.value })}
        />
      </FormField>
      <FormField
        label={"数量"}
        htmlFor="demo-qty"
        error={errors.qty}
        required
      >
        <Input
          {...getFieldProps('qty', "demo-qty")}
          type="number"
          step="1"
          value={formState.qty}
          onChange={(event) => setField({ qty: event.target.value })}
        />
      </FormField>
      <FormField
        label={"金额"}
        htmlFor="demo-amount"
        error={errors.amount}
      >
        <Input
          {...getFieldProps('amount', "demo-amount")}
          type="number"
          step="0.01"
          value={formState.amount}
          onChange={(event) => setField({ amount: event.target.value })}
        />
      </FormField>
      <FormSwitchField
        label={"启用"}
        htmlFor="demo-enabled"
        checked={formState.enabled}
        onCheckedChange={(checked) => setField({ enabled: checked })}
      />
      <FormField
        label={"业务日期"}
        htmlFor="demo-bizDate"
        error={errors.bizDate}
      >
        <Input
          {...getFieldProps('bizDate', "demo-bizDate")}
          type="date"
          value={formState.bizDate}
          onChange={(event) => setField({ bizDate: event.target.value })}
        />
      </FormField>
      <FormField
        label={"创建时间"}
        htmlFor="demo-createdTime"
        error={errors.createdTime}
      >
        <Input
          {...getFieldProps('createdTime', "demo-createdTime")}
          type="datetime-local"
          value={formState.createdTime}
          onChange={(event) => setField({ createdTime: event.target.value })}
        />
      </FormField>
      <FormField
        label={"状态"}
        htmlFor="demo-status"
        error={errors.status}
        required
      >
        <Select
          value={formState.status}
          items={STATUS_OPTIONS}
          onValueChange={(value) => setField({ status: value ?? '' })}
        >
          <SelectTrigger id="demo-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField
        label={"扩展"}
        htmlFor="demo-extra"
        error={errors.extra}
      >
        <Textarea
          {...getFieldProps('extra', "demo-extra")}
          rows={4}
          value={formState.extra}
          onChange={(event) => setField({ extra: event.target.value })}
        />
      </FormField>
      <FormField
        label={"追踪号"}
        htmlFor="demo-traceId"
        error={errors.traceId}
      >
        <Input
          {...getFieldProps('traceId', "demo-traceId")}
          value={formState.traceId}
          onChange={(event) => setField({ traceId: event.target.value })}
        />
      </FormField>
    </FormSheet>
  )
}
