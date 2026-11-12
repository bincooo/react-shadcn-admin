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
} from '@/components/common/form-sheet'
import { useFormValidation } from '@/hooks/use-form-validation'
import type { Order, OrderInput } from '../types'
import type { OrderState } from './use-order'

const STATUS_OPTIONS = [
  { value: 'NEW', label: '新建' },
  { value: 'PAID', label: '已支付' },
  { value: 'SHIPPED', label: '已发货' },
]
interface FormState {
  orderNo: string
  customerName: string
  amount: string
  status: string
  remark: string
}

function withFormState(editing: Order | null): FormState {
  return {
    orderNo: editing ? String(editing.orderNo ?? '') : '',
    customerName: editing ? String(editing.customerName ?? '') : '',
    amount: editing ? String(editing.amount ?? '') : '0.00',
    status: editing ? String(editing.status ?? '') : 'NEW',
    remark: editing ? String(editing.remark ?? '') : '',
  }
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!form.orderNo.trim()) errors.orderNo = '订单号不能为空'
  if (form.orderNo.trim().length > 32) errors.orderNo = '订单号长度不能超过 32'
  if (!form.customerName.trim()) errors.customerName = '客户名称不能为空'
  if (form.customerName.trim().length > 64) errors.customerName = '客户名称长度不能超过 64'
  if (!form.amount.trim()) errors.amount = '金额不能为空'
  if (form.amount.trim() && !Number.isFinite(Number(form.amount))) errors.amount = '请输入数字'
  if (!form.status) errors.status = '状态不能为空'
  if (form.status && !['NEW', 'PAID', 'SHIPPED'].includes(form.status)) errors.status = '请选择有效值'
  return errors
}

/** 新建 / 编辑订单表单。 */
export function OrderDialog({ state }: { state: OrderState }) {
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
    const input: OrderInput = {
      orderNo: formState.orderNo.trim(),
      customerName: formState.customerName.trim(),
      amount: Number(formState.amount),
      status: formState.status as OrderInput['status'],
      remark: formState.remark.trim() || undefined,
    }
    state.saveMutation.mutate({ id: isCreate ? null : editing.id, input })
  }

  return (
    <FormSheet
      open={state.dialog.open}
      onClose={state.closeDialog}
      title={isCreate ? '新增订单' : '编辑订单'}
      description={"订单主表"}
      pending={pending}
      onSubmit={submit}
    >
      <FormField
        label={"订单号"}
        htmlFor="order-orderNo"
        error={errors.orderNo}
        required
      >
        <Input
          {...getFieldProps('orderNo', "order-orderNo")}
          value={formState.orderNo}
          onChange={(event) => setField({ orderNo: event.target.value })}
        />
      </FormField>
      <FormField
        label={"客户名称"}
        htmlFor="order-customerName"
        error={errors.customerName}
        required
      >
        <Input
          {...getFieldProps('customerName', "order-customerName")}
          value={formState.customerName}
          onChange={(event) => setField({ customerName: event.target.value })}
        />
      </FormField>
      <FormField
        label={"金额"}
        htmlFor="order-amount"
        error={errors.amount}
        required
      >
        <Input
          {...getFieldProps('amount', "order-amount")}
          type="number"
          step="0.01"
          value={formState.amount}
          onChange={(event) => setField({ amount: event.target.value })}
        />
      </FormField>
      <FormField
        label={"状态"}
        htmlFor="order-status"
        error={errors.status}
        required
      >
        <Select
          value={formState.status}
          items={STATUS_OPTIONS}
          onValueChange={(value) => setField({ status: value ?? '' })}
        >
          <SelectTrigger id="order-status" className="w-full">
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
        label={"备注"}
        htmlFor="order-remark"
        error={errors.remark}
      >
        <Textarea
          {...getFieldProps('remark', "order-remark")}
          rows={4}
          value={formState.remark}
          onChange={(event) => setField({ remark: event.target.value })}
        />
      </FormField>
    </FormSheet>
  )
}
