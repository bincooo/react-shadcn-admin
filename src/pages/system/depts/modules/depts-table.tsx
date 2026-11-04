import { useMemo, useState, type Key } from 'react'
import { useTranslation } from 'react-i18next'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { GridTable } from '@/components/core/grid-table'
import type { GridTableColumn } from '@/components/core/grid-table'
import { usePermission } from '@/components/system/use-permission'
import {
  EnabledStatusBadge,
  RowActionMenu,
} from '@/components/system/table-parts'
import type { SystemDeptTreeNode } from '@/api/system/dept'
import { formatDateTime } from '@/lib/format'
import type { DeptsSyncState } from './use-depts-sync'

/* ------------------------------ 通用小组件 ------------------------------ */

/** 行操作：编辑 / 删除，按按钮权限显隐；无可用操作时不渲染入口 */
function RowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: SystemDeptTreeNode
  onEdit: (dept: SystemDeptTreeNode) => void
  onDelete: (dept: SystemDeptTreeNode) => void
}) {
  const { t } = useTranslation()
  const can = usePermission()
  const canEdit = can('system:dept:update')
  const canDelete = can('system:dept:delete')
  if (!canEdit && !canDelete) return null
  return (
    <RowActionMenu width="sm">
      {canEdit && (
        <DropdownMenuItem onClick={() => onEdit(row)}>
          {t('common.edit')}
        </DropdownMenuItem>
      )}
      {canDelete && (
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
          {t('common.delete')}
        </DropdownMenuItem>
      )}
    </RowActionMenu>
  )
}

/* 列定义 */

const rowKey = (row: SystemDeptTreeNode) => row.id

/**
 * 部门树形表格：行数据带 children，由 rc-table 渲染层级缩进与展开。
 * 数据来自树接口且后端已按 sort 排序，因此各列关闭本地排序，避免打平层级。
 */
export function DeptsTable({
  deptsSync,
  onDeleteRequest,
}: {
  deptsSync: DeptsSyncState
  onDeleteRequest: (dept: SystemDeptTreeNode) => void
}) {
  const { t } = useTranslation()
  // 默认展开第一层：数据到达前根节点集合为空，到达后自动展开根行。
  // 用户手动展开/收起后以本地集合为准（null 表示尚未操作）。
  const rootKeys = useMemo(
    () => deptsSync.deptsTreeState.map((dept) => dept.id),
    [deptsSync.deptsTreeState],
  )
  const [expandedKeysState, setExpandedKeys] = useState<readonly Key[] | null>(
    null,
  )
  const expandedKeys = expandedKeysState ?? rootKeys

  const columns: GridTableColumn<SystemDeptTreeNode>[] = [
    {
      title: t('system.dept.name'),
      dataIndex: 'deptName',
      width: 240,
      minWidth: 160,
      sortable: false,
      render: (_, row) => (
        <span className="text-[13px] font-medium">{row.deptName}</span>
      ),
    },
    {
      title: t('system.dept.code'),
      dataIndex: 'deptCode',
      width: 180,
      minWidth: 140,
      sortable: false,
      render: (_, row) => (
        <span className="font-mono text-[12.5px] font-medium">
          {row.deptCode}
        </span>
      ),
    },
    {
      title: t('system.field.sort'),
      dataIndex: 'sort',
      width: 80,
      minWidth: 60,
      align: 'right',
      sortable: false,
      render: (_, row) => (
        <span className="text-[12.5px] tabular-nums">{row.sort}</span>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 100,
      minWidth: 80,
      sortable: false,
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
      sortable: false,
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
      render: (_, row) => (
        <RowActions
          row={row}
          onEdit={deptsSync.openEdit}
          onDelete={onDeleteRequest}
        />
      ),
    },
  ]

  return (
    <GridTable
      columns={columns}
      data={deptsSync.deptsTreeState}
      config={{
        rowKey,
        title: t('menu.dept'),
        loading: deptsSync.isFetchingState,
        expandable: {
          expandedRowKeys: expandedKeys,
          onExpandedRowsChange: (keys) => setExpandedKeys([...keys]),
        },
      }}
    />
  )
}
