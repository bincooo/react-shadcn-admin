import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { TreeSelect } from '@/components/ui/tree-select'
import {
  FormField,
  FormSheet,
  FormSwitchField,
} from '@/components/system/form-sheet'
import type { SystemDeptStatus, SystemDeptTreeNode } from '@/api/system/dept'
import { toDeptTreeSelectNodes } from '@/lib/dept-tree'
import type { DeptsSyncState } from './use-depts-sync'

/* ----------------------------- 新建 / 编辑部门 ----------------------------- */

interface FormState {
  /** 上级部门 id；空串表示根部门，提交时映射为 null */
  parentId: string
  deptCode: string
  deptName: string
  /** 保留输入框原始字符串，提交时再解析为数字 */
  sort: string
  status: SystemDeptStatus
  description: string
}

function toFormState(editing: SystemDeptTreeNode | null): FormState {
  return {
    parentId: editing?.parentId ?? '',
    deptCode: editing?.deptCode ?? '',
    deptName: editing?.deptName ?? '',
    sort: String(editing?.sort ?? 0),
    status: editing?.status ?? 'ENABLED',
    description: editing?.description ?? '',
  }
}

/** 表单校验：返回第一个错误词条 key（由调用方翻译），通过则返回 null */
function validate(form: FormState, isCreate: boolean): string | null {
  if (isCreate && form.deptCode.trim().length === 0) {
    return 'system.dept.error.code'
  }
  if (form.deptName.trim().length === 0) {
    return 'system.dept.error.name'
  }
  const sort = Number(form.sort)
  if (!Number.isInteger(sort) || sort < 0) {
    return 'system.dept.error.sort'
  }
  return null
}

/**
 * 新建/编辑部门抽屉：编码仅创建时填写；编辑可改上级、名称、排序、描述与状态。
 * 上级候选为可展开/收起的部门树，编辑时排除自身及后代（helper 按自身 id 整棵剪枝）。
 */
export function DeptDialog({ deptsSync }: { deptsSync: DeptsSyncState }) {
  const { t } = useTranslation()
  const editing = deptsSync.dialogState.editing
  const isCreate = editing === null
  // 表单初值由父组件的 key 重挂载保证（见 index.tsx），这里只在首次渲染取值
  const [formState, setForm] = useState<FormState>(() => toFormState(editing))

  const setField = (changes: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...changes }))

  const pendingState =
    deptsSync.createMutation.isPending || deptsSync.updateMutation.isPending

  // 编辑时传入自身 id：helper 会连同整棵子树一起剪掉
  const parentNodes = useMemo(
    () =>
      toDeptTreeSelectNodes(deptsSync.deptsTreeState, {
        excludeIds: editing ? new Set([editing.id]) : undefined,
      }),
    [deptsSync.deptsTreeState, editing],
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pendingState) return
    const invalid = validate(formState, isCreate)
    if (invalid) {
      toast.error(t(invalid))
      return
    }

    const payload = {
      parentId: formState.parentId || null,
      deptName: formState.deptName.trim(),
      sort: Number(formState.sort),
      description: formState.description.trim() || undefined,
    }

    if (isCreate) {
      deptsSync.createMutation.mutate({
        ...payload,
        deptCode: formState.deptCode.trim(),
      })
      return
    }
    deptsSync.updateMutation.mutate({
      id: editing.id,
      input: { ...payload, status: formState.status },
    })
  }

  return (
    <FormSheet
      open={deptsSync.dialogState.open}
      onClose={deptsSync.closeDialog}
      title={t(isCreate ? 'common.create' : 'common.edit')}
      description={t('system.dept.editHint')}
      pendingState={pendingState}
      onSubmit={submit}
    >
      <FormField
        label={t('system.field.parentDept')}
        htmlFor="system-dept-parent"
      >
        <TreeSelect
          id="system-dept-parent"
          ariaLabel={t('system.field.parentDept')}
          nodes={parentNodes}
          value={formState.parentId || null}
          onChange={(parentId) => setField({ parentId: parentId ?? '' })}
          nullLabel={t('system.dept.rootOption')}
        />
      </FormField>
      <FormField label={t('system.field.deptCode')} htmlFor="system-dept-code">
        <Input
          id="system-dept-code"
          value={formState.deptCode}
          disabled={!isCreate}
          autoFocus={isCreate}
          autoComplete="off"
          onChange={(e) => setField({ deptCode: e.target.value })}
        />
      </FormField>
      <FormField label={t('system.field.deptName')} htmlFor="system-dept-name">
        <Input
          id="system-dept-name"
          value={formState.deptName}
          autoFocus={!isCreate}
          onChange={(e) => setField({ deptName: e.target.value })}
        />
      </FormField>
      <FormField label={t('system.field.sort')} htmlFor="system-dept-sort">
        <Input
          id="system-dept-sort"
          type="number"
          min={0}
          value={formState.sort}
          onChange={(e) => setField({ sort: e.target.value })}
        />
      </FormField>
      {!isCreate && (
        <FormSwitchField
          label={t('common.status')}
          htmlFor="system-dept-status"
          checked={formState.status === 'ENABLED'}
          onCheckedChange={(enabled) =>
            setField({ status: enabled ? 'ENABLED' : 'DISABLED' })
          }
        />
      )}
      <FormField
        label={t('common.description')}
        htmlFor="system-dept-description"
      >
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
