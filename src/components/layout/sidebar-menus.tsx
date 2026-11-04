import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/common/icon'
import { Logo } from '@/components/navigation/logo'
import {
  useActiveSidebarGroupSync,
  useSidebarMenusSync,
} from '@/components/layout/use-menus-sync'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CollapseHandle } from './collapse-handle'
import { containsMenuPath, type MenuNode } from './menu/menu-model'
import { MenuItems } from './menu/menu-group'
import {
  ACTIVE_ITEM,
  INACTIVE_ITEM,
  MENU_FOCUS,
  TEXT_90,
} from './menu/menu-styles'
import { SIDEBAR_HEADER, SIDEBAR_SHELL } from './sidebar-styles'

interface PrimaryMenusProps {
  withLabel?: boolean
  /** 自定义菜单数据；缺省用完整菜单 */
  items?: MenuNode[]
  /** 分组选中态由父级维护：目录节点只切换第二栏，不导航 */
  activeKey?: string
  /** 点击含子菜单的目录节点时切换第二栏 */
  onSelectGroup?: (key: string) => void
  /** 栏底部插槽（双栏模式的标题显隐切换按钮） */
  footer?: ReactNode
}

/** 一级菜单 icon 栏（双栏布局使用，分栏布局传入根菜单的下一级） */
export function PrimaryMenus({
  withLabel = false,
  items: itemsProp,
  activeKey,
  onSelectGroup,
  footer,
}: PrimaryMenusProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { menus } = useSidebarMenusSync()
  const items = itemsProp ?? menus

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <nav
          className={cn(
            'flex flex-col',
            withLabel ? 'gap-1' : 'items-center gap-1',
          )}
          aria-label="primary"
        >
          {items.map((item) => {
            const hasChildren = Boolean(item.children?.length)
            const isActive =
              activeKey !== undefined
                ? item.key === activeKey
                : containsMenuPath(item, location.pathname)
            const itemClass = cn(
              'flex items-center',
              MENU_FOCUS,
              withLabel
                ? 'h-14.5 w-full flex-col justify-center gap-1.5'
                : 'h-12 w-full justify-center',
              isActive ? cn(ACTIVE_ITEM, 'bg-primary/10') : INACTIVE_ITEM,
            )
            const content = (
              <>
                <Icon
                  name={item.icon}
                  className="size-4.5 shrink-0"
                  strokeWidth={1.75}
                />
                {withLabel && (
                  <span className="max-w-full truncate px-0.5 text-[11.5px] leading-none">
                    {t(item.label)}
                  </span>
                )}
              </>
            )
            // 目录节点（如 /system）没有对应路由，点击只切换第二栏，避免落到 404
            const link = hasChildren ? (
              <button
                type="button"
                aria-label={t(item.label)}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelectGroup?.(item.key)}
                className={itemClass}
              >
                {content}
              </button>
            ) : (
              <NavLink
                to={item.path}
                aria-label={t(item.label)}
                onClick={(event) => {
                  if (location.pathname === item.path) event.preventDefault()
                }}
                className={itemClass}
              >
                {content}
              </NavLink>
            )

            // 显示标题时无需冒泡提示，仅纯 icon 态提供 Tooltip
            if (withLabel) return <div key={item.key}>{link}</div>

            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{t(item.label)}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
      </div>
      {footer && (
        <div className="flex shrink-0 justify-center border-t border-sidebar-border p-2">
          {footer}
        </div>
      )}
    </div>
  )
}

interface SecondaryMenusProps {
  /** 顶部标题：'parent' 显示父级菜单名，'app' 显示系统名，'none' 不显示 */
  header?: 'parent' | 'app' | 'none'
  /** 自定义菜单数据；缺省时取当前路由所属一级菜单的下一级 */
  items?: MenuNode[]
  /** 收起状态 */
  collapsed?: boolean
  /** 收起回调；缺省切换全局 collapsed */
  onToggleCollapsed?: () => void
}

/** 当前一级菜单下的二级导航（分栏 / 双栏 / 混合） */
export function SecondaryMenus({
  header: headerProp,
  items: itemsProp,
  collapsed = false,
  onToggleCollapsed,
}: SecondaryMenusProps) {
  const activeTop = useActiveSidebarGroupSync()

  // 显式菜单优先；没有子菜单时，直接把当前一级菜单作为唯一入口
  let children: MenuNode[] = []
  if (itemsProp?.length) children = itemsProp
  else if (activeTop?.children?.length) children = activeTop.children
  else if (activeTop) children = [activeTop]

  if (!children.length) return null

  const header = headerProp ?? 'parent'
  const body = (
    <>
      {header !== 'none' && (
        <div
          className={cn(
            SIDEBAR_HEADER,
            'justify-center',
            collapsed ? 'px-0' : 'px-4',
          )}
        >
          <SecondaryHeader
            header={header}
            collapsed={collapsed}
            activeTop={activeTop}
          />
        </div>
      )}
      <nav
        className={cn(
          'flex flex-col pb-3',
          // 收起态与 icon 栏（PrimaryMenus）保持一致的间距节奏，避免两栏图标错位
          collapsed ? 'items-center gap-1' : 'gap-0.5',
        )}
      >
        <MenuItems items={children} variant="secondary" collapsed={collapsed} />
      </nav>
    </>
  )

  return (
    <aside
      data-slot="app-sidebar"
      data-variant="secondary"
      className={cn(
        SIDEBAR_SHELL,
        'h-full',
        collapsed ? 'w-16' : 'w-(--sidebar-width)',
      )}
    >
      <CollapseHandle collapsed={collapsed} onToggle={onToggleCollapsed} />
      {body}
    </aside>
  )
}

function SecondaryHeader({
  header,
  collapsed,
  activeTop,
}: {
  header: 'parent' | 'app'
  collapsed: boolean
  activeTop: MenuNode | undefined
}) {
  const { t } = useTranslation()

  if (header === 'app') {
    const appName = t('app.name')
    return (
      <span className="truncate text-[24px] font-bold tracking-tight text-primary">
        {collapsed ? appName[0].toUpperCase() : appName}
      </span>
    )
  }

  if (collapsed) return <Logo collapsed />

  return (
    <span
      className={cn(
        'truncate text-[13px] font-semibold tracking-widest uppercase',
        TEXT_90,
      )}
    >
      {t(activeTop?.label ?? 'app.name')}
    </span>
  )
}
