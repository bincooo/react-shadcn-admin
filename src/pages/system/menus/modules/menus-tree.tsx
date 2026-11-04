import { useMemo, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { AppWindow, Check, Folder } from 'lucide-react'
import { Tree } from '@/components/core/tree'
import type { SystemMenu } from '@/api/system/menu'
import { cn } from '@/lib/utils'

/** 菜单类型 → 图标；类型语义固定，不跟随菜单自身 imageIcon */
const TYPE_ICONS: Record<
  Exclude<SystemMenu['menuType'], 'BUTTON'>,
  ComponentType<{ className?: string }>
> = {
  DIRECTORY: Folder,
  MENU: AppWindow,
}

/** 按类型渲染菜单图标：左栏树与父级选择器共用 */
export function MenuTypeIcon({
  type,
  className,
}: {
  type: Exclude<SystemMenu['menuType'], 'BUTTON'>
  className?: string
}) {
  const Icon = TYPE_ICONS[type]
  return <Icon className={className} />
}

/** 树节点：剥掉按钮权限后只剩目录与页面 */
type TreeMenu = Omit<SystemMenu, 'menuType' | 'children'> & {
  menuType: Exclude<SystemMenu['menuType'], 'BUTTON'>
  children?: TreeMenu[]
}

/**
 * 剥掉 BUTTON 节点：树只承担「选目录/选页面」，按钮权限在右下表格维护，
 * 放进树里只会拉长导航结构（按钮可能挂在菜单或目录下，递归过滤）。
 */
function stripButtons(nodes: SystemMenu[]): TreeMenu[] {
  return nodes
    .filter(
      (node): node is SystemMenu & { menuType: TreeMenu['menuType'] } =>
        node.menuType !== 'BUTTON',
    )
    .map((node) => ({
      ...node,
      children: node.children?.length ? stripButtons(node.children) : undefined,
    }))
}

/**
 * 可折叠选择树（左栏与父级弹层共用）：只显示目录与页面
 * （按钮权限节点由 stripButtons 剥除）。层级连接线与展开/收起由通用树负责，
 * 这里只渲染「类型图标 + i18n 名称 + 选中对勾」。
 */
export function MenusTree({
  menus,
  selectedCode,
  onSelect,
  ariaLabel,
}: {
  menus: SystemMenu[]
  selectedCode: string | null
  onSelect: (menu: SystemMenu) => void
  ariaLabel?: string
}) {
  const { t } = useTranslation()
  const rows = useMemo(() => stripButtons(menus), [menus])

  return (
    <Tree
      nodes={rows}
      getKey={(menu) => menu.menuCode}
      getChildren={(menu) => menu.children}
      getLabel={(menu) => t(menu.menuName)}
      isSelected={(menu) => menu.menuCode === selectedCode}
      ariaLabel={ariaLabel ?? t('system.menu.treeTitleLabel')}
      renderNode={(menu) => (
        <button
          type="button"
          role="treeitem"
          aria-selected={menu.menuCode === selectedCode}
          onClick={() => onSelect(menu)}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-0.5 text-left text-[13px]',
            // 目录承担结构层级用 medium，页面为普通体；选中态同色不同字重仍可辨
            menu.menuType === 'DIRECTORY' && 'font-medium',
            menu.menuCode === selectedCode && 'font-medium text-primary',
            menu.status === 'DISABLED' && 'text-muted-foreground',
          )}
        >
          <MenuTypeIcon type={menu.menuType} className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            {/* menuName 兼容 i18n 词条 key：缺失词条时 i18next 原样返回 key */}
            {t(menu.menuName)}
          </span>
          {menu.menuCode === selectedCode && (
            <Check className="size-3.5 shrink-0" />
          )}
        </button>
      )}
    />
  )
}
