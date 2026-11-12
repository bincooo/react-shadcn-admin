import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Header } from '@/components/common/header'
import { DeleteDialog } from '@/components/common/delete-dialog'
import { usePermission } from '@/hooks/use-permission'
import {
  SearchPanel,
  SearchStatusField,
  SearchTextField,
} from '@/components/common/search-panel'
import { ResetPasswordDialog, UserDialog } from './modules/dialog'
import { UserDetailDrawer } from './modules/detail'
import { UserTable } from './modules/table'
import { useUser } from './modules/use-user'

/** 删除目标：单个删除带人名，批量删除只带 id 集合 */
interface DeleteTarget {
  ids: string[]
  /** 单个删除时的人名（昵称/账号），用于确认文案；批量删除不传 */
  name?: string
  /** 工具栏批量删除：即使只勾选一人也按批量文案展示 */
  batch?: boolean
}

/** 删除确认文案：单个带用户名，批量带数量 */
function describeDeleteTarget(target: DeleteTarget): string {
  if (target.batch) {
    return `确认删除选中的 ${target.ids.length} 个用户？删除后不可恢复。`
  }
  return `确认删除用户「${target.name ?? target.ids[0]}」？删除后不可恢复。`
}

/**
 * 系统管理 → 用户管理：账号的分页列表与新建/编辑/删除。
 *
 * 数据来自真实后端 `/api/users`（仅管理员可用）；状态与变更逻辑
 * 收在 `modules/use-user`，本组件只做布局组合。
 */
export default function UsersPage() {
  const can = usePermission()
  const userMgr = useUser()
  const [deletingState, setDeleting] = useState<DeleteTarget | null>(null)
  const closeDelete = () => setDeleting(null)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <Header
        className="pr-4"
        title={'用户管理'}
        description={'系统账号的增删改查，改动即时生效。'}
        actions={
          <>
            <Button variant="outline" onClick={userMgr.refresh}>
              <RefreshCw data-icon="inline-start" />
              {'刷新'}
            </Button>
            {can('system:user:create') && (
              <Button onClick={userMgr.openCreate}>
                <Plus data-icon="inline-start" />
                {'新增'}
              </Button>
            )}
          </>
        }
      />
      <SearchPanel
        onReset={userMgr.resetFilters}
        onSearch={userMgr.submitSearch}
        collapsible
        defaultCollapsed
        primary={
          <SearchTextField
            id="system-user-keyword"
            label={'账号'}
            placeholder={'请输入'}
            value={userMgr.keyword}
            onChange={userMgr.setKeyword}
            onSearch={userMgr.submitSearch}
          />
        }
      >
        <SearchTextField
          id="system-user-phone"
          label={'手机号'}
          placeholder={'请输入'}
          value={userMgr.phone}
          onChange={userMgr.setPhone}
          onSearch={userMgr.submitSearch}
        />
        <SearchStatusField
          id="system-user-status"
          value={userMgr.status}
          onChange={userMgr.setStatus}
        />
      </SearchPanel>
      <UserTable
        userMgr={userMgr}
        onDeleteRequest={(user) =>
          setDeleting({
            ids: [user.id],
            name: user.nickname ?? user.username,
          })
        }
        onBatchDeleteRequest={() =>
          setDeleting({ ids: userMgr.deletableIds, batch: true })
        }
      />
      {/* key 重挂载整个抽屉：打开/切换目标时以最新编辑对象重建表单初值 */}
      <UserDialog
        key={`${userMgr.dialog.editing?.id ?? 'create'}-${userMgr.dialog.open}`}
        userMgr={userMgr}
      />
      <UserDetailDrawer userMgr={userMgr} />
      <ResetPasswordDialog userMgr={userMgr} />
      <DeleteDialog
        open={deletingState !== null && deletingState.ids.length > 0}
        description={deletingState ? describeDeleteTarget(deletingState) : ''}
        pending={userMgr.deleteManyMutation.isPending}
        onClose={closeDelete}
        onConfirm={() => {
          if (!deletingState) return
          userMgr.deleteManyMutation.mutate(deletingState.ids, {
            onSettled: closeDelete,
          })
        }}
      />
    </div>
  )
}
