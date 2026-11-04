import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FormField,
  FormSheet,
  FormSwitchField,
} from '@/components/system/form-sheet'
import type { SystemRole, SystemRoleStatus } from '@/api/system/role'
import type { RolesSyncState } from './use-roles-sync'

/* ----------------------------- 新建 / 编辑角色 ----------------------------- */

interface FormState {
  roleCode: string
  roleName: string
  description: string
  status: SystemRoleStatus
}

function toFormState(editing: SystemRole | null): FormState {
  return {
    roleCode: editing?.roleCode ?? '',
    roleName: editing?.roleName ?? '',
    description: editing?.description ?? '',
    status: editing?.status ?? 'ENABLED',
  }
}

/**
 * 角色编码会作为接口路径的一段（/api/roles/{roleCode}），
 * 因此限制为 URL 安全字符；创建后不可修改。
 */
const ROLE_CODE_PATTERN = /^[A-Za-z0-9:_-]{2,64}$/

/** 表单校验：返回第一个错误词条 key（由调用方翻译），通过则返回 null */
function validate(form: FormState, isCreate: boolean): string | null {
  const roleCode = form.roleCode.trim()
  const roleName = form.roleName.trim()
  if (isCreate && !ROLE_CODE_PATTERN.test(roleCode)) {
    return 'system.role.error.code'
  }
  if (roleName.length === 0 || roleName.length > 128) {
    return 'system.role.error.name'
  }
  if (form.description.trim().length > 256) {
    return 'system.role.error.description'
  }
  return null
}

/**
 * 新建/编辑角色抽屉：编码仅创建时填写；编辑可改名称、描述与启用状态。
 * 新建角色后端固定为启用，因此状态开关只在编辑时出现。
 * 菜单授权在独立的「菜单授权」面板中维护（见 role-menus-dialog.tsx）。
 */
export function RoleDialog({ rolesSync }: { rolesSync: RolesSyncState }) {
  const { t } = useTranslation()
  const editing = rolesSync.dialogState.editing
  const isCreate = editing === null
  // 表单初值由父组件的 key 重挂载保证（见 index.tsx），这里只在首次渲染取值
  const [formState, setForm] = useState<FormState>(() => toFormState(editing))

  const setField = (changes: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...changes }))

  const pendingState = rolesSync.saveMutation.isPending

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pendingState) return
    const invalid = validate(formState, isCreate)
    if (invalid) {
      toast.error(t(invalid))
      return
    }

    const description = formState.description.trim() || undefined
    if (isCreate) {
      rolesSync.saveMutation.mutate({
        mode: 'create',
        input: {
          roleCode: formState.roleCode.trim(),
          roleName: formState.roleName.trim(),
          description,
        },
      })
      return
    }
    rolesSync.saveMutation.mutate({
      mode: 'update',
      roleCode: editing.roleCode,
      input: {
        roleName: formState.roleName.trim(),
        description,
        status: formState.status,
      },
    })
  }

  return (
    <FormSheet
      open={rolesSync.dialogState.open}
      onClose={rolesSync.closeDialog}
      title={t(isCreate ? 'common.create' : 'common.edit')}
      description={t('system.role.editHint')}
      pendingState={pendingState}
      onSubmit={submit}
      width="lg"
    >
      <FormField
        label={t('system.role.code')}
        htmlFor="system-role-code"
        hint={isCreate ? t('system.role.codeHint') : undefined}
      >
        <Input
          id="system-role-code"
          value={formState.roleCode}
          disabled={!isCreate}
          autoFocus={isCreate}
          autoComplete="off"
          onChange={(e) => setField({ roleCode: e.target.value })}
        />
      </FormField>
      <FormField label={t('system.role.name')} htmlFor="system-role-name">
        <Input
          id="system-role-name"
          value={formState.roleName}
          autoFocus={!isCreate}
          onChange={(e) => setField({ roleName: e.target.value })}
        />
      </FormField>
      <FormField
        label={t('common.description')}
        htmlFor="system-role-description"
      >
        <Textarea
          id="system-role-description"
          value={formState.description}
          rows={3}
          onChange={(e) => setField({ description: e.target.value })}
        />
      </FormField>
      {!isCreate && (
        <FormSwitchField
          label={t('common.status')}
          htmlFor="system-role-status"
          checked={formState.status === 'ENABLED'}
          onCheckedChange={(enabled) =>
            setField({ status: enabled ? 'ENABLED' : 'DISABLED' })
          }
        />
      )}
    </FormSheet>
  )
}
