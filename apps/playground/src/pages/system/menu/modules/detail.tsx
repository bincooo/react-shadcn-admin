import { Fragment, type ReactNode } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { usePermission } from '@/hooks/use-permission'
import { StatusBadge } from '@/components/common/status-badge'
import type { Menu } from '@/api/system/menu'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import type { MenuState } from './use-menu'
import { findMenuNode, menuNameLabel } from './model'
import { MenuIconPreview, MenuTypeBadge, MenuTypeIcon } from './tree'

/** 详情行：两组「左标签列（浅底 + 右边线）+ 右值列」；行间发丝线由使用处按行传入 */
function DetailRow({
  items,
  bordered,
}: {
  /** 两组属性；第二组缺省时其值列自动横跨剩余宽度 */
  items: [label: string, value: ReactNode][]
  bordered?: boolean
}) {
  return (
    <tr className={cn(bordered && 'border-b border-border/60')}>
      {items.map(([label, value], index) => (
        <Fragment key={label}>
          <th
            scope="row"
            className="w-28 border-r border-border/60 bg-muted/40 px-4 py-2.5 text-right align-top text-[12px] font-normal whitespace-nowrap text-muted-foreground"
          >
            {label}
          </th>
          <td
            colSpan={items.length === 1 ? 3 : undefined}
            className={cn(
              'truncate px-4 py-2.5 text-[13px]',
              // 两列布局时第一组值列与第二组标签列之间也要有竖线
              items.length === 2 && index === 0 && 'border-r border-border/60',
            )}
          >
            {value}
          </td>
        </Fragment>
      ))}
    </tr>
  )
}

/** 路由地址属于代码工件，用等宽字体与普通文案区分 */
function PathValue({ path }: { path?: string | null }) {
  return <span className="font-mono text-[12.5px]">{path ?? '—'}</span>
}

/**
 * 右上：选中菜单的详情卡片，带编辑/添加子级/删除入口。
 * 头部是身份块（图标 + 名称 + 徽标 + 编码），下方属性网格只留真实属性；
 * 只读展示，变更仍走 menuMgr 的对话框。
 */
export function MenuDetail({
  menu,
  menuMgr,
}: {
  menu: Menu
  menuMgr: MenuState
}) {
  const can = usePermission()
  // 父级菜单名按中文展示；查不到（数据异常）时回退显示原始编码
  const parentMenu = menu.parentMenuId
    ? findMenuNode(menuMgr.allMenus, menu.parentMenuId)
    : null
  const parentLabel = parentMenu
    ? menuNameLabel(parentMenu.menuName)
    : (menu.parentMenuId ?? '根目录')
  // 图标优先取菜单自身配置；按钮节点没有类型图标，回退为空白占位
  const iconName = menu.imageIcon?.trim()
  let icon: ReactNode = null
  if (iconName) {
    icon = (
      <MenuIconPreview name={iconName} className="size-5 text-foreground" />
    )
  } else if (menu.menuType !== 'BUTTON') {
    icon = (
      <MenuTypeIcon
        type={menu.menuType}
        className="size-5 text-muted-foreground"
      />
    )
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
            {icon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <CardTitle className="text-[15px]">
                {menuNameLabel(menu.menuName)}
              </CardTitle>
              <MenuTypeBadge type={menu.menuType} />
              <StatusBadge enabled={menu.status === 'ENABLED'} />
            </div>
            <CardDescription className="font-mono text-[12px]">
              {menu.menuCode}
            </CardDescription>
          </div>
        </div>
        <CardAction className="flex items-center gap-2">
          {/* 菜单项不可再有下级：只有目录能添加子级，按钮权限走下方列表 */}
          {can('system:menu:create') && (
            <Button
              variant="outline"
              disabled={menu.menuType === 'MENU'}
              title={
                menu.menuType === 'MENU'
                  ? '菜单节点不支持下级，按钮权限请在下方列表添加'
                  : undefined
              }
              onClick={() => menuMgr.openCreate(menu.id)}
            >
              <Plus data-icon="inline-start" />
              {'添加子级'}
            </Button>
          )}
          {can('system:menu:update') && (
            <Button variant="outline" onClick={() => menuMgr.openEdit(menu)}>
              <Pencil data-icon="inline-start" />
              {'编辑'}
            </Button>
          )}
          {can('system:menu:delete') && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => menuMgr.openDelete(menu)}
            >
              <Trash2 data-icon="inline-start" />
              {'删除'}
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* 行式描述表：每行两组「标签|值」；外框由圆角容器提供，末行无下边线 */}
        <div className="overflow-hidden border border-border/60">
          <table className="w-full table-fixed border-collapse">
            <tbody>
              <DetailRow
                bordered
                items={[
                  ['路由地址', <PathValue key="url" path={menu.menuUrl} />],
                  ['父级菜单', parentLabel || '（根节点）'],
                ]}
              />
              <DetailRow
                bordered
                items={[
                  [
                    '创建人',
                    <span key="seq" className="tabular-nums">
                      {menu.createdBy ?? '—'}
                    </span>,
                  ],
                  [
                    '创建时间',
                    <span key="time" className="tabular-nums">
                      {formatDateTime(menu.createdAt)}
                    </span>,
                  ],
                ]}
              />
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
