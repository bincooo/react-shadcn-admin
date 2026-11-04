import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Icon } from '@/components/common/icon'
import { cn } from '@/lib/utils'
import type { MenuNode } from './menu-model'
import { useCloseFloatingMenu } from './floating-menu-context'
import {
  ACTIVE_ITEM,
  FLYOUT_INACTIVE_ITEM,
  FLYOUT_ROW,
  FLYOUT_TEXT_55,
  INACTIVE_ITEM,
  MENU_FOCUS,
  MENU_VARIANTS,
  indent,
} from './menu-styles'

/** 菜单叶子节点出现的三种场景，样式差异集中描述 */
export type MenuVariant = 'primary' | 'secondary' | 'flyout'

const VARIANT = {
  primary: {
    row: 'min-h-12 gap-3 pr-3 text-[13.5px]',
    ...MENU_VARIANTS.primary,
    inactive: INACTIVE_ITEM,
    activeHoverIcon: 'group-hover:text-sidebar-foreground',
    indented: true,
  },
  secondary: {
    row: 'min-h-12 gap-2.5 pr-4 text-[13.5px]',
    ...MENU_VARIANTS.secondary,
    inactive: INACTIVE_ITEM,
    activeHoverIcon: 'group-hover:text-sidebar-foreground',
    indented: true,
  },
  flyout: {
    row: FLYOUT_ROW,
    icon: 'size-4',
    inactive: FLYOUT_INACTIVE_ITEM,
    inactiveIcon: FLYOUT_TEXT_55,
    activeHoverIcon: '',
    indented: false,
  },
} as const satisfies Record<
  MenuVariant,
  {
    row: string
    icon: string
    inactive: string
    inactiveIcon: string
    activeHoverIcon: string
    indented: boolean
  }
>

interface MenuItemLinkProps {
  item: MenuNode
  /** 所在栏位：整栏 / 二级栏 / 收起态浮层 */
  variant?: MenuVariant
  /** 收起态：仅显示图标并附带 Tooltip */
  iconOnly?: boolean
  /** 层级深度：0 为该栏顶层，子项逐级 +1 */
  depth?: number
}

/**
 * 菜单叶子链接。
 * 页签的补充与激活由 `useRouteTabSync`（监听路由变化）统一处理，此处保持纯展示，
 * 不写 store，避免每个菜单项都订阅一次应用状态。
 *
 * 激活态自己算、className 传字符串：收起态下这个链接会被 `TooltipTrigger asChild`
 * 包一层，Radix Slot 合并 className 用的是 `[slot, child].join(' ')`，
 * 函数式 className 会被 toString 成源码写进 class 属性，图标与布局样式随之失效。
 */
export function MenuItemLink({
  item,
  variant = 'primary',
  iconOnly = false,
  depth = 0,
}: MenuItemLinkProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const closeFloatingMenu = useCloseFloatingMenu()
  const styles = VARIANT[variant]
  const isActive = location.pathname === item.path

  const link = (
    <NavLink
      to={item.path}
      end
      aria-label={iconOnly ? t(item.label) : undefined}
      onClick={(event) => {
        closeFloatingMenu()
        if (isActive) event.preventDefault()
      }}
      style={iconOnly || !styles.indented ? undefined : indent(depth)}
      className={cn(
        'group flex items-center outline-none',
        MENU_FOCUS,
        iconOnly ? 'h-12 w-full justify-center px-0' : styles.row,
        isActive ? ACTIVE_ITEM : styles.inactive,
      )}
    >
      <Icon
        name={item.icon}
        className={cn(
          styles.icon,
          'shrink-0 transition-colors duration-200',
          isActive
            ? 'text-primary'
            : cn(styles.inactiveIcon, styles.activeHoverIcon),
        )}
        strokeWidth={1.75}
      />
      {!iconOnly && <span className="truncate">{t(item.label)}</span>}
    </NavLink>
  )

  if (!iconOnly) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{t(item.label)}</TooltipContent>
    </Tooltip>
  )
}
