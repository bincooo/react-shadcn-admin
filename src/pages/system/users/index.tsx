import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader } from '@/components/common/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field } from '@/components/core/form/field'
import { ConfirmDeleteDialog } from '@/components/system/confirm-delete-dialog'
import { ListPageActions } from '@/components/system/list-page-actions'
import { FilterBar } from '@/components/system/filter-bar'
import { ResetPasswordDialog, UserDialog } from './modules/user-dialogs'
import type { DeleteTarget } from './modules/user-delete-target'
import { describeDeleteTarget } from './modules/user-delete-target'
import { UserDetailDrawer } from './modules/user-detail-drawer'
import { UsersTable } from './modules/users-table'
import { useUsersSync } from './modules/use-users-sync'
import type { StatusFilter } from './modules/use-users-sync'

const STATUS_FILTERS: StatusFilter[] = ['all', 'enabled', 'disabled']

/** 状态筛选值 → i18n 词条 */
const STATUS_LABEL_KEYS: Record<StatusFilter, string> = {
  all: 'common.allStatus',
  enabled: 'common.enabled',
  disabled: 'common.disabled',
}

/**
 * 系统管理 → 用户管理：账号的分页列表与新建/编辑/删除。
 *
 * 数据来自真实后端 `/api/users`（仅管理员可用）；状态与变更逻辑
 * 收在 `modules/use-users-sync`，本组件只做布局组合。
 */
export default function SystemUsersPage() {
  const { t } = useTranslation()
  const usersSync = useUsersSync()
  const [deletingState, setDeleting] = useState<DeleteTarget | null>(null)
  const [collapsedState, setCollapsed] = useState(true)
  const closeDelete = () => setDeleting(null)

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeader
        title={t('menu.user')}
        description={t('system.user.description')}
        actions={
          <ListPageActions
            createPermission="system:user:create"
            onRefresh={usersSync.refresh}
            onCreate={usersSync.openCreate}
          />
        }
      />
      <FilterBar
        onReset={usersSync.resetFilters}
        onSearch={usersSync.submitSearch}
        extra={
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsedState ? (
              <>
                {t('common.expand')}
                <ChevronDown data-icon="inline-end" />
              </>
            ) : (
              <>
                {t('common.collapse')}
                <ChevronUp data-icon="inline-end" />
              </>
            )}
          </Button>
        }
      >
        <Field label={t('system.user.keyword')} htmlFor="system-user-keyword">
          <Input
            id="system-user-keyword"
            className="w-full"
            placeholder={t('common.pleaseInput')}
            value={usersSync.keywordState}
            onChange={(e) => usersSync.setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && usersSync.submitSearch()}
          />
        </Field>
        {!collapsedState && (
          <>
            <Field label={t('system.user.phone')} htmlFor="system-user-phone">
              <Input
                id="system-user-phone"
                className="w-full"
                placeholder={t('common.pleaseInput')}
                value={usersSync.phoneState}
                onChange={(e) => usersSync.setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && usersSync.submitSearch()}
              />
            </Field>
            <Field label={t('common.status')} htmlFor="system-user-status">
              <Select
                value={usersSync.statusState}
                onValueChange={(value) =>
                  usersSync.setStatus(value as StatusFilter)
                }
              >
                <SelectTrigger id="system-user-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(STATUS_LABEL_KEYS[status])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}
      </FilterBar>
      <UsersTable
        usersSync={usersSync}
        onDeleteRequest={(user) =>
          setDeleting({
            ids: [user.id],
            name: user.nickname ?? user.username,
          })
        }
        onBatchDelete={(ids) => setDeleting({ ids })}
      />
      {/* key 重挂载整个抽屉：打开/切换目标时以最新编辑对象重建表单初值 */}
      <UserDialog
        key={`${usersSync.dialogState.editing?.id ?? 'create'}-${usersSync.dialogState.open}`}
        usersSync={usersSync}
      />
      <UserDetailDrawer usersSync={usersSync} />
      <ResetPasswordDialog usersSync={usersSync} />
      <ConfirmDeleteDialog
        open={deletingState !== null && deletingState.ids.length > 0}
        description={
          deletingState ? describeDeleteTarget(deletingState, t) : ''
        }
        pendingState={usersSync.deleteManyMutation.isPending}
        onClose={closeDelete}
        onConfirm={() => {
          if (!deletingState) return
          usersSync.deleteManyMutation.mutate(deletingState.ids, {
            onSettled: closeDelete,
          })
        }}
      />
    </div>
  )
}
