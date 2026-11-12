import { useRef } from 'react'
import {
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
  SlidersHorizontal,
} from 'lucide-react'
import { Card } from '@repo/ui/components/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@repo/ui/components/dropdown-menu'
import { Button } from '@repo/ui/components/button'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'
import { usePermission } from '@/hooks/use-permission'
import { PermissionButton } from '@/components/common/permission-button'
import { StatusBadge } from '@/components/common/status-badge'
import { withTablePagination } from '@/lib/pagination'
import type { Role } from '@/api/system/role'
import { formatDateTime } from '@/lib/format'
import type { RoleState } from './use-role'

/* ------------------------------ 通用小组件 ------------------------------ */

/** 行操作：分配用户 / 菜单授权 / 编辑 / 删除 */
function Actions({
  row,
  onAssign,
  onMenus,
  onEdit,
  onDelete,
}: {
  row: Role
  onAssign: (role: Role) => void
  onMenus: (role: Role) => void
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}) {
  const can = usePermission()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-xs" aria-label={'操作'} />}
      >
        <SlidersHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {can('system:role:assign-user') && (
          <DropdownMenuItem onClick={() => onAssign(row)}>
            <UserPlus />
            {'分配用户'}
          </DropdownMenuItem>
        )}
        {can('system:role:update') && (
          <DropdownMenuItem onClick={() => onMenus(row)}>
            <ShieldCheck />
            {'角色授权'}
          </DropdownMenuItem>
        )}
        {can('system:role:update') && (
          <DropdownMenuItem onClick={() => onEdit(row)}>
            <Pencil />
            {'编辑'}
          </DropdownMenuItem>
        )}
        {can('system:role:delete') && (
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
 * 角色表格：列头直接用中文，工具栏、多选与分页由 `@repo/table` 提供。
 * 代理 id 是行标识与 CRUD 标识；角色编码仅作为唯一业务键展示。
 */
export function RoleTable({
  roleMgr,
  onAssign,
  onMenus,
  onDeleteRequest,
}: {
  roleMgr: RoleState
  onAssign: (role: Role) => void
  onMenus: (role: Role) => void
  onDeleteRequest: (role: Role) => void
}) {
  // 批量删除按钮的可用态与文案跟随当前勾选数量
  const selectedCount = roleMgr.selectedCount
  // 列定义作为模板传入；行内动作走 ref 读取最新状态
  const syncRef = useRef(roleMgr)
  syncRef.current = roleMgr
  const actionsRef = useRef({ onAssign, onMenus, onDeleteRequest })
  actionsRef.current = { onAssign, onMenus, onDeleteRequest }
  const columns: TanStackColumnsType<Role> = [
    {
      title: '角色编码',
      dataIndex: 'roleCode',
      sorter: true,
      filterMode: 'search',
      width: 180,
      minWidth: 140,
      fixed: 'left',
      render: (_, { roleCode }) => (
        <span className="font-mono text-[12.5px] font-medium">{roleCode}</span>
      ),
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
      sorter: true,
      filterMode: 'search',
      width: 160,
      minWidth: 120,
      render: (_, { roleName }) => (
        <span className="text-[13px] font-medium">{roleName}</span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      sorter: true,
      filterMode: 'search',
      width: 280,
      minWidth: 160,
      render: (_, { description }) => (
        <span className="truncate text-[12.5px] text-muted-foreground">
          {description ?? '—'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      sorter: true,
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
      sorter: true,
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
          onAssign={actionsRef.current.onAssign}
          onMenus={actionsRef.current.onMenus}
          onEdit={syncRef.current.openEdit}
          onDelete={actionsRef.current.onDeleteRequest}
        />
      ),
    },
  ]

  return (
    <Card className="min-h-0 flex-1 gap-0 py-0">
      <TanStackTable
        rowKey="id"
        stickyHeader
        fillHeight
        scroll={{ virtual: true }}
        columns={columns}
        dataSource={roleMgr.roles}
        filterDisplay="row"
        pagination={withTablePagination(roleMgr)}
        loading={roleMgr.isFetching}
        toolbar={{
          title: (
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium">
              {'角色管理'}
              <span className="text-[12px] font-normal text-muted-foreground">
                {`共 ${roleMgr.total} 条`}
              </span>
            </div>
          ),
          extra: (
            <PermissionButton
              permission="system:role:delete"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={selectedCount === 0}
              title={selectedCount === 0 ? '请先勾选要删除的数据' : undefined}
              onClick={() => roleMgr.openBatchDelete([...roleMgr.selected])}
            >
              <Trash2 data-icon="inline-start" />
              {selectedCount === 0 ? '删除' : `删除 ${selectedCount} 项`}
            </PermissionButton>
          ),
        }}
        selection={{
          selectedRowKeys: [...roleMgr.selected],
          onChange: (keys) => roleMgr.setSelected(new Set(keys)),
          fixed: true,
        }}
      />
    </Card>
  )
}
