import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { Icon } from '@/components/common/icon'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme'
import { containsMenuPath, type MenuNode } from './menu-model'
import {
  ACTIVE_ITEM,
  FLYOUT_INACTIVE_ITEM,
  FLYOUT_POPOVER,
  FLYOUT_ROW,
  FLYOUT_TEXT_55,
  MENU_FOCUS_SIMPLE,
} from './menu-styles'
import { MenuItemLink } from './menu-item'
import { HoverMenu } from './hover-menu'
import { CatalogMenuPanel } from './catalog-menu-panel'

/**
 * 收起态浮层里的菜单列表：递归渲染任意层级。
 * 叶子 → 链接；有子菜单 → 再嵌一层悬浮浮层。
 * 浮层内各项统一对齐，不按层级缩进（层级由弹出的下一层浮层体现）。
 */
export function FlyoutMenu({
  items,
  title,
}: {
  items: MenuNode[]
  /** 面板标题来自触发的父级菜单 */
  title?: string
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const menuPanelMode = useThemeStore((state) => state.menuPanelMode)

  if (menuPanelMode) {
    return <CatalogMenuPanel items={items} titleKey={title} />
  }

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => {
        if (!item.children?.length) {
          return <MenuItemLink key={item.key} item={item} variant="flyout" />
        }
        const active = containsMenuPath(item, location.pathname)
        return (
          <HoverMenu
            key={item.key}
            // 面板内边距 p-1.5（6px）+ 4px 间隙：偏移必须跨过面板边缘，
            // 否则子面板压在父面板上，边框阴影叠成一团
            sideOffset={10}
            className={FLYOUT_POPOVER}
            trigger={
              <button
                type="button"
                className={cn(
                  'group flex w-full items-center text-left outline-none',
                  MENU_FOCUS_SIMPLE,
                  FLYOUT_ROW,
                  active ? ACTIVE_ITEM : FLYOUT_INACTIVE_ITEM,
                )}
              >
                <Icon
                  name={item.icon}
                  className={cn(
                    'size-4 shrink-0',
                    active ? 'text-primary' : FLYOUT_TEXT_55,
                  )}
                  strokeWidth={1.75}
                />
                <span className="flex-1 truncate">{t(item.label)}</span>
                <ChevronDown className="size-3 shrink-0 -rotate-90 opacity-60" />
              </button>
            }
          >
            <FlyoutMenu items={item.children} title={item.label} />
          </HoverMenu>
        )
      })}
    </div>
  )
}
