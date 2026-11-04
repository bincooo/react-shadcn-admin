import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TreeSelect } from '@/components/ui/tree-select'
import {
  FormField,
  FormSheet,
  FormSwitchField,
} from '@/components/system/form-sheet'
import { fetchSystemDeptTree } from '@/api/system/dept'
import type { SystemUser, SystemUserInput } from '@/api/system/user'
import { collectDisabledDeptIds, toDeptTreeSelectNodes } from '@/lib/dept-tree'
import { ROLE_LABEL_KEYS, ROLE_OPTIONS } from './use-users-sync'
import type { UsersSyncState } from './use-users-sync'

/* ----------------------------- 新建 / 编辑用户 ----------------------------- */

interface FormState {
  username: string
  password: string
  nickname: string
  email: string
  phone: string
  role: string
  deptId: string | null
  enabled: boolean
}

function toFormState(editing: SystemUser | null): FormState {
  return {
    username: editing?.username ?? '',
    password: '',
    nickname: editing?.nickname ?? '',
    email: editing?.email ?? '',
    phone: editing?.phone ?? '',
    role: editing?.roles[0] ?? ROLE_OPTIONS[1],
    deptId: editing?.deptId ?? null,
    enabled: editing?.enabled ?? true,
  }
}

/** 表单校验：返回第一个错误词条 key（由调用方翻译），通过则返回 null */
function validate(form: FormState, isCreate: boolean): string | null {
  const username = form.username.trim()
  if (username.length < 3 || username.length > 32) {
    return 'system.user.error.username'
  }
  if (isCreate && form.password.length < 6) {
    return 'system.user.error.password'
  }
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
    return 'system.user.error.email'
  }
  return null
}

/**
 * 新建/编辑用户抽屉：创建需要密码且账号启用，编辑不可改账号与密码。
 * 界面文案直接使用中文，按钮复用 common 通用词条。
 */
export function UserDialog({ usersSync }: { usersSync: UsersSyncState }) {
  const { t } = useTranslation()
  const editing = usersSync.dialogState.editing
  const isCreate = editing === null
  // 表单初值由父组件的 key 重挂载保证（见 index.tsx），这里只在首次渲染取值
  const [formState, setForm] = useState<FormState>(() => toFormState(editing))

  // 与部门页共享缓存；停用部门节点保留展示但不可选（后端拒绝绑定）
  const deptQuery = useQuery({
    queryKey: ['system-depts'],
    queryFn: fetchSystemDeptTree,
  })
  const deptNodes = useMemo(() => {
    const tree = deptQuery.data ?? []
    return toDeptTreeSelectNodes(tree, {
      disabledIds: collectDisabledDeptIds(tree),
    })
  }, [deptQuery.data])

  const setField = (changes: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...changes }))

  const pendingState = usersSync.saveMutation.isPending

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pendingState) return
    const invalid = validate(formState, isCreate)
    if (invalid) {
      toast.error(t(invalid))
      return
    }

    const input: SystemUserInput = {
      username: formState.username.trim(),
      nickname: formState.nickname.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      roles: [formState.role],
      deptId: formState.deptId || null,
      enabled: formState.enabled,
    }
    if (isCreate) {
      input.password = formState.password
    }
    usersSync.saveMutation.mutate({ id: isCreate ? null : editing.id, input })
  }

  return (
    <FormSheet
      open={usersSync.dialogState.open}
      onClose={usersSync.closeDialog}
      title={t(isCreate ? 'common.create' : 'common.edit')}
      description={t('system.user.description')}
      pendingState={pendingState}
      onSubmit={submit}
    >
      <FormField
        label={t('system.user.keyword')}
        htmlFor="system-user-username"
      >
        <Input
          id="system-user-username"
          value={formState.username}
          disabled={!isCreate}
          autoFocus
          onChange={(e) => setField({ username: e.target.value })}
          autoComplete="off"
        />
      </FormField>
      {isCreate && (
        <FormField
          label={t('system.field.password')}
          htmlFor="system-user-password"
          hint={t('system.user.passwordHint')}
        >
          <Input
            id="system-user-password"
            type="password"
            value={formState.password}
            onChange={(e) => setField({ password: e.target.value })}
            autoComplete="new-password"
          />
        </FormField>
      )}
      <FormField
        label={t('system.field.nickname')}
        htmlFor="system-user-nickname"
      >
        <Input
          id="system-user-nickname"
          value={formState.nickname}
          onChange={(e) => setField({ nickname: e.target.value })}
        />
      </FormField>
      <FormField label={t('system.user.roles')} htmlFor="system-user-role">
        <Select
          value={formState.role}
          onValueChange={(role) => setField({ role })}
        >
          <SelectTrigger id="system-user-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABEL_KEYS[role] ? t(ROLE_LABEL_KEYS[role]) : role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('system.field.dept')} htmlFor="system-user-dept">
        <TreeSelect
          id="system-user-dept"
          ariaLabel={t('system.field.dept')}
          nodes={deptNodes}
          value={formState.deptId}
          onChange={(deptId) => setField({ deptId })}
          nullLabel={t('system.user.unboundDept')}
        />
      </FormField>
      <FormField label={t('system.user.email')} htmlFor="system-user-email">
        <Input
          id="system-user-email"
          type="email"
          value={formState.email}
          onChange={(e) => setField({ email: e.target.value })}
        />
      </FormField>
      <FormField label={t('system.user.phone')} htmlFor="system-user-phone">
        <Input
          id="system-user-phone"
          value={formState.phone}
          onChange={(e) => setField({ phone: e.target.value })}
        />
      </FormField>
      {!isCreate && (
        <FormSwitchField
          label={t('common.status')}
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
export function ResetPasswordDialog({
  usersSync,
}: {
  usersSync: UsersSyncState
}) {
  const { t } = useTranslation()
  const target = usersSync.resetState
  const pendingState = usersSync.resetPasswordMutation.isPending
  const [passwordState, setPassword] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pendingState) return
    if (passwordState.length < 6) {
      toast.error(t('system.user.error.password'))
      return
    }
    if (!target) return
    usersSync.resetPasswordMutation.mutate(
      { id: target.id, password: passwordState },
      // 提交结束后清空输入；重新打开时的清空由 DialogContent 的 key 重挂载完成
      { onSettled: () => setPassword('') },
    )
  }

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) usersSync.closeReset()
      }}
    >
      <DialogContent
        className="sm:max-w-sm"
        // 重挂载清空上一次的密码输入
        key={target?.id ?? 'reset'}
      >
        <DialogHeader>
          <DialogTitle>{t('system.user.resetPasswordTitle')}</DialogTitle>
          <DialogDescription>
            {t('system.user.resetPasswordDesc', {
              name: target?.nickname ?? target?.username,
            })}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-2" onSubmit={submit}>
          <FormField
            label={t('system.field.newPassword')}
            htmlFor="system-user-reset-password"
            hint={t('system.user.newPasswordHint')}
          >
            <Input
              id="system-user-reset-password"
              type="password"
              value={passwordState}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </FormField>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={usersSync.closeReset}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={pendingState}>
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
