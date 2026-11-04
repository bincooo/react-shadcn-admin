import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GridTable } from '@/components/core/grid-table'
import type { GridTableColumn } from '@/components/core/grid-table'
import { usePermission } from '@/components/system/use-permission'
import { BatchDeleteAction } from '@/components/system/table-parts'
import { getAppContainer } from '@/components/system/table-config'
import type { SystemMenu } from '@/api/system/menu'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { MenusSyncState } from './use-menus-sync'
import { StatusBadge } from './menu-display'

/** 收集节点下全部后代按钮权限（按钮可能挂在菜单或目录下，递归取全） */
function collectButtons(node: SystemMenu): SystemMenu[] {
  const buttons: SystemMenu[] = []
  const visit = (children: SystemMenu[]) => {
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
  menusSync,
}: {
  menu: SystemMenu
  menusSync: MenusSyncState
}) {
  const { t } = useTranslation()
  const can = usePermission()
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
  const rowCodes = useMemo(
    () => new Set(rows.map((row) => row.menuCode)),
    [rows],
  )
  const selectedKeys = useMemo(
    () => new Set([...selectedState].filter((code) => rowCodes.has(code))),
    [selectedState, rowCodes],
  )
  const columns: GridTableColumn<SystemMenu>[] = [
    {
      title: t('system.menu.permissionName'),
      dataIndex: 'menuName',
      width: 220,
      minWidth: 160,
      render: (_, row) => (
        <span className="block truncate">
          <span className="text-[13px] font-medium">{t(row.menuName)}</span>
          <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">
            {row.menuCode}
          </span>
        </span>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 90,
      minWidth: 70,
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      title: t('system.field.sort'),
      dataIndex: 'seq',
      width: 80,
      minWidth: 60,
      render: (_, row) => (
        <span className="text-[12.5px] tabular-nums">{row.seq}</span>
      ),
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      width: 180,
      minWidth: 130,
      render: (_, row) => (
        <span className="text-[12.5px] text-muted-foreground tabular-nums">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      align: 'right',
      render: (_, row) => (
        <span className="flex items-center justify-end gap-1">
          {can('system:menu:update') && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('common.edit')}
              onClick={() => menusSync.openEdit(row)}
            >
              <Pencil />
            </Button>
          )}
          {can('system:menu:delete') && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('common.delete')}
              className="text-destructive"
              onClick={() => menusSync.openDelete(row)}
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
        'flex flex-col gap-2',
        isDirectory && 'pointer-events-none opacity-60 select-none',
      )}
    >
      <GridTable
        columns={columns}
        data={rows}
        config={{
          rowKey: (row) => row.menuCode,
          title: t('system.menu.buttonPermissions'),
          total: rows.length,
          loading: menusSync.isFetchingState,
          // 目录态空态文案：说明为什么列表为空
          emptyTitle: isDirectory
            ? t('system.menu.noButtonPermissions')
            : undefined,
          emptyDescription: isDirectory
            ? t('system.menu.selectPageFirst')
            : undefined,
          // 在该菜单下登记新的按钮权限节点（弹层为按钮创建模式）
          toolbarAction: can('system:menu:create') && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isDirectory}
              onClick={() => menusSync.openCreateButton(menu.menuCode)}
            >
              <Plus data-icon="inline-start" />
              添加
            </Button>
          ),
          selection: {
            selectedKeys,
            onChange: setSelected,
            // 目录下的按钮仅展示，不可勾选
            isRowSelectable: () => !isDirectory,
            getContainer: getAppContainer,
            // 选中胶囊中的批量删除（清空按钮由 GridTable 提供）
            actions: can('system:menu:delete') && selectedKeys.size > 0 && (
              <BatchDeleteAction
                count={selectedKeys.size}
                onClick={() => menusSync.openBatchDelete([...selectedKeys])}
              />
            ),
          },
        }}
      />
    </div>
  )
}
