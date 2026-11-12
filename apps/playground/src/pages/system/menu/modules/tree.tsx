import { useMemo, useState, type ComponentType } from 'react'
import { AppWindow, Check, Folder, GripVertical, KeyRound } from 'lucide-react'
import { Badge } from '@repo/ui/components/badge'
import {
  collectAllExpandableKeys,
  mapTree,
  Tree,
  type TreeFieldNames,
  type TreeKey,
} from '@repo/tree'
import { Icon } from '@/components/common/icon'
import type { Menu } from '@/api/system/menu'
import { cn } from '@/lib/utils'
import { MENU_TYPE_LABELS, menuNameLabel } from './model'

/**
 * 图标名预览：与侧边栏走同一个 `Icon`，所见即所得。
 * 空名不渲染；无法识别的名字在两边都回退成同一个图标。
 */
export function MenuIconPreview({
  name,
  className,
  strokeWidth,
}: {
  name: string
  className?: string
  strokeWidth?: number
}) {
  const trimmed = name.trim()
  if (!trimmed) return null
  return <Icon name={trimmed} className={className} strokeWidth={strokeWidth} />
}

const TYPE_VARIANTS: Record<
  Menu['menuType'],
  'default' | 'secondary' | 'outline'
> = {
  DIRECTORY: 'secondary',
  MENU: 'default',
  BUTTON: 'outline',
}

export function MenuTypeBadge({ type }: { type: Menu['menuType'] }) {
  return (
    <Badge variant={TYPE_VARIANTS[type]} className="text-[11px]">
      {MENU_TYPE_LABELS[type]}
    </Badge>
  )
}

/** 菜单类型 → 图标；缺少自定义图标时作为回退 */
const TYPE_ICONS: Record<
  Exclude<Menu['menuType'], 'BUTTON'>,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  DIRECTORY: Folder,
  MENU: AppWindow,
}

/** 按类型渲染菜单图标：左栏树与父级选择器共用 */
export function MenuTypeIcon({
  type,
  className,
  strokeWidth,
}: {
  type: Exclude<Menu['menuType'], 'BUTTON'>
  className?: string
  strokeWidth?: number
}) {
  const Icon = TYPE_ICONS[type]
  return <Icon className={className} strokeWidth={strokeWidth} />
}

/** 菜单树节点图标：去框极简纯图标，优先使用菜单自身 Lucide 图标，缺失时回退类型图标 */
export function MenuNodeIcon({
  menu,
  selected,
  size = 'sm',
}: {
  menu: Pick<Menu, 'imageIcon' | 'status'> & {
    menuType: Exclude<Menu['menuType'], 'BUTTON'>
  }
  selected?: boolean
  size?: 'sm' | 'md'
}) {
  const disabled = menu.status === 'DISABLED'
  const iconName = menu.imageIcon?.trim()
  const isDirectory = menu.menuType === 'DIRECTORY'
  const isMd = size === 'md'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-colors',
        isMd ? 'size-6' : 'size-4.5',
        disabled && 'text-muted-foreground/55',
        !disabled && selected && 'text-primary',
        !disabled &&
          !selected &&
          isDirectory &&
          'text-amber-600 dark:text-amber-400',
        !disabled &&
          !selected &&
          !isDirectory &&
          'text-sky-600/85 dark:text-sky-400/85',
      )}
    >
      {iconName ? (
        <MenuIconPreview
          name={iconName}
          className={isMd ? 'size-4.5' : 'size-4'}
          strokeWidth={1.75}
        />
      ) : (
        <MenuTypeIcon
          type={menu.menuType}
          className={isMd ? 'size-4.5' : 'size-4'}
          strokeWidth={1.75}
        />
      )}
    </span>
  )
}

/** 树节点：剥掉按钮权限后只剩目录与页面，并保留按钮权限数量用于节点徽标展示 */
type TreeMenu = Omit<Menu, 'menuType' | 'children'> & {
  menuType: Exclude<Menu['menuType'], 'BUTTON'>
  buttonCount: number
  children?: TreeMenu[]
}

const MENU_FIELD_NAMES: TreeFieldNames = {
  key: 'id',
  title: 'menuName',
  children: 'children',
}

/**
 * 剥掉 BUTTON 节点：树只承担「选目录/选页面」，按钮权限在右下表格维护，
 * 放进树里只会拉长导航结构（按钮可能挂在菜单或目录下，递归过滤并统计直属按钮数）。
 */
function stripButtons(nodes: Menu[]): TreeMenu[] {
  return mapTree(
    nodes,
    (node, children) => {
      if (!isBranchMenu(node)) return null
      const buttonCount = (node.children ?? []).filter(
        (child) => child.menuType === 'BUTTON',
      ).length
      return {
        ...node,
        buttonCount,
        children: children.length > 0 ? children : undefined,
      }
    },
    (node) => node.children,
  )
}

/** 目录与页面是树中的可导航节点，按钮权限只在右下表格维护 */
function isBranchMenu(
  node: Menu,
): node is Menu & { menuType: TreeMenu['menuType'] } {
  return node.menuType !== 'BUTTON'
}

/**
 * 可折叠选择树（左栏与父级弹层共用）：只显示目录与页面
 * （按钮权限节点由 stripButtons 剥除）。层级连接线与展开/收起由 antd 风格 Tree 负责，
 * 默认使用 52px 双行舒适节点展示图标、名称、路由/编码副文本及状态/权限/类型徽标；
 * 下拉父级选择器可通过 `compact` 切换为 28px 紧凑单行模式。
 */
export function MenusTree({
  menus,
  selectedId,
  onSelect,
  ariaLabel,
  showButtonCount = true,
  showSelectedCheck = false,
  compact = false,
  draggable = false,
  onReorder,
}: {
  menus: Menu[]
  selectedId: string | null
  onSelect: (menu: Menu) => void
  ariaLabel?: string
  showButtonCount?: boolean
  showSelectedCheck?: boolean
  compact?: boolean
  draggable?: boolean
  onReorder?: (dragId: string, targetId: string, position: -1 | 0 | 1) => void
}) {
  const rows = useMemo(() => stripButtons(menus), [menus])
  const [collapsedSet, setCollapsedSet] = useState<Set<TreeKey>>(
    () => new Set(),
  )

  const allExpandableKeys = useMemo(
    () =>
      collectAllExpandableKeys(rows, {
        key: 'id',
        title: 'menuName',
        children: 'children',
        disabled: 'disabled',
        selectable: 'selectable',
        disableCheckbox: 'disableCheckbox',
        checkable: 'checkable',
        isLeaf: 'isLeaf',
      }),
    [rows],
  )

  const expandedKeys = useMemo(
    () => allExpandableKeys.filter((k) => !collapsedSet.has(k)),
    [allExpandableKeys, collapsedSet],
  )

  return (
    <Tree<TreeMenu>
      treeData={rows}
      fieldNames={MENU_FIELD_NAMES}
      blockNode
      showLine={{ showLeafIcon: false }}
      showIcon
      classNames={{
        item: compact
          ? 'rounded-none pl-1.5 pr-2.5 data-[selected=true]:bg-primary/10 [&_[data-tree-content]]:rounded-none'
          : 'min-h-13 items-center rounded-none pl-2 pr-3 data-[selected=true]:bg-primary/10 [&_[data-tree-content]]:min-h-13 [&_[data-tree-content]]:rounded-none',
        itemIcon: compact
          ? 'size-4.5 [&_svg]:size-4'
          : 'size-6 mr-1 [&_svg]:size-4.5',
        itemSwitcher: compact
          ? undefined
          : 'items-center [&:not([data-tree-switcher])>[style*="height"]]:!h-1/2 [&:not([data-tree-switcher])>:nth-child(2)]:!top-1/2',
        itemTitle: compact ? undefined : 'whitespace-normal',
      }}
      icon={(nodeProps) => (
        <MenuNodeIcon
          menu={nodeProps.data}
          selected={nodeProps.selected}
          size={compact ? 'sm' : 'md'}
        />
      )}
      selectedKeys={selectedId ? [selectedId] : []}
      expandedKeys={expandedKeys}
      draggable={
        draggable && !compact
          ? {
              icon: (
                <GripVertical className="size-3.5 text-muted-foreground/45 transition-colors group-hover/tree-item:text-muted-foreground" />
              ),
            }
          : false
      }
      allowDrop={({ dropNode, dropPosition }) => {
        if (dropPosition === 0) return dropNode.menuType === 'DIRECTORY'
        return true
      }}
      onDrop={(info) => {
        if (!onReorder) return
        const dropPosParts = info.node.pos.split('-')
        const dropIndex = Number(dropPosParts[dropPosParts.length - 1])
        const position: -1 | 0 | 1 = !info.dropToGap
          ? 0
          : info.dropPosition < dropIndex
            ? -1
            : 1
        if (position === 0) {
          setCollapsedSet((prev) => {
            if (!prev.has(info.node.key)) return prev
            const next = new Set(prev)
            next.delete(info.node.key)
            return next
          })
        }
        onReorder(String(info.dragNode.key), String(info.node.key), position)
      }}
      onExpand={(_keys, { node, expanded }) => {
        setCollapsedSet((prev) => {
          const next = new Set(prev)
          if (expanded) next.delete(node.key)
          else next.add(node.key)
          return next
        })
      }}
      onSelect={(_keys, { node }) => onSelect(node.data)}
      ariaLabel={ariaLabel ?? '菜单树'}
      titleRender={(menu) => {
        const isSelected = menu.id === selectedId
        const isDirectory = menu.menuType === 'DIRECTORY'
        const isDisabled = menu.status === 'DISABLED'

        const badges = (
          <span className="flex shrink-0 items-center gap-1">
            {isDisabled && (
              <span className="inline-flex h-4.5 items-center rounded-md border border-border/70 bg-muted/70 px-1.5 text-[10px] font-medium text-muted-foreground">
                {'停用'}
              </span>
            )}
            {showButtonCount && !isDirectory && menu.buttonCount > 0 && (
              <span
                title={`按钮权限: ${menu.buttonCount}`}
                className="inline-flex h-4.5 items-center gap-0.5 rounded-md border border-primary/15 bg-primary/8 px-1.5 text-[10px] font-medium text-primary/85 tabular-nums"
              >
                <KeyRound className="size-2.5 shrink-0" />
                {menu.buttonCount}
              </span>
            )}
            <span
              className={cn(
                'inline-flex h-4.5 items-center rounded-md border px-1.5 text-[10px] font-medium',
                isDirectory
                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : isSelected
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-border/70 bg-muted/60 text-muted-foreground',
              )}
            >
              {isDirectory ? '目录' : '菜单'}
            </span>
            {showSelectedCheck && isSelected && (
              <Check className="size-3.5 shrink-0 text-primary" />
            )}
          </span>
        )

        if (compact) {
          return (
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  isDirectory && 'font-medium',
                  isSelected && 'font-medium text-primary',
                  isDisabled && 'text-muted-foreground',
                )}
              >
                {menuNameLabel(menu.menuName)}
              </span>
              {badges}
            </span>
          )
        }

        const subLabel = menu.menuUrl || menu.menuCode

        return (
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 whitespace-normal">
            <span className="flex min-w-0 items-center justify-between gap-2">
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-[13px] leading-5 font-medium',
                  isSelected && 'font-semibold text-primary',
                  isDisabled && 'text-muted-foreground',
                )}
              >
                {menuNameLabel(menu.menuName)}
              </span>
              {badges}
            </span>
            <span
              className={cn(
                'truncate font-mono text-[11px] leading-4',
                isSelected ? 'text-primary/75' : 'text-muted-foreground/80',
                isDisabled && 'text-muted-foreground/60',
              )}
            >
              {subLabel}
            </span>
          </span>
        )
      }}
    />
  )
}
