import { useTranslation } from 'react-i18next'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { GridTable } from '@/components/core/grid-table'
import type { GridTableColumn } from '@/components/core/grid-table'
import { usePermission } from '@/components/system/use-permission'
import {
  BatchDeleteAction,
  EnabledStatusBadge,
  RowActionMenu,
} from '@/components/system/table-parts'
import {
  getAppContainer,
  toPaginationConfig,
} from '@/components/system/table-config'
import type { SystemRole } from '@/api/system/role'
import { formatDateTime } from '@/lib/format'
import type { RolesSyncState } from './use-roles-sync'

/* ------------------------------ 通用小组件 ------------------------------ */

/** 行操作：分配用户 / 菜单授权 / 编辑 / 删除 */
function RowActions({
  row,
  onAssign,
  onMenus,
  onEdit,
  onDelete,
}: {
  row: SystemRole
  onAssign: (role: SystemRole) => void
  onMenus: (role: SystemRole) => void
  onEdit: (role: SystemRole) => void
  onDelete: (role: SystemRole) => void
}) {
  const { t } = useTranslation()
  const can = usePermission()
  return (
    <RowActionMenu width="lg">
      {can('system:role:assign-user') && (
        <DropdownMenuItem onClick={() => onAssign(row)}>
          {t('menu.roleAssignUser')}
        </DropdownMenuItem>
      )}
      {can('system:role:update') && (
        <DropdownMenuItem onClick={() => onMenus(row)}>
          {t('system.role.menuGrant')}
        </DropdownMenuItem>
      )}
      {can('system:role:update') && (
        <DropdownMenuItem onClick={() => onEdit(row)}>
          {t('common.edit')}
        </DropdownMenuItem>
      )}
      {can('system:role:delete') && (
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
          {t('common.delete')}
        </DropdownMenuItem>
      )}
    </RowActionMenu>
  )
}

/* 列定义 */

const rowKey = (row: SystemRole) => row.roleCode

/**
 * 角色表格：列头直接用中文，工具栏、多选与分页由 `GridTable` 提供。
 * 角色编码即业务主键，删除、分配用户与批量删除均以它为标识。
 */
export function RolesTable({
  rolesSync,
  onAssign,
  onMenus,
  onDeleteRequest,
  onBatchDelete,
}: {
  rolesSync: RolesSyncState
  onAssign: (role: SystemRole) => void
  onMenus: (role: SystemRole) => void
  onDeleteRequest: (role: SystemRole) => void
  onBatchDelete: (roleCodes: string[]) => void
}) {
  const { t } = useTranslation()
  const can = usePermission()
  const columns: GridTableColumn<SystemRole>[] = [
    {
      title: t('system.role.code'),
      dataIndex: 'roleCode',
      width: 180,
      minWidth: 140,
      fixed: 'left',
      render: (_, row) => (
        <span className="font-mono text-[12.5px] font-medium">
          {row.roleCode}
        </span>
      ),
    },
    {
      title: t('system.role.name'),
      dataIndex: 'roleName',
      width: 160,
      minWidth: 120,
      render: (_, row) => (
        <span className="text-[13px] font-medium">{row.roleName}</span>
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      width: 280,
      minWidth: 160,
      render: (_, row) => (
        <span className="truncate text-[12.5px] text-muted-foreground">
          {row.description ?? '—'}
        </span>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 100,
      minWidth: 80,
      render: (_, row) => (
        <EnabledStatusBadge enabled={row.status === 'ENABLED'} />
      ),
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      width: 170,
      minWidth: 130,
      align: 'right',
      render: (_, row) => (
        <span className="text-[12.5px] text-muted-foreground tabular-nums">
          {formatDateTime(row.createdAt)}
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
          onAssign={onAssign}
          onMenus={onMenus}
          onEdit={rolesSync.openEdit}
          onDelete={onDeleteRequest}
        />
      ),
    },
  ]

  return (
    <GridTable
      columns={columns}
      data={rolesSync.roles}
      config={{
        rowKey,
        title: t('menu.role'),
        total: rolesSync.total,
        loading: rolesSync.isFetchingState,
        selection: {
          selectedKeys: rolesSync.selectedState,
          onChange: rolesSync.setSelected,
          getContainer: getAppContainer,
          // 选中胶囊中的批量删除（清空按钮由 GridTable 提供）
          actions: can('system:role:delete') && (
            <BatchDeleteAction
              count={rolesSync.selectedCount}
              disabled={rolesSync.selectedCount === 0}
              onClick={() => onBatchDelete([...rolesSync.selectedState])}
            />
          ),
        },
        pagination: toPaginationConfig(rolesSync),
      }}
    />
  )
}
