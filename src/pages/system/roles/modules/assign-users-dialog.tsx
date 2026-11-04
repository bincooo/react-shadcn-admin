import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NameAvatar } from '@/components/common/user-avatar'
import { Pagination } from '@/components/common/pagination'
import type { SystemRole } from '@/api/system/role'
import { useRoleUsersSync } from './use-role-users-sync'
import type { RolesSyncState } from './use-roles-sync'

/**
 * 分配用户弹窗：用户列表走 `/api/users` 服务端筛选与分页，
 * 已分配用户预勾选，保存时按当前勾选全量替换。
 * 内容组件按角色编码重挂载，保证切换目标时勾选集合重新初始化。
 */
export function AssignUsersDialog({
  role,
  rolesSync,
}: {
  role: SystemRole | null
  rolesSync: RolesSyncState
}) {
  return (
    <Dialog
      open={role !== null}
      onOpenChange={(open) => {
        if (!open) rolesSync.closeAssign()
      }}
    >
      {role && (
        <AssignUsersDialogContent
          key={role.roleCode}
          role={role}
          onClose={rolesSync.closeAssign}
        />
      )}
    </Dialog>
  )
}

function AssignUsersDialogContent({
  role,
  onClose,
}: {
  role: SystemRole
  onClose: () => void
}) {
  const { t } = useTranslation()
  const usersSync = useRoleUsersSync(role)
  const pendingState = usersSync.saveMutation.isPending

  const save = () => {
    if (pendingState) return
    usersSync.saveMutation.mutate([...usersSync.selectedState], {
      onSuccess: onClose,
    })
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{t('menu.roleAssignUser')}</DialogTitle>
        <DialogDescription>
          为角色「{role.roleName}」选择用户，保存后按当前勾选全量替换。
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            usersSync.submitSearch()
          }}
        >
          <Input
            value={usersSync.keywordState}
            placeholder={t('system.role.searchPlaceholder')}
            aria-label={t('system.role.searchUsers')}
            onChange={(e) => usersSync.setKeyword(e.target.value)}
          />
          <Button type="submit" variant="outline">
            {t('common.search')}
          </Button>
          <Button type="button" variant="ghost" onClick={usersSync.resetSearch}>
            {t('common.reset')}
          </Button>
        </form>

        <div className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span>已选 {usersSync.selectedCount} 人</span>
          <span>
            {usersSync.assignedLoadingState
              ? t('system.role.assignedLoading')
              : t('system.role.userCount', { count: usersSync.total })}
          </span>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-md border">
          {usersSync.users.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-muted-foreground">
              {t('common.empty')}
            </p>
          ) : (
            usersSync.users.map((user) => {
              const checkboxId = `role-user-${user.id}`
              return (
                <label
                  key={user.id}
                  htmlFor={checkboxId}
                  className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/40"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={usersSync.selectedState.has(user.id)}
                    onCheckedChange={(checked) =>
                      usersSync.toggleUser(user.id, checked === true)
                    }
                  />
                  <NameAvatar
                    name={user.nickname ?? user.username}
                    src={user.avatar ?? undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {user.nickname ?? user.username}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      @{user.username}
                      {user.enabled ? '' : t('system.role.userDisabled')}
                    </p>
                  </div>
                </label>
              )
            })
          )}
        </div>

        <Pagination
          page={usersSync.pageState}
          totalPages={usersSync.totalPages}
          onPageChange={usersSync.setPage}
          className="border-0 px-0 py-0"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={save} disabled={pendingState}>
          {t('common.save')}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
