import { useMemo, useState, type FormEvent } from 'react'
import { Input } from '@repo/ui/components/input'
import { TreeSelect } from '@repo/tree'
import {
  FormField,
  FormSheet,
  FormSwitchField,
} from '@/components/common/form-sheet'
import { useFormValidation } from '@/hooks/use-form-validation'
import type { DeptStatus, DeptTreeNode } from '@/api/system/dept'
import { withDeptTreeSelectNodes } from '@/lib/dept-tree'
import type { DeptState } from './use-dept'

/* ----------------------------- 新建 / 编辑部门 ----------------------------- */

interface FormState {
  /** 上级部门 id；空串表示根部门，提交时映射为 null */
  parentId: string
  deptCode: string
  deptName: string
  /** 保留输入框原始字符串，提交时再解析为数字 */
  sort: string
  status: DeptStatus
  description: string
}

function withFormState(editing: DeptTreeNode | null): FormState {
  return {
    parentId: editing?.parentId ?? '',
    deptCode: editing?.deptCode ?? '',
    deptName: editing?.deptName ?? '',
    sort: String(editing?.sort ?? 0),
    status: editing?.status ?? 'ENABLED',
    description: editing?.description ?? '',
  }
}

/** 校验部门编码、名称及非负整数排序。 */
function validate(
  form: FormState,
  isCreate: boolean,
): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (isCreate && !form.deptCode.trim()) errors.deptCode = '请输入部门编码'
  if (!form.deptName.trim()) errors.deptName = '请输入部门名称'
  if (!/^\d+$/.test(form.sort) || !Number.isSafeInteger(Number(form.sort)))
    errors.sort = '排序需为可安全表示的非负整数'
  return errors
}

/**
 * 新建/编辑部门抽屉：编码仅创建时填写；编辑可改上级、名称、排序、描述与状态。
 * 上级候选为可展开/收起的部门树，编辑时排除自身及后代（helper 按自身 id 整棵剪枝）。
 */
export function DeptDialog({ deptMgr }: { deptMgr: DeptState }) {
  const editing = deptMgr.dialog.editing
  const isCreate = editing === null
  // 表单初值由父组件的 key 重挂载保证（见 index.tsx），这里只在首次渲染取值
  const [formState, setForm] = useState<FormState>(() => withFormState(editing))

  const { errors, validateBeforeSubmit, getFieldProps } = useFormValidation(
    formState,
    (values) => validate(values, isCreate),
  )

  const setField = (changes: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...changes }))

  const pendingState =
    deptMgr.createMutation.isPending || deptMgr.updateMutation.isPending

  // 编辑时传入自身 id：helper 会连同整棵子树一起剪掉
  const parentNodes = useMemo(
    () =>
      withDeptTreeSelectNodes(deptMgr.deptTree, {
        excludeIds: editing ? new Set([editing.id]) : undefined,
      }),
    [deptMgr.deptTree, editing],
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pendingState) return
    if (!validateBeforeSubmit()) return

    const payload = {
      parentId: formState.parentId || undefined,
      deptName: formState.deptName.trim(),
      sort: Number(formState.sort),
      description: formState.description.trim() || undefined,
    }

    if (isCreate) {
      deptMgr.createMutation.mutate({
        ...payload,
        deptCode: formState.deptCode.trim(),
      })
      return
    }
    deptMgr.updateMutation.mutate({
      id: editing.id,
      input: { ...payload, status: formState.status },
    })
  }

  return (
    <FormSheet
      open={deptMgr.dialog.open}
      onClose={deptMgr.closeEdit}
      title={isCreate ? '新增' : '编辑'}
      description={'部门编码创建后不可修改，状态变更即时生效。'}
      pending={pendingState}
      onSubmit={submit}
    >
      <FormField label={'上级部门'} htmlFor="system-dept-parent">
        <TreeSelect
          id="system-dept-parent"
          ariaLabel={'上级部门'}
          treeData={parentNodes}
          value={formState.parentId || null}
          onChange={(parentId) =>
            setField({ parentId: parentId ? String(parentId) : '' })
          }
          placeholder={'请选择'}
          nullLabel={'无（根部门）'}
          treeDefaultExpandAll
          treeLine={{ showLeafIcon: false }}
          showSearch
          searchPlaceholder={'请输入'}
        />
      </FormField>
      <FormField
        label={'部门编码'}
        htmlFor="system-dept-code"
        error={errors.deptCode}
        required
      >
        <Input
          {...getFieldProps('deptCode', 'system-dept-code')}
          aria-required={isCreate}
          value={formState.deptCode}
          disabled={!isCreate}
          autoFocus={isCreate}
          autoComplete="off"
          onChange={(e) => setField({ deptCode: e.target.value })}
        />
      </FormField>
      <FormField
        label={'部门名称'}
        htmlFor="system-dept-name"
        error={errors.deptName}
        required
      >
        <Input
          {...getFieldProps('deptName', 'system-dept-name')}
          aria-required="true"
          value={formState.deptName}
          autoFocus={!isCreate}
          onChange={(e) => setField({ deptName: e.target.value })}
        />
      </FormField>
      <FormField
        label={'排序'}
        htmlFor="system-dept-sort"
        error={errors.sort}
        required
      >
        <Input
          {...getFieldProps('sort', 'system-dept-sort')}
          aria-required="true"
          type="number"
          min={0}
          value={formState.sort}
          onChange={(e) => setField({ sort: e.target.value })}
        />
      </FormField>
      {!isCreate && (
        <FormSwitchField
          label={'状态'}
          htmlFor="system-dept-status"
          checked={formState.status === 'ENABLED'}
          onCheckedChange={(enabled) =>
            setField({ status: enabled ? 'ENABLED' : 'DISABLED' })
          }
        />
      )}
      <FormField label={'描述'} htmlFor="system-dept-description">
        <Input
          id="system-dept-description"
          value={formState.description}
          onChange={(e) => setField({ description: e.target.value })}
        />
      </FormField>
    </FormSheet>
  )
}

/* ------------------------------- 删除确认 ------------------------------- */

/** 删除目标：确认框需要部门名称生成文案 */
export interface DeptDeleteTarget {
  id: string
  deptName: string
}
