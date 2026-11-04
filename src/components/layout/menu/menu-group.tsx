import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Icon } from '@/components/common/icon'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme'
import { containsMenuPath, type MenuNode } from './menu-model'
import { FlyoutMenu } from './flyout-menu'
import { HoverMenu } from './hover-menu'
import { MenuItemLink, type MenuVariant } from './menu-item'
import {
  CHEVRON,
  FLYOUT_POPOVER,
  MENU_PANEL_POPOVER,
  MENU_FOCUS,
  MENU_FOCUS_SIMPLE,
  MENU_VARIANTS,
  TEXT_72,
  TEXT_90,
  indent,
} from './menu-styles'

const VARIANT = {
  primary: {
    trigger: 'min-h-12 gap-3 pr-3',
    ...MENU_VARIANTS.primary,
    text: TEXT_72,
  },
  secondary: {
    trigger: 'h-12 gap-2.5 pr-4',
    ...MENU_VARIANTS.secondary,
    text: TEXT_90,
  },
} as const

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
  const styles = VARIANT[variant]
  const inGroup = containsMenuPath(item, location.pathname)

  if (collapsed) {
    return (
      <HoverMenu
        sideOffset={8}
        className={menuPanelMode ? MENU_PANEL_POPOVER : FLYOUT_POPOVER}
        trigger={
          <button
            type="button"
            aria-label={t(item.label)}
            className={cn(
              'flex h-12 w-full items-center justify-center outline-none',
              MENU_FOCUS,
              'hover:bg-sidebar-accent',
              inGroup ? 'bg-primary/10 text-primary' : TEXT_72,
            )}
          >
            <Icon
              name={item.icon}
              className={cn(styles.icon, inGroup && 'text-primary')}
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
    <Collapsible defaultOpen={inGroup}>
      <CollapsibleTrigger
        style={indent(depth)}
        className={cn(
          'group/trigger flex w-full items-center text-[13.5px] font-medium outline-none',
          styles.trigger,
          MENU_FOCUS_SIMPLE,
          'hover:bg-sidebar-accent',
          styles.text,
        )}
      >
        <Icon
          name={item.icon}
          className={cn(
            styles.icon,
            'shrink-0 transition-colors duration-200',
            styles.inactiveIcon,
            'group-hover/trigger:text-sidebar-foreground',
          )}
          strokeWidth={1.75}
        />
        <span className="flex-1 truncate text-left">{t(item.label)}</span>
        <ChevronDown className={cn('size-3.5 shrink-0', CHEVRON)} />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
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
