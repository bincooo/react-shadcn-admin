import { useTranslation } from 'react-i18next'
import { usePermission } from '@/components/system/use-permission'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { GridTable } from '@/components/core/grid-table'
import type { GridTableColumn } from '@/components/core/grid-table'
import { NameAvatar } from '@/components/common/user-avatar'
import {
  BatchDeleteAction,
  EnabledStatusBadge,
  RowActionMenu,
} from '@/components/system/table-parts'
import {
  getAppContainer,
  toPaginationConfig,
} from '@/components/system/table-config'
import type { SystemUser } from '@/api/system/user'
import { formatDateTime } from '@/lib/format'
import { RoleBadge } from './user-display'
import type { UsersSyncState } from './use-users-sync'

/* ------------------------------ 通用小组件 ------------------------------ */

/** 行操作：编辑 / 重置密码 / 删除（当前登录账号不可删除，隐藏入口） */
function RowActions({
  row,
  currentUserId,
  onEdit,
  onResetPassword,
  onDelete,
}: {
  row: SystemUser
  currentUserId: string | null
  onEdit: (user: SystemUser) => void
  onResetPassword: (user: SystemUser) => void
  onDelete: (user: SystemUser) => void
}) {
  const { t } = useTranslation()
  const can = usePermission()
  const canEdit = can('system:user:update')
  const canResetPassword = can('system:user:reset-password')
  const canDelete = can('system:user:delete')
  const deletable = row.id !== currentUserId && canDelete
  // 无任何可用操作时不渲染入口，避免空菜单
  if (!canEdit && !canResetPassword && !deletable) {
    return null
  }
  return (
    <RowActionMenu>
      {canEdit && (
        <DropdownMenuItem onClick={() => onEdit(row)}>
          {t('common.edit')}
        </DropdownMenuItem>
      )}
      {canResetPassword && (
        <DropdownMenuItem onClick={() => onResetPassword(row)}>
          重置密码
        </DropdownMenuItem>
      )}
      {deletable && (
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
          {t('common.delete')}
        </DropdownMenuItem>
      )}
    </RowActionMenu>
  )
}

/* 列定义 */

const rowKey = (row: SystemUser) => row.id

/**
 * 用户表格：列头直接用中文，工具栏与分页由 `GridTable` 提供。
 */
export function UsersTable({
  usersSync,
  onDeleteRequest,
  onBatchDelete,
}: {
  usersSync: UsersSyncState
  onDeleteRequest: (user: SystemUser) => void
  onBatchDelete: (ids: string[]) => void
}) {
  const { t } = useTranslation()
  const can = usePermission()
  const columns: GridTableColumn<SystemUser>[] = [
    {
      title: t('system.user.keyword'),
      dataIndex: 'username',
      width: 180,
      minWidth: 140,
      fixed: 'left',
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <NameAvatar
            name={row.nickname ?? row.username}
            src={row.avatar ?? undefined}
          />
          <div className="min-w-0">
            {/* 账号用 a 标签展示，主题色高亮，点击打开只读详情抽屉 */}
            <a
              href="#"
              className="block truncate text-[13px] font-medium text-primary underline-offset-2 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                usersSync.openDetail(row)
              }}
              title={t('common.viewDetail')}
            >
              {row.username}
            </a>
            <p className="truncate text-[11px] text-muted-foreground">
              {row.nickname ?? '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: t('system.user.dept'),
      dataIndex: 'deptName',
      width: 140,
      minWidth: 100,
      render: (_, row) => (
        <span className="truncate text-[12.5px] text-muted-foreground">
          {row.deptName ?? '—'}
        </span>
      ),
    },
    {
      title: t('system.user.email'),
      dataIndex: 'email',
      width: 200,
      minWidth: 140,
      render: (_, row) => (
        <span className="truncate text-[12.5px] text-muted-foreground">
          {row.email ?? '—'}
        </span>
      ),
    },
    {
      title: t('system.user.phone'),
      dataIndex: 'phone',
      width: 140,
      minWidth: 110,
      render: (_, row) => (
        <span className="text-[12.5px] tabular-nums">{row.phone ?? '—'}</span>
      ),
    },
    {
      title: t('system.user.roles'),
      dataIndex: 'roles',
      width: 120,
      minWidth: 90,
      render: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
        </div>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'enabled',
      width: 100,
      minWidth: 80,
      render: (_, row) => <EnabledStatusBadge enabled={row.enabled} />,
    },
    {
      title: t('system.user.registerTime'),
      dataIndex: 'registerTime',
      width: 170,
      minWidth: 130,
      align: 'right',
      render: (_, row) => (
        <span className="text-[12.5px] text-muted-foreground tabular-nums">
          {formatDateTime(row.registerTime)}
        </span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      align: 'right',
      fixed: 'right',
      render: (_, row) => (
        <RowActions
          row={row}
          currentUserId={usersSync.currentUserId}
          onEdit={usersSync.openEdit}
          onResetPassword={usersSync.openReset}
          onDelete={onDeleteRequest}
        />
      ),
    },
  ]

  return (
    <GridTable
      columns={columns}
      data={usersSync.users}
      config={{
        rowKey,
        title: t('menu.user'),
        total: usersSync.total,
        loading: usersSync.isFetchingState,
        selection: {
          selectedKeys: usersSync.selectedState,
          getContainer: getAppContainer,
          onChange: usersSync.setSelected,
          // 当前登录账号不可删除：禁用其复选框，避免选中数大于可删除数
          isRowSelectable: (user) => user.id !== usersSync.currentUserId,
          // 选中胶囊中的批量删除（清空按钮由 GridTable 提供）
          actions: can('system:user:delete') && (
            <BatchDeleteAction
              count={usersSync.deletableIds.length}
              disabled={usersSync.deletableIds.length === 0}
              onClick={() => onBatchDelete(usersSync.deletableIds)}
            />
          ),
        },
        pagination: toPaginationConfig(usersSync),
      }}
    />
  )
}
