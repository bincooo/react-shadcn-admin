import { useMemo, useRef, useState, type Key } from 'react'
import { Pencil, Trash2, SlidersHorizontal } from 'lucide-react'
import { Card } from '@repo/ui/components/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@repo/ui/components/dropdown-menu'
import { Button } from '@repo/ui/components/button'
import {
  TanStackTable,
  type ExpandedState,
  type TanStackColumnsType,
} from '@repo/table'
import { usePermission } from '@/hooks/use-permission'
import { StatusBadge } from '@/components/common/status-badge'
import type { DeptTreeNode } from '@/api/system/dept'
import { formatDateTime } from '@/lib/format'
import type { DeptState } from './use-dept'

/* ------------------------------ 通用小组件 ------------------------------ */

/** 行操作：编辑 / 删除，按按钮权限显隐；无可用操作时不渲染入口 */
function Actions({
  row,
  onEdit,
  onDelete,
}: {
  row: DeptTreeNode
  onEdit: (dept: DeptTreeNode) => void
  onDelete: (dept: DeptTreeNode) => void
}) {
  const can = usePermission()
  const canEdit = can('system:dept:update')
  const canDelete = can('system:dept:delete')
  if (!canEdit && !canDelete) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-xs" aria-label={'操作'} />}
      >
        <SlidersHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-24">
        {canEdit && (
          <DropdownMenuItem onClick={() => onEdit(row)}>
            <Pencil />
            {'编辑'}
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
            <Trash2 />
            {'删除'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * 部门树形表格：行数据带 children，由 `@repo/table` 渲染层级缩进与展开。
 * 数据来自树接口且后端已按 sort 排序，因此各列关闭本地排序，避免打平层级。
 */
export function DeptTable({
  deptMgr,
  onDeleteRequest,
}: {
  deptMgr: DeptState
  onDeleteRequest: (dept: DeptTreeNode) => void
}) {
  // 默认展开第一层：数据到达前根节点集合为空，到达后自动展开根行。
  // 用户手动展开/收起后以本地集合为准（null 表示尚未操作）。
  const rootKeys = useMemo(
    () => deptMgr.deptTree.map((dept) => dept.id),
    [deptMgr.deptTree],
  )
  const [expandedKeysState, setExpandedKeys] = useState<readonly Key[] | null>(
    null,
  )
  const expandedKeys = expandedKeysState ?? rootKeys

  // 列定义作为模板传入；行内动作走 ref 读取最新状态
  const syncRef = useRef(deptMgr)
  syncRef.current = deptMgr
  const onDeleteRef = useRef(onDeleteRequest)
  onDeleteRef.current = onDeleteRequest
  const columns: TanStackColumnsType<DeptTreeNode> = [
    {
      title: '部门名称',
      dataIndex: 'deptName',
      filterMode: 'search',
      width: 240,
      minWidth: 160,
      treeColumn: true,
      render: (_, { deptName }) => (
        <span className="text-[13px] font-medium">{deptName}</span>
      ),
    },
    {
      title: '部门编码',
      dataIndex: 'deptCode',
      filterMode: 'search',
      width: 180,
      minWidth: 140,
      render: (_, { deptCode }) => (
        <span className="font-mono text-[12.5px] font-medium">{deptCode}</span>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      filterMode: 'search',
      width: 80,
      minWidth: 60,
      align: 'right',
      render: (_, { sort }) => (
        <span className="text-[12.5px] tabular-nums">{sort}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      filterMode: 'menu',
      filterMultiple: false,
      filters: [
        { text: '启用', value: 'ENABLED' },
        { text: '停用', value: 'DISABLED' },
      ],
      width: 100,
      minWidth: 80,
      render: (_, { status }) => <StatusBadge enabled={status === 'ENABLED'} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      filterMode: 'dateRange',
      width: 170,
      minWidth: 130,
      align: 'right',
      render: (_, { createdAt }) => (
        <span className="text-[12.5px] text-muted-foreground tabular-nums">
          {formatDateTime(createdAt)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      align: 'right',
      fixed: 'right',
      lightCell: false,
      render: (_, row) => (
        <Actions
          row={row}
          onEdit={syncRef.current.openEdit}
          onDelete={onDeleteRef.current}
        />
      ),
    },
  ]

  const expandedTreeKeys = useMemo(() => {
    const next: Record<string, boolean> = {}
    for (const key of expandedKeys) next[String(key)] = true
    return next
  }, [expandedKeys])

  return (
    <Card className="min-h-0 flex-1 gap-0 py-0">
      <TanStackTable
        stickyHeader
        fillHeight
        scroll={{ virtual: true }}
        columns={columns}
        dataSource={deptMgr.deptTree}
        rowKey="id"
        filterDisplay="row"
        pagination={false}
        loading={deptMgr.isFetching}
        toolbar
        expandable={{
          childrenColumnName: 'children',
          indentSize: 20,
          treeLine: true,
          expandedTreeKeys,
          onExpandedTreeChange: (expanded: ExpandedState) => {
            if (expanded === true) return
            setExpandedKeys(
              Object.entries(expanded)
                .filter(([, open]) => open)
                .map(([key]) => key),
            )
          },
        }}
      />
    </Card>
  )
}
