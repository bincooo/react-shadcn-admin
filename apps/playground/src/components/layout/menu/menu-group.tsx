import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/ui/components/collapsible'
import { Icon } from '@/components/common/icon'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme'
import { containsMenuPath, type MenuNode } from './menu-model'
import { FlyoutMenu } from './flyout-menu'
import { HoverMenu } from './hover-menu'
import { MenuItemLink, type MenuVariant } from './menu-item'
import { indent } from './menu-styles'

interface MenuItemGroupProps {
  item: MenuNode
  variant?: Exclude<MenuVariant, 'flyout'>
  /** 收起态：只显示图标，悬停/点击浮出子菜单 */
  collapsed?: boolean
  /** 层级深度：0 为该栏顶层，子项逐级 +1 */
  depth?: number
}

type MenuItemsProps = Omit<MenuItemGroupProps, 'item'> & { items: MenuNode[] }

/** 渲染一组菜单项：有子菜单的交给 MenuItemGroup，叶子交给 MenuItemLink */
export function MenuItems({
  items,
  variant = 'primary',
  collapsed = false,
  depth = 0,
}: MenuItemsProps) {
  return items.map((item) =>
    item.children?.length ? (
      <MenuItemGroup
        key={item.key}
        item={item}
        variant={variant}
        collapsed={collapsed}
        depth={depth}
      />
    ) : (
      <MenuItemLink
        key={item.key}
        item={item}
        variant={variant}
        iconOnly={collapsed}
        depth={depth}
      />
    ),
  )
}

/** 含子菜单的节点：展开态用可折叠列表，收起态用浮层（支持任意层级嵌套） */
function MenuItemGroup({
  item,
  variant = 'primary',
  collapsed = false,
  depth = 0,
}: MenuItemGroupProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const menuPanelMode = useThemeStore((state) => state.menuPanelMode)
  const inGroup = containsMenuPath(item, location.pathname)
  // 受控展开：路由进入该分组时自动展开；用户手动收起后保持收起，
  // 直到再次进入该分组（不能改 defaultOpen，Base UI 会在初始化后告警）。
  const [openState, setOpenState] = useState(inGroup)
  useEffect(() => {
    if (inGroup) setOpenState(true)
  }, [inGroup])

  if (collapsed) {
    return (
      <HoverMenu
        sideOffset={8}
        className={
          menuPanelMode
            ? 'w-auto overflow-visible bg-transparent p-0 shadow-none ring-0'
            : 'w-44 gap-0 bg-popover p-1.5 shadow-lg ring-1 ring-border rounded-sm'
        }
        trigger={
          <button
            type="button"
            aria-label={t(item.label)}
            className={cn(
              'flex h-12 w-full items-center justify-center outline-none',
              'transition-[background-color,color] duration-200 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:inset-ring-2 focus-visible:inset-ring-ring/50',
              'hover:bg-sidebar-accent',
              inGroup
                ? 'bg-primary/10 text-primary'
                : 'text-sidebar-foreground/72',
            )}
          >
            <Icon
              name={item.icon}
              className={cn(
                variant === 'primary' ? 'size-4.5' : 'size-4',
                inGroup && 'text-primary',
              )}
              strokeWidth={1.75}
            />
          </button>
        }
      >
        <FlyoutMenu items={item.children ?? []} title={item.label} />
      </HoverMenu>
    )
  }

  return (
    <Collapsible open={openState} onOpenChange={setOpenState}>
      <CollapsibleTrigger
        style={indent(depth)}
        className={cn(
          'group/trigger flex w-full items-center text-[13.5px] font-medium outline-none',
          variant === 'primary' ? 'min-h-12 gap-3 pr-3' : 'h-12 gap-2.5 pr-4',
          'transition-[background-color,color] duration-200 focus-visible:ring-2 focus-visible:ring-ring/50',
          'hover:bg-sidebar-accent',
          variant === 'primary'
            ? 'text-sidebar-foreground/72'
            : 'text-sidebar-foreground/90',
        )}
      >
        <Icon
          name={item.icon}
          className={cn(
            variant === 'primary' ? 'size-4.5' : 'size-4',
            'shrink-0 transition-colors duration-200',
            variant === 'primary'
              ? 'text-sidebar-foreground/60'
              : 'text-sidebar-foreground/90',
            'group-hover/trigger:text-sidebar-foreground',
          )}
          strokeWidth={1.75}
        />
        <span className="flex-1 truncate text-left">{t(item.label)}</span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0',
            'text-sidebar-foreground/45 transition-transform duration-200 group-data-[panel-open]/trigger:rotate-180',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up">
        <div className="mt-0.5 flex flex-col gap-0.5">
          <MenuItems
            items={item.children ?? []}
            variant={variant}
            depth={depth + 1}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
