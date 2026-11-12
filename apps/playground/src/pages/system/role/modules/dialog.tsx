import { useState, type FormEvent } from 'react'
import { Input } from '@repo/ui/components/input'
import { Textarea } from '@repo/ui/components/textarea'
import {
  FormField,
  FormSheet,
  FormSwitchField,
} from '@/components/common/form-sheet'
import { useFormValidation } from '@/hooks/use-form-validation'
import type { Role, RoleStatus } from '@/api/system/role'
import type { RoleState } from './use-role'

/* ----------------------------- 新建 / 编辑角色 ----------------------------- */

interface FormState {
  roleCode: string
  roleName: string
  description: string
  status: RoleStatus
}

function withFormState(editing: Role | null): FormState {
  return {
    roleCode: editing?.roleCode ?? '',
    roleName: editing?.roleName ?? '',
    description: editing?.description ?? '',
    status: editing?.status ?? 'ENABLED',
  }
}

/**
 * 角色编码是唯一业务键，限制为 URL 安全字符；创建后不可修改。
 * 接口路径以代理 id 标识角色。
 */
const ROLE_CODE_PATTERN = /^[A-Za-z0-9:_-]{2,64}$/

/** 角色表单按字段返回全部错误文案。 */
function validate(
  form: FormState,
  isCreate: boolean,
): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  const roleCode = form.roleCode.trim()
  const roleName = form.roleName.trim()
  if (isCreate && !ROLE_CODE_PATTERN.test(roleCode))
    errors.roleCode = '请输入角色编码（2~64 位字母、数字、_:-）'
  if (roleName.length === 0 || roleName.length > 128)
    errors.roleName = '请输入角色名称（1~128 位）'
  if (form.description.trim().length > 256)
    errors.description = '描述不能超过 256 位'
  return errors
}

/**
 * 新建/编辑角色抽屉：编码仅创建时填写；编辑可改名称、描述与启用状态。
 * 新建角色后端固定为启用，因此状态开关只在编辑时出现。
 * 菜单授权在独立的「菜单授权」面板中维护（见 assign-permissions.tsx）。
 */
export function RoleDialog({ roleMgr }: { roleMgr: RoleState }) {
  const editing = roleMgr.dialog.editing
  const isCreate = editing === null
  // 表单初值由父组件的 key 重挂载保证（见 index.tsx），这里只在首次渲染取值
  const [formState, setForm] = useState<FormState>(() => withFormState(editing))

  const { errors, validateBeforeSubmit, getFieldProps } = useFormValidation(
    formState,
    (values) => validate(values, isCreate),
  )

  const setField = (changes: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...changes }))

  const pendingState = roleMgr.saveMutation.isPending

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pendingState) return
    if (!validateBeforeSubmit()) return

    const description = formState.description.trim() || undefined
    if (isCreate) {
      roleMgr.saveMutation.mutate({
        mode: 'create',
        input: {
          roleCode: formState.roleCode.trim(),
          roleName: formState.roleName.trim(),
          description,
        },
      })
      return
    }
    roleMgr.saveMutation.mutate({
      mode: 'update',
      roleId: editing.id,
      input: {
        roleName: formState.roleName.trim(),
        description,
        status: formState.status,
      },
    })
  }

  return (
    <FormSheet
      open={roleMgr.dialog.open}
      onClose={roleMgr.closeEdit}
      title={isCreate ? '新增' : '编辑'}
      description={'角色编码创建后不可修改，状态变更即时生效。'}
      pending={pendingState}
      onSubmit={submit}
      width="lg"
    >
      <FormField
        label={'角色编码'}
        htmlFor="system-role-code"
        hint={isCreate ? '2~64 位字母、数字、下划线、冒号或短横线' : undefined}
        error={errors.roleCode}
        required
      >
        <Input
          {...getFieldProps('roleCode', 'system-role-code')}
          aria-required={isCreate}
          value={formState.roleCode}
          disabled={!isCreate}
          autoFocus={isCreate}
          autoComplete="off"
          onChange={(e) => setField({ roleCode: e.target.value })}
        />
      </FormField>
      <FormField
        label={'角色名称'}
        htmlFor="system-role-name"
        error={errors.roleName}
        required
      >
        <Input
          {...getFieldProps('roleName', 'system-role-name')}
          aria-required="true"
          value={formState.roleName}
          autoFocus={!isCreate}
          onChange={(e) => setField({ roleName: e.target.value })}
        />
      </FormField>
      <FormField
        label={'描述'}
        htmlFor="system-role-description"
        error={errors.description}
      >
        <Textarea
          {...getFieldProps('description', 'system-role-description')}
          value={formState.description}
          rows={3}
          onChange={(e) => setField({ description: e.target.value })}
        />
      </FormField>
      {!isCreate && (
        <FormSwitchField
          label={'状态'}
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
