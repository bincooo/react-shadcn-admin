import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** 节点渲染上下文：内容插槽自行决定单选、复选等交互 */
export interface TreeRenderState {
  depth: number
  expanded: boolean
  hasChildren: boolean
  /** 展开/收起当前节点 */
  toggle: () => void
}

export interface TreeProps<T> {
  nodes: readonly T[]
  getKey: (node: T) => string
  getChildren?: (node: T) => readonly T[] | null | undefined
  /** 禁用节点：仅做弱化样式，是否可交互由内容插槽决定 */
  isDisabled?: (node: T) => boolean
  /** 选中节点：整行浅主色底，文字样式由内容插槽决定 */
  isSelected?: (node: T) => boolean
  /** 节点内容；组件负责连接线、展开箭头、行容器与选中底色 */
  renderNode: (node: T, state: TreeRenderState) => ReactNode
  /** 展开箭头的可访问名称（拼接「展开/收起」） */
  getLabel?: (node: T) => string
  /** 顶层前置行，如「无 / 未绑定」 */
  leading?: ReactNode
  ariaLabel?: string
  /** 默认折叠的节点 key；缺省全展开 */
  defaultCollapsedIds?: ReadonlySet<string>
}

interface TreeLevelProps<T> {
  nodes: readonly T[]
  depth: number
  getKey: (node: T) => string
  getChildren?: (node: T) => readonly T[] | null | undefined
  isDisabled?: (node: T) => boolean
  isSelected?: (node: T) => boolean
  renderNode: (node: T, state: TreeRenderState) => ReactNode
  getLabel?: (node: T) => string
  collapsedState: ReadonlySet<string>
  onToggle: (key: string) => void
  /** 仅根层渲染 */
  leading?: ReactNode
  ariaLabel?: string
}

/**
 * 通用树的一层：连接线与角色管理「菜单授权」面板同一套几何——
 * 竖线落在上一级展开图标中心（行 px-1 4px + 图标列半宽 10px = 14px），
 * 同级末项竖线止于本行中线并折出横向支线。
 */
function TreeLevel<T>({
  nodes,
  depth,
  getKey,
  getChildren,
  isDisabled,
  isSelected,
  renderNode,
  getLabel,
  collapsedState,
  onToggle,
  leading,
  ariaLabel,
}: TreeLevelProps<T>) {
  const { t } = useTranslation()

  return (
    <ul
      role={depth === 0 ? 'tree' : 'group'}
      aria-label={depth === 0 ? ariaLabel : undefined}
      // 每级缩进 26px：子级容器 ml-3.5(14px) + pl-3(12px)
      className={depth === 0 ? undefined : 'ml-3.5 pl-3'}
    >
      {depth === 0 && leading}
      {nodes.map((node, index) => {
        const key = getKey(node)
        const children = getChildren?.(node) ?? null
        const hasChildren = !!children?.length
        const expanded = hasChildren && !collapsedState.has(key)
        const selected = isSelected?.(node) ?? false
        const disabled = isDisabled?.(node) ?? false
        const isLast = index === nodes.length - 1
        const label = getLabel?.(node) ?? key
        return (
          <li
            key={key}
            role="none"
            className={cn(
              'relative isolate',
              // 连接线画在 li 上：li 高度含子树，展开的兄长子级不会截断外层竖线
              depth > 0 &&
                cn(
                  'before:absolute before:top-0 before:left-[-12px] before:-z-10 before:w-px before:bg-border/60',
                  // 末项竖线止于本行中线（行高 28px 的一半），并折出横向支线
                  isLast
                    ? 'before:h-3.5 after:absolute after:top-3.5 after:left-[-12px] after:-z-10 after:h-px after:w-[5px] after:bg-border/60'
                    : 'before:bottom-0',
                ),
            )}
          >
            <div className="relative isolate">
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-sm px-1 py-1 transition-colors hover:bg-muted/40',
                  selected && 'bg-primary/10',
                )}
              >
                {hasChildren ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-label={t(
                      expanded ? 'tree.collapseNode' : 'tree.expandNode',
                      { label },
                    )}
                    aria-expanded={expanded}
                    onClick={() => onToggle(key)}
                  >
                    <ChevronRight
                      className={cn(
                        'size-3.5 transition-transform',
                        expanded && 'rotate-90',
                      )}
                    />
                  </Button>
                ) : (
                  // 叶子占同宽空槽，保证同层内容与展开图标对齐
                  <span className="size-5 shrink-0" aria-hidden />
                )}
                <div
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2',
                    disabled && 'text-muted-foreground',
                  )}
                >
                  {renderNode(node, {
                    depth,
                    expanded,
                    hasChildren,
                    toggle: () => onToggle(key),
                  })}
                </div>
              </div>
              {expanded && (
                // 从本行展开图标中心向下连到子级列表，保证任意层级竖向贯通
                <span
                  aria-hidden
                  className="absolute top-1/2 bottom-0 left-[14px] -z-10 w-px bg-border/60"
                />
              )}
            </div>
            {expanded && (
              <TreeLevel
                nodes={children ?? []}
                depth={depth + 1}
                getKey={getKey}
                getChildren={getChildren}
                isDisabled={isDisabled}
                isSelected={isSelected}
                renderNode={renderNode}
                getLabel={getLabel}
                collapsedState={collapsedState}
                onToggle={onToggle}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * 通用树：默认全展开，点箭头收起/展开；节点内容由 renderNode 插槽决定。
 *
 * 组件只负责结构（层级、连接线、展开状态、行视觉与 ARIA），
 * 单选、复选、图标等业务表现由调用方在内容插槽中实现。
 */
export function Tree<T>({
  nodes,
  getKey,
  getChildren,
  isDisabled,
  isSelected,
  renderNode,
  getLabel,
  leading,
  ariaLabel,
  defaultCollapsedIds,
}: TreeProps<T>) {
  const [collapsedState, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(defaultCollapsedIds ?? []),
  )

  const onToggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <TreeLevel
      nodes={nodes}
      depth={0}
      getKey={getKey}
      getChildren={getChildren}
      isDisabled={isDisabled}
      isSelected={isSelected}
      renderNode={renderNode}
      getLabel={getLabel}
      collapsedState={collapsedState}
      onToggle={onToggle}
      leading={leading}
      ariaLabel={ariaLabel}
    />
  )
}
