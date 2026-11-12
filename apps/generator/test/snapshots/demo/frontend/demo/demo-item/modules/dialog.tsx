import { useState, type FormEvent } from 'react'
import { Input } from '@repo/ui/components/input'
import {
  FormField,
  FormSheet,
} from '@/components/common/form-sheet'
import { useFormValidation } from '@/hooks/use-form-validation'
import type { DemoItem, DemoItemInput } from '../types'
import type { DemoItemState } from './use-demo-item'

interface FormState {
  demoId: string
  itemName: string
}

function withFormState(editing: DemoItem | null): FormState {
  return {
    demoId: editing ? String(editing.demoId ?? '') : '',
    itemName: editing ? String(editing.itemName ?? '') : '',
  }
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!form.demoId.trim()) errors.demoId = '主表ID不能为空'
  if (form.demoId.trim() && !Number.isFinite(Number(form.demoId))) errors.demoId = '请输入数字'
  if (!form.itemName.trim()) errors.itemName = '名称不能为空'
  if (form.itemName.trim().length > 64) errors.itemName = '名称长度不能超过 64'
  return errors
}

/** 新建 / 编辑演示明细表单。 */
export function DemoItemDialog({ state }: { state: DemoItemState }) {
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
    const input: DemoItemInput = {
      demoId: Number(formState.demoId),
      itemName: formState.itemName.trim(),
    }
    state.saveMutation.mutate({ id: isCreate ? null : editing.id, input })
  }

  return (
    <FormSheet
      open={state.dialog.open}
      onClose={state.closeDialog}
      title={isCreate ? '新增演示明细' : '编辑演示明细'}
      description={"演示明细表"}
      pending={pending}
      onSubmit={submit}
    >
      <FormField
        label={"主表ID"}
        htmlFor="demo-item-demoId"
        error={errors.demoId}
        required
      >
        <Input
          {...getFieldProps('demoId', "demo-item-demoId")}
          type="number"
          step="1"
          value={formState.demoId}
          onChange={(event) => setField({ demoId: event.target.value })}
        />
      </FormField>
      <FormField
        label={"名称"}
        htmlFor="demo-item-itemName"
        error={errors.itemName}
        required
      >
        <Input
          {...getFieldProps('itemName', "demo-item-itemName")}
          value={formState.itemName}
          onChange={(event) => setField({ itemName: event.target.value })}
        />
      </FormField>
    </FormSheet>
  )
}
