import { useLocation, NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { Icon } from '@/components/common/icon'
import { useSidebarMenusSync } from '@/components/layout/use-menus-sync'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme'
import { containsMenuPath } from './menu-model'
import { FLYOUT_POPOVER, MENU_PANEL_POPOVER } from './menu-styles'
import { FlyoutMenu } from './flyout-menu'
import { HoverMenu } from './hover-menu'
import { useCloseFloatingMenu } from './floating-menu-context'

/**
 * 顶栏内的一级菜单（横向 / 分栏 / 混合布局）。
 * flyout 为 true 时（横向布局，没有侧边栏）子菜单以向下浮层呈现；
 * 否则子菜单交给左侧栏，顶栏项直接跳转。
 */
export function TopMenus({
  className,
  flyout = false,
}: {
  className?: string
  /** 是否用浮层展开子菜单（仅横向布局需要） */
  flyout?: boolean
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const { menus } = useSidebarMenusSync()
  const menuPanelMode = useThemeStore((state) => state.menuPanelMode)
  const closeFloatingMenu = useCloseFloatingMenu()
  return (
    <div className={cn('scrollbar-none min-w-0 overflow-x-auto', className)}>
      {/* w-max 让菜单按内容宽度排布，横向溢出时才能滚动 */}
      <div className="flex w-max items-center gap-0.5">
        {menus.map((item) => {
          // 用菜单树判断激活态：深层页面（如四级）也归属其一级菜单，
          // 不能依赖 NavLink 的前缀匹配（目标可能只是第一个叶子）
          const active = containsMenuPath(item, location.pathname)
          const itemClass = cn(
            'flex h-9 shrink-0 items-center gap-2 rounded-xs px-3 text-[14px] whitespace-nowrap transition-colors outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring/50',
            active
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )
          const label = (
            <>
              <Icon name={item.icon} className="size-4 shrink-0" />
              <span>{t(item.label)}</span>
              {flyout && item.children?.length ? (
                <ChevronDown className="size-3.5 shrink-0 opacity-60" />
              ) : null}
            </>
          )

          // 不需要浮层（分栏 / 混合有左侧栏）或叶子菜单：直接跳转
          if (!flyout || !item.children?.length) {
            return (
              <NavLink
                key={item.key}
                to={item.path}
                onClick={(event) => {
                  closeFloatingMenu()
                  if (location.pathname === item.path) event.preventDefault()
                }}
                className={itemClass}
              >
                {label}
              </NavLink>
            )
          }

          // 横向布局：悬停向下浮出子菜单（没有侧边栏，只能靠浮层导航）
          return (
            <HoverMenu
              key={item.key}
              side="bottom"
              sideOffset={6}
              closeDelay={150}
              className={menuPanelMode ? MENU_PANEL_POPOVER : FLYOUT_POPOVER}
              trigger={
                <button type="button" className={itemClass}>
                  {label}
                </button>
              }
            >
              <FlyoutMenu items={item.children} title={item.label} />
            </HoverMenu>
          )
        })}
      </div>
    </div>
  )
}
