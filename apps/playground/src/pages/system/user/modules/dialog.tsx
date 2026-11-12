import { useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import { Input } from '@repo/ui/components/input'
import { TreeSelect } from '@repo/tree'
import {
  FormField,
  FormSheet,
  FormSwitchField,
} from '@/components/common/form-sheet'
import { useFormValidation } from '@/hooks/use-form-validation'
import { fetchDeptTree } from '@/api/system/dept'
import type { User, UserInput } from '@/api/system/user'
import {
  collectDisabledDeptIds,
  withDeptTreeSelectNodes,
} from '@/lib/dept-tree'
import { RoleMultiSelect } from './role-multiselect'
import { ROLE_OPTIONS } from './use-user'
import type { UserState } from './use-user'

/* ----------------------------- 新建 / 编辑用户 ----------------------------- */

interface FormState {
  username: string
  password: string
  nickname: string
  email: string
  phone: string
  /** 角色编码，可多选；至少保留一个 */
  roles: string[]
  deptId: string | null
  enabled: boolean
}

function withFormState(editing: User | null): FormState {
  return {
    username: editing?.username ?? '',
    password: '',
    nickname: editing?.nickname ?? '',
    email: editing?.email ?? '',
    phone: editing?.phone ?? '',
    roles: editing ? [...editing.roles] : [ROLE_OPTIONS[1]],
    deptId: editing?.deptId ?? null,
    enabled: editing?.enabled ?? true,
  }
}

/** 创建和重置密码共用相同的长度限制。 */
function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 64
}

/** 表单校验返回字段到错误文案的映射；编辑时账号不可修改。 */
function validate(
  form: FormState,
  isCreate: boolean,
): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  const username = form.username.trim()
  const email = form.email.trim()
  if (isCreate && (username.length < 3 || username.length > 32))
    errors.username = '请输入账号（3~32 位）'
  if (isCreate && !isValidPassword(form.password))
    errors.password = '请输入密码（6~64 位）'
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = '邮箱格式无效'
  if (form.roles.length === 0) errors.roles = '请至少选择一个角色'
  return errors
}

/**
 * 新建/编辑用户抽屉：创建需要密码且账号启用，编辑不可改账号与密码。
 * 界面文案直接使用中文，按钮复用 common 通用词条。
 */
export function UserDialog({ userMgr }: { userMgr: UserState }) {
  const editing = userMgr.dialog.editing
  const isCreate = editing === null
  // 表单初值由父组件的 key 重挂载保证（见 index.tsx），这里只在首次渲染取值
  const [formState, setForm] = useState<FormState>(() => withFormState(editing))

  // 与部门页共享缓存；停用部门节点保留展示但不可选（后端拒绝绑定）
  const deptQuery = useQuery({
    queryKey: ['dept'],
    queryFn: fetchDeptTree,
  })
  const deptNodes = useMemo(() => {
    const tree = deptQuery.data ?? []
    return withDeptTreeSelectNodes(tree, {
      disabledIds: collectDisabledDeptIds(tree),
    })
  }, [deptQuery.data])

  const { errors, validateBeforeSubmit, getFieldProps } = useFormValidation(
    formState,
    (values) => validate(values, isCreate),
  )

  const setField = (changes: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...changes }))

  const pendingState = userMgr.saveMutation.isPending
  // 下拉以角色表为准；角色接口尚未返回时回退到最小编码集合，避免编辑功能不可用
  const roleOptions =
    userMgr.roleOptions.length > 0
      ? userMgr.roleOptions.map((role) => ({
          code: role.roleCode,
          name: role.roleName,
        }))
      : ROLE_OPTIONS.map((code) => ({ code, name: code }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pendingState) return
    if (!validateBeforeSubmit()) return

    const input: UserInput = {
      username: formState.username.trim(),
      nickname: formState.nickname.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      roles: formState.roles,
      deptId: formState.deptId || undefined,
      enabled: formState.enabled,
    }
    if (isCreate) {
      input.password = formState.password
    }
    userMgr.saveMutation.mutate({ id: isCreate ? null : editing.id, input })
  }

  return (
    <FormSheet
      open={userMgr.dialog.open}
      onClose={userMgr.closeEdit}
      title={isCreate ? '新增' : '编辑'}
      description={'系统账号的增删改查，改动即时生效。'}
      pending={pendingState}
      onSubmit={submit}
    >
      <FormField
        label={'账号'}
        htmlFor="system-user-username"
        error={errors.username}
        required
      >
        <Input
          {...getFieldProps('username', 'system-user-username')}
          aria-required={isCreate}
          value={formState.username}
          disabled={!isCreate}
          autoFocus
          onChange={(e) => setField({ username: e.target.value })}
          autoComplete="off"
        />
      </FormField>
      {isCreate && (
        <FormField
          label={'密码'}
          htmlFor="system-user-password"
          hint={'仅创建时填写，6~64 位'}
          error={errors.password}
          required
        >
          <Input
            {...getFieldProps('password', 'system-user-password')}
            aria-required="true"
            type="password"
            value={formState.password}
            onChange={(e) => setField({ password: e.target.value })}
            autoComplete="new-password"
          />
        </FormField>
      )}
      <FormField label={'昵称'} htmlFor="system-user-nickname">
        <Input
          id="system-user-nickname"
          value={formState.nickname}
          onChange={(e) => setField({ nickname: e.target.value })}
        />
      </FormField>
      <FormField
        label={'角色'}
        htmlFor="system-user-role"
        error={errors.roles}
        required
      >
        <RoleMultiSelect
          id="system-user-role"
          invalid={Boolean(errors.roles)}
          describedBy={errors.roles ? 'system-user-role-error' : undefined}
          seedOptions={roleOptions}
          value={formState.roles}
          onChange={(roles) => setField({ roles })}
        />
      </FormField>
      <FormField label={'所属部门'} htmlFor="system-user-dept">
        <TreeSelect
          id="system-user-dept"
          ariaLabel={'所属部门'}
          treeData={deptNodes}
          value={formState.deptId}
          onChange={(deptId) =>
            setField({ deptId: (deptId as string | null) ?? null })
          }
          placeholder={'请选择'}
          nullLabel={'未绑定'}
          treeDefaultExpandAll
          treeLine={{ showLeafIcon: false }}
          showSearch
          searchPlaceholder={'请输入'}
        />
      </FormField>
      <FormField
        label={'邮箱'}
        htmlFor="system-user-email"
        error={errors.email}
      >
        <Input
          {...getFieldProps('email', 'system-user-email')}
          type="email"
          value={formState.email}
          onChange={(e) => setField({ email: e.target.value })}
        />
      </FormField>
      <FormField label={'手机号'} htmlFor="system-user-phone">
        <Input
          id="system-user-phone"
          value={formState.phone}
          onChange={(e) => setField({ phone: e.target.value })}
        />
      </FormField>
      {!isCreate && (
        <FormSwitchField
          label={'状态'}
          htmlFor="system-user-enabled"
          checked={formState.enabled}
          onCheckedChange={(enabled) => setField({ enabled })}
        />
      )}
    </FormSheet>
  )
}

/* 重置密码 */

/**
 * 重置密码对话框：为目标账号设置新密码，明文仅出现在请求体中，后端经哈希存储。
 */
export function ResetPasswordDialog({ userMgr }: { userMgr: UserState }) {
  const target = userMgr.reset
  const pendingState = userMgr.resetPasswordMutation.isPending

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) userMgr.closeReset()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{'重置密码'}</DialogTitle>
          <DialogDescription>
            {`为账号 ${target?.nickname ?? target?.username} 设置新密码，重置后旧密码立即失效。`}
          </DialogDescription>
        </DialogHeader>
        {/* key 放在表单而不是 DialogContent 上：关闭时 target 变为 null，
            key 若落在 Popup 上会在退场动画中重挂载 Base UI 实例，导致弹窗与
            inert 遮罩无法卸载；key 在表单上仍能在切换目标时清空密码。 */}
        <ResetPasswordForm
          key={target?.id ?? 'reset'}
          targetId={target?.id}
          pending={pendingState}
          onCancel={userMgr.closeReset}
          onSubmit={(id, password) =>
            userMgr.resetPasswordMutation.mutate({ id, password })
          }
        />
      </DialogContent>
    </Dialog>
  )
}

interface ResetPasswordFormProps {
  targetId?: string
  pending: boolean
  onCancel: () => void
  onSubmit: (id: string, password: string) => void
}

/** 重置密码表单：密码输入随目标切换重挂载清空 */
function ResetPasswordForm({
  targetId,
  pending,
  onCancel,
  onSubmit,
}: ResetPasswordFormProps) {
  const [passwordState, setPassword] = useState('')
  const [submittedState, setSubmitted] = useState(false)
  const passwordInvalid = submittedState && !isValidPassword(passwordState)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    setSubmitted(true)
    if (!isValidPassword(passwordState)) return
    if (!targetId) return
    onSubmit(targetId, passwordState)
  }

  return (
    <form noValidate className="flex flex-col gap-2" onSubmit={submit}>
      <FormField
        label={'新密码'}
        htmlFor="system-user-reset-password"
        required
        error={passwordInvalid ? '请输入密码（6~64 位）' : undefined}
        hint={'6-64 位，明文不会保存或回显'}
      >
        <Input
          id="system-user-reset-password"
          aria-required="true"
          aria-invalid={passwordInvalid}
          aria-describedby={
            passwordInvalid ? 'system-user-reset-password-error' : undefined
          }
          type="password"
          value={passwordState}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </FormField>
      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {'取消'}
        </Button>
        <Button type="submit" disabled={pending}>
          {'确认'}
        </Button>
      </DialogFooter>
    </form>
  )
}
