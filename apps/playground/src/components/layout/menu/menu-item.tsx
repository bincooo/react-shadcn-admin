import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip'
import { Icon } from '@/components/common/icon'
import { cn } from '@/lib/utils'
import type { MenuNode } from './menu-model'
import { useCloseFloatingMenu } from './hover-menu'
import { indent } from './menu-styles'

/** 菜单叶子节点出现的三种场景，样式差异集中描述 */
export type MenuVariant = 'primary' | 'secondary' | 'flyout'

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
 * 激活态自己算、className 传字符串：收起态下这个链接会成为 `TooltipTrigger` 的
 * `render` 元素，Base UI 会合并 className；函数式 className 会被 toString 成
 * 源码写进 class 属性，图标与布局样式随之失效。
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
      style={iconOnly || variant === 'flyout' ? undefined : indent(depth)}
      className={cn(
        'group flex items-center outline-none',
        'transition-[background-color,color] duration-200 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:inset-ring-2 focus-visible:inset-ring-ring/50',
        iconOnly
          ? 'h-12 w-full justify-center px-0'
          : variant === 'primary'
            ? 'min-h-12 gap-3 pr-3 text-[13.5px]'
            : variant === 'secondary'
              ? 'min-h-12 gap-2.5 pr-4 text-[13.5px]'
              : 'h-9.5 gap-2.5 rounded-md px-2.5 text-[13.5px]',
        isActive
          ? 'bg-primary/[0.08] text-primary'
          : variant === 'flyout'
            ? 'text-popover-foreground/72 hover:bg-accent hover:text-popover-foreground'
            : 'text-sidebar-foreground/90 hover:bg-sidebar-accent',
      )}
    >
      <Icon
        name={item.icon}
        className={cn(
          variant === 'primary' ? 'size-4.5' : 'size-4',
          'shrink-0 transition-colors duration-200',
          isActive
            ? 'text-primary'
            : cn(
                variant === 'primary'
                  ? 'text-sidebar-foreground/60'
                  : variant === 'secondary'
                    ? 'text-sidebar-foreground/90'
                    : 'text-popover-foreground/55',
                variant !== 'flyout' && 'group-hover:text-sidebar-foreground',
              ),
        )}
        strokeWidth={1.75}
      />
      {!iconOnly && <span className="truncate">{t(item.label)}</span>}
    </NavLink>
  )

  if (!iconOnly) return link

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{t(item.label)}</TooltipContent>
    </Tooltip>
  )
}
