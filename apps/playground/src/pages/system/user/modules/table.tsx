import { useRef } from 'react'
import { KeyRound, Pencil, Trash2, SlidersHorizontal } from 'lucide-react'
import { usePermission } from '@/hooks/use-permission'
import { Card } from '@repo/ui/components/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@repo/ui/components/dropdown-menu'
import { Button } from '@repo/ui/components/button'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'
import { Badge } from '@repo/ui/components/badge'
import { PermissionButton } from '@/components/common/permission-button'
import { UserAvatar } from '@/components/common/user-avatar'
import { StatusBadge } from '@/components/common/status-badge'
import { withTablePagination } from '@/lib/pagination'
import type { User } from '@/api/system/user'
import { formatDateTime } from '@/lib/format'
import type { UserState } from './use-user'

/** 角色徽标：admin 用主色，其余用次要色；名称由后端角色表翻译 */
export function RoleBadge({ code, name }: { code: string; name: string }) {
  return (
    <Badge
      variant={code === 'admin' ? 'default' : 'secondary'}
      className="text-[11px]"
    >
      {name}
    </Badge>
  )
}

/** 角色徽标组：按编码顺序渲染；名称缺失时回退编码 */
export function RoleBadges({
  codes,
  names,
}: {
  codes: string[]
  names?: string[]
}) {
  return (
    <>
      {codes.map((code, index) => (
        <RoleBadge key={code} code={code} name={names?.[index] ?? code} />
      ))}
    </>
  )
}

/* ------------------------------ 通用小组件 ------------------------------ */

/** 行操作：编辑 / 重置密码 / 删除（当前登录账号不可删除，隐藏入口） */
function Actions({
  row,
  currentUserId,
  onEdit,
  onResetPassword,
  onDelete,
}: {
  row: User
  currentUserId: string | null
  onEdit: (user: User) => void
  onResetPassword: (user: User) => void
  onDelete: (user: User) => void
}) {
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-xs" aria-label={'操作'} />}
      >
        <SlidersHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-28">
        {canEdit && (
          <DropdownMenuItem onClick={() => onEdit(row)}>
            <Pencil />
            {'编辑'}
          </DropdownMenuItem>
        )}
        {canResetPassword && (
          <DropdownMenuItem onClick={() => onResetPassword(row)}>
            <KeyRound />
            {'重置密码'}
          </DropdownMenuItem>
        )}
        {deletable && (
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
 * 用户表格：列头直接用中文，工具栏与分页由 `@repo/table` 提供。
 */
export function UserTable({
  userMgr,
  onDeleteRequest,
  onBatchDeleteRequest,
}: {
  userMgr: UserState
  onDeleteRequest: (user: User) => void
  /** 工具栏批量删除入口：目标为当前勾选里排除登录账号后的 id 集合 */
  onBatchDeleteRequest: () => void
}) {
  // 勾选里排除当前登录账号后的可删除行数，决定批量删除按钮的可用态与文案
  const deletableCount = userMgr.deletableIds.length
  // 列定义作为模板传入；行内动作通过 ref 读取最新状态
  const syncRef = useRef(userMgr)
  syncRef.current = userMgr
  const onDeleteRef = useRef(onDeleteRequest)
  onDeleteRef.current = onDeleteRequest
  const columns: TanStackColumnsType<User> = [
    {
      title: '账号',
      dataIndex: 'username',
      sorter: true,
      filterMode: 'search',
      width: 180,
      minWidth: 140,
      fixed: 'left',
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={row.nickname ?? row.username} avatar={row.avatar} />
          <div className="min-w-0">
            {/* 账号用按钮展示（无导航语义），主题色高亮，点击打开只读详情抽屉 */}
            <button
              type="button"
              className="block max-w-full truncate text-left text-[13px] font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => syncRef.current.openDetail(row)}
              title={'查看详情'}
            >
              {row.username}
            </button>
            <p className="truncate text-[11px] text-muted-foreground">
              {row.nickname ?? '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'deptName',
      sorter: true,
      filterMode: 'search',
      width: 140,
      minWidth: 100,
      render: (_, { deptName }) => (
        <span className="truncate text-[12.5px] text-muted-foreground">
          {deptName ?? '—'}
        </span>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      sorter: true,
      filterMode: 'search',
      width: 200,
      minWidth: 140,
      render: (_, { email }) => (
        <span className="truncate text-[12.5px] text-muted-foreground">
          {email ?? '—'}
        </span>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      sorter: true,
      filterMode: 'search',
      width: 140,
      minWidth: 110,
      render: (_, { phone }) => (
        <span className="text-[12.5px] tabular-nums">{phone ?? '—'}</span>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      sorter: true,
      filterMode: 'search',
      width: 120,
      minWidth: 90,
      render: (_, { roles, roleNames }) => (
        <div className="flex flex-wrap gap-1">
          <RoleBadges codes={roles} names={roleNames} />
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      sorter: true,
      filterMode: 'menu',
      filterMultiple: false,
      filters: [
        { text: '启用', value: true },
        { text: '停用', value: false },
      ],
      width: 100,
      minWidth: 80,
      render: (_, { enabled }) => <StatusBadge enabled={enabled} />,
    },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      sorter: true,
      filterMode: 'dateRange',
      width: 170,
      minWidth: 130,
      align: 'right',
      render: (_, { registerTime }) => (
        <span className="text-[12.5px] text-muted-foreground tabular-nums">
          {formatDateTime(registerTime)}
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
          currentUserId={syncRef.current.currentUserId}
          onEdit={syncRef.current.openEdit}
          onResetPassword={syncRef.current.openReset}
          onDelete={onDeleteRef.current}
        />
      ),
    },
  ]

  return (
    <Card className="min-h-0 flex-1 gap-0 py-0">
      <TanStackTable
        stickyHeader
        fillHeight
        scroll={{ virtual: true }}
        columns={columns}
        dataSource={userMgr.users}
        rowKey="id"
        filterDisplay="row"
        pagination={withTablePagination(userMgr)}
        loading={userMgr.isFetching}
        toolbar={{
          title: (
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium">
              {'用户管理'}
              <span className="text-[12px] font-normal text-muted-foreground">
                {`共 ${userMgr.total} 条`}
              </span>
            </div>
          ),
          extra: (
            <PermissionButton
              permission="system:user:delete"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={deletableCount === 0}
              title={deletableCount === 0 ? '请先勾选要删除的数据' : undefined}
              onClick={onBatchDeleteRequest}
            >
              <Trash2 data-icon="inline-start" />
              {deletableCount === 0 ? '删除' : `删除 ${deletableCount} 项`}
            </PermissionButton>
          ),
        }}
        selection={{
          selectedRowKeys: [...userMgr.selected],
          onChange: (keys) => userMgr.setSelected(new Set(keys)),
          getCheckboxProps: (user) => ({
            disabled: user.id === userMgr.currentUserId,
          }),
          fixed: true,
        }}
      />
    </Card>
  )
}
