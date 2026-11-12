import { useMemo, useRef, useState } from 'react'
import { Inbox, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Card } from '@repo/ui/components/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@repo/ui/components/empty'
import { TanStackTable, type TanStackColumnsType } from '@repo/table'
import { usePermission } from '@/hooks/use-permission'
import { PermissionButton } from '@/components/common/permission-button'
import { StatusBadge } from '@/components/common/status-badge'
import type { Menu } from '@/api/system/menu'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { MenuState } from './use-menu'
import { menuNameLabel } from './model'

/** 收集节点下全部后代按钮权限（按钮可能挂在菜单或目录下，递归取全） */
function collectButtons(node: Menu): Menu[] {
  const buttons: Menu[] = []
  const visit = (children: Menu[]) => {
    for (const child of children) {
      if (child.menuType === 'BUTTON') buttons.push(child)
      visit(child.children ?? [])
    }
  }
  visit(node.children ?? [])
  return buttons
}

/**
 * 右下：选中菜单的后代按钮权限列表（BUTTON 类型节点），可直接编辑/删除。
 * 数据由选中节点的子树本地派生，无独立接口。
 */
export function MenuPermissionsTable({
  menu,
  menuMgr,
}: {
  menu: Menu
  menuMgr: MenuState
}) {
  const can = usePermission()
  // 列定义作为模板传入；权限与行内动作通过 ref 读取
  const canRef = useRef(can)
  canRef.current = can
  const syncRef = useRef(menuMgr)
  syncRef.current = menuMgr
  // 目录不直接挂按钮权限：整表置为不可用（列表为空且不可交互）
  const isDirectory = menu.menuType === 'DIRECTORY'
  // 后端叶子节点带空 children 数组，rc-table 视 truthy children 为树形行，
  // 会渲染出多余的展开箭头；这里剥掉 children 输出纯平表。
  const rows = useMemo(() => {
    if (isDirectory) return []
    return collectButtons(menu).map(({ children: _children, ...rest }) => rest)
  }, [isDirectory, menu])
  // 多选集合：切换树节点时由外层 key 重挂载本组件，选中自然清零
  const [selectedState, setSelected] = useState<Set<string>>(new Set())
  // 选中集合与当前行求交：批量删除后行消失，选中数随之回落，无需额外清理
  const rowIds = useMemo(() => new Set(rows.map((row) => row.id)), [rows])
  const selectedKeys = useMemo(
    () => new Set([...selectedState].filter((id) => rowIds.has(id))),
    [selectedState, rowIds],
  )
  // 批量删除按钮的可用态与文案跟随当前可删除的勾选数量
  const selectedCount = selectedKeys.size
  const columns: TanStackColumnsType<Menu> = [
    {
      title: '权限名称',
      dataIndex: 'menuName',
      sorter: true,
      width: 220,
      minWidth: 160,
      render: (_, { menuName, menuCode }) => (
        <span className="block truncate">
          <span className="text-[13px] font-medium">
            {menuNameLabel(menuName)}
          </span>
          <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">
            {menuCode}
          </span>
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      sorter: true,
      width: 90,
      minWidth: 70,
      render: (_, { status }) => <StatusBadge enabled={status === 'ENABLED'} />,
    },
    {
      title: '排序',
      dataIndex: 'seq',
      sorter: true,
      width: 80,
      minWidth: 60,
      render: (_, { seq }) => (
        <span className="text-[12.5px] tabular-nums">{seq}</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      sorter: true,
      width: 180,
      minWidth: 130,
      render: (_, { createdAt }) => (
        <span className="text-[12.5px] text-muted-foreground tabular-nums">
          {formatDateTime(createdAt)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      align: 'right',
      fixed: 'right',
      lightCell: false,
      render: (_, row) => (
        <span className="flex items-center justify-end gap-1">
          {canRef.current('system:menu:update') && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={'编辑'}
              onClick={() => syncRef.current.openEdit(row)}
            >
              <Pencil />
            </Button>
          )}
          {canRef.current('system:menu:delete') && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={'删除'}
              className="text-destructive"
              onClick={() => syncRef.current.openDelete(row)}
            >
              <Trash2 />
            </Button>
          )}
        </span>
      ),
    },
  ]

  return (
    <div
      aria-disabled={isDirectory}
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2',
        isDirectory && 'pointer-events-none opacity-60 select-none',
      )}
    >
      <Card className="min-h-0 flex-1 gap-0 py-0">
        <TanStackTable
          stickyHeader
          fillHeight
          scroll={{ virtual: true }}
          columns={columns}
          dataSource={rows}
          rowKey="id"
          filterDisplay="none"
          pagination={false}
          loading={menuMgr.isFetching}
          emptyText={
            isDirectory ? (
              <Empty className="border-0 py-14">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox />
                  </EmptyMedia>
                  <EmptyTitle>{'目录节点不挂按钮权限'}</EmptyTitle>
                  <EmptyDescription>
                    {'请选择页面节点后添加或管理。'}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : undefined
          }
          toolbar={{
            title: (
              <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium">
                {'按钮权限'}
                <span className="text-[12px] font-normal text-muted-foreground">
                  {`共 ${rows.length} 条`}
                </span>
              </div>
            ),
            extra: (
              <>
                {can('system:menu:create') && (
                  <Button
                    variant="ghost"
                    disabled={isDirectory}
                    onClick={() => menuMgr.openCreateButton(menu.id)}
                  >
                    <Plus data-icon="inline-start" />
                    {'新增'}
                  </Button>
                )}
                <PermissionButton
                  permission="system:menu:delete"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={selectedCount === 0}
                  title={
                    selectedCount === 0 ? '请先勾选要删除的数据' : undefined
                  }
                  onClick={() => menuMgr.openBatchDelete([...selectedKeys])}
                >
                  <Trash2 data-icon="inline-start" />
                  {selectedCount === 0 ? '删除' : `删除 ${selectedCount} 项`}
                </PermissionButton>
              </>
            ),
          }}
          selection={{
            selectedRowKeys: [...selectedKeys],
            onChange: (keys) => setSelected(new Set(keys)),
            getCheckboxProps: () => ({ disabled: isDirectory }),
            fixed: true,
          }}
        />
      </Card>
    </div>
  )
}
