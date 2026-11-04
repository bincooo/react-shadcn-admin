import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/components/system/use-permission'
import type { SystemMenu } from '@/api/system/menu'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import type { MenusSyncState } from './use-menus-sync'
import { findMenuNode } from './menu-tree'
import { MenuIconPreview, MenuTypeBadge, StatusBadge } from './menu-display'
import { MenuTypeIcon } from './menus-tree'

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
            className="w-28 border-r border-border/60 bg-muted/40 px-4 py-2.5 text-left align-top text-[12px] font-normal whitespace-nowrap text-muted-foreground"
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
function PathValue({ path }: { path: string | null }) {
  return <span className="font-mono text-[12.5px]">{path ?? '—'}</span>
}

/**
 * 右上：选中菜单的详情卡片，带编辑/添加子级/删除入口。
 * 头部是身份块（图标 + 名称 + 徽标 + 编码），下方属性网格只留真实属性；
 * 只读展示，变更仍走 menusSync 的对话框。
 */
export function MenuDetail({
  menu,
  menusSync,
}: {
  menu: SystemMenu
  menusSync: MenusSyncState
}) {
  const { t } = useTranslation()
  const can = usePermission()
  // 父级菜单名与页面其他名称一样走 i18n；查不到（数据异常）时回退显示原始编码
  const parentMenu = menu.parentMenuCode
    ? findMenuNode(menusSync.allMenus, menu.parentMenuCode)
    : null
  const parentLabel = parentMenu ? t(parentMenu.menuName) : menu.parentMenuCode
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
              <CardTitle className="text-[15px]">{t(menu.menuName)}</CardTitle>
              <MenuTypeBadge type={menu.menuType} />
              <StatusBadge status={menu.status} />
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
              size="sm"
              disabled={menu.menuType === 'MENU'}
              title={
                menu.menuType === 'MENU'
                  ? t('system.menu.noChildHint')
                  : undefined
              }
              onClick={() => menusSync.openCreate(menu.menuCode)}
            >
              <Plus data-icon="inline-start" />
              添加子级
            </Button>
          )}
          {can('system:menu:update') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => menusSync.openEdit(menu)}
            >
              <Pencil data-icon="inline-start" />
              {t('common.edit')}
            </Button>
          )}
          {can('system:menu:delete') && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => menusSync.openDelete(menu)}
            >
              <Trash2 data-icon="inline-start" />
              {t('common.delete')}
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* 行式描述表：每行两组「标签|值」；外框由圆角容器提供，末行无下边线 */}
        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full table-fixed border-collapse">
            <tbody>
              <DetailRow
                bordered
                items={[
                  [
                    t('system.menu.routePath'),
                    <PathValue key="url" path={menu.menuUrl} />,
                  ],
                  [
                    t('system.menu.parentMenu'),
                    parentLabel || t('system.menu.rootNode'),
                  ],
                ]}
              />
              <DetailRow
                bordered
                items={[
                  [
                    t('system.menu.createdBy'),
                    <span key="seq" className="tabular-nums">
                      {menu.createdBy ?? '—'}
                    </span>,
                  ],
                  [
                    t('common.createdAt'),
                    <span key="time" className="tabular-nums">
                      {formatDateTime(menu.createdAt)}
                    </span>,
                  ],
                ]}
              />
              <DetailRow items={[[t('system.field.sort'), menu.seq]]} />
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
