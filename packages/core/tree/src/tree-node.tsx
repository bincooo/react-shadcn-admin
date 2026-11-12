import { ChevronRight, FileText, GripVertical, Minus, Plus } from 'lucide-react'
import type {
  CSSProperties,
  DragEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from 'react'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Spinner } from '@repo/ui/components/spinner'
import { cn } from '@repo/ui/lib/utils'
import type { ResolvedFieldNames } from './tree-utils'
import type {
  AntTreeNodeProps,
  BasicDataNode,
  EventDataNode,
  FlattenNode,
  TreeKey,
  TreeSemanticName,
  TreeShowLine,
} from './types'

export interface TreeNodeRenderProps<T extends BasicDataNode> {
  flattenNode: FlattenNode<T>
  fieldNames: ResolvedFieldNames
  expanded: boolean
  selected: boolean
  checked: boolean
  halfChecked: boolean
  loaded: boolean
  loading: boolean
  active: boolean
  treeDisabled: boolean
  treeCheckable: boolean
  treeSelectable: boolean
  blockNode: boolean
  showIcon: boolean
  showLine: TreeShowLine<T> | undefined
  directoryMode: boolean
  treeDraggable: boolean
  draggable: boolean
  dragIcon: ReactNode | false
  dragOver: boolean
  dragOverGapTop: boolean
  dragOverGapBottom: boolean
  matchedFilter: boolean
  itemHeight?: number
  setSize: number
  posInSet: number
  isFocused: boolean
  switcherIcon?: ReactNode | ((props: AntTreeNodeProps<T>) => ReactNode)
  switcherLoadingIcon?: ReactNode
  treeIcon?: ReactNode | ((props: AntTreeNodeProps<T>) => ReactNode)
  titleRender?: (nodeData: T) => ReactNode
  semanticClassNames: Partial<Record<TreeSemanticName, string>>
  semanticStyles: Partial<Record<TreeSemanticName, CSSProperties>>
  onExpand: (
    key: TreeKey,
    nativeEvent: globalThis.MouseEvent | globalThis.KeyboardEvent,
  ) => void
  onSelect: (
    key: TreeKey,
    nativeEvent: globalThis.MouseEvent | globalThis.KeyboardEvent,
  ) => void
  onCheck: (
    key: TreeKey,
    nativeEvent: globalThis.MouseEvent | globalThis.KeyboardEvent,
  ) => void
  onClick?: (e: MouseEvent<HTMLElement>, node: EventDataNode<T>) => void
  onDoubleClick?: (e: MouseEvent<HTMLElement>, node: EventDataNode<T>) => void
  onRightClick?: (info: {
    event: MouseEvent<HTMLElement>
    node: EventDataNode<T>
  }) => void
  onKeyDown: (
    e: KeyboardEvent<HTMLElement>,
    flattenNode: FlattenNode<T>,
  ) => void
  onDragStart: (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => void
  onDragEnter: (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => void
  onDragOver: (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => void
  onDragLeave: (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => void
  onDragEnd: (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => void
  onDrop: (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => void
}

export function buildEventDataNode<T extends BasicDataNode>(
  flattenNode: FlattenNode<T>,
  fieldNames: ResolvedFieldNames,
  flags: {
    expanded: boolean
    selected: boolean
    checked: boolean
    halfChecked: boolean
    loaded: boolean
    loading: boolean
    dragOver: boolean
    dragOverGapTop: boolean
    dragOverGapBottom: boolean
    active: boolean
    treeDisabled: boolean
    treeSelectable: boolean
  },
): EventDataNode<T> {
  const { data, key, pos, isLeaf } = flattenNode
  const nodeDisabled = flags.treeDisabled || Boolean(data[fieldNames.disabled])
  const disableCheckbox = Boolean(data[fieldNames.disableCheckbox])
  const selectable =
    data[fieldNames.selectable] !== undefined
      ? Boolean(data[fieldNames.selectable])
      : flags.treeSelectable
  const rawTitle = data[fieldNames.title]
  const title = typeof rawTitle === 'function' ? rawTitle(data) : rawTitle

  return {
    ...data,
    key,
    eventKey: key,
    pos,
    isLeaf,
    disabled: nodeDisabled,
    disableCheckbox,
    selectable,
    checkable: data[fieldNames.checkable] as boolean | undefined,
    title,
    data,
    expanded: flags.expanded,
    selected: flags.selected,
    checked: flags.checked,
    halfChecked: flags.halfChecked,
    loaded: flags.loaded,
    loading: flags.loading,
    dragOver: flags.dragOver,
    dragOverGapTop: flags.dragOverGapTop,
    dragOverGapBottom: flags.dragOverGapBottom,
    active: flags.active,
  }
}

export function TreeNodeRow<T extends BasicDataNode>({
  flattenNode,
  fieldNames,
  expanded,
  selected,
  checked,
  halfChecked,
  loaded,
  loading,
  active,
  treeDisabled,
  treeCheckable,
  treeSelectable,
  blockNode,
  showIcon,
  showLine,
  directoryMode,
  treeDraggable,
  draggable,
  dragIcon,
  dragOver,
  dragOverGapTop,
  dragOverGapBottom,
  matchedFilter,
  itemHeight,
  setSize,
  posInSet,
  isFocused,
  switcherIcon,
  switcherLoadingIcon,
  treeIcon,
  titleRender,
  semanticClassNames,
  semanticStyles,
  onExpand,
  onSelect,
  onCheck,
  onClick,
  onDoubleClick,
  onRightClick,
  onKeyDown,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}: TreeNodeRenderProps<T>) {
  const { key, data, level, isEnd, isLeaf } = flattenNode
  const nodeDisabled = treeDisabled || Boolean(data[fieldNames.disabled])
  const disableCheckbox = Boolean(data[fieldNames.disableCheckbox])
  const nodeCheckable =
    data[fieldNames.checkable] !== undefined
      ? Boolean(data[fieldNames.checkable])
      : treeCheckable
  const nodeSelectable =
    data[fieldNames.selectable] !== undefined
      ? Boolean(data[fieldNames.selectable])
      : treeSelectable

  const eventNode = buildEventDataNode(flattenNode, fieldNames, {
    expanded,
    selected,
    checked,
    halfChecked,
    loaded,
    loading,
    dragOver,
    dragOverGapTop,
    dragOverGapBottom,
    active,
    treeDisabled,
    treeSelectable,
  })

  const hasShowLine = Boolean(showLine)
  const leafLineConfig = typeof showLine === 'object' ? showLine : undefined
  const isLastInLevel = Boolean(isEnd[isEnd.length - 1])
  const anchorY = itemHeight !== undefined ? itemHeight / 2 : 14
  const headHeight = itemHeight ?? 28

  const renderSwitcher = () => {
    if (loading) {
      return (
        <span
          className={cn(
            'relative z-10 inline-flex w-6 shrink-0 items-start justify-center self-stretch text-primary',
            semanticClassNames.itemSwitcher,
          )}
          style={semanticStyles.itemSwitcher}
        >
          <span
            className="relative z-10 inline-flex w-6 items-center justify-center"
            style={{ height: headHeight }}
          >
            {switcherLoadingIcon ?? <Spinner className="size-3.5" />}
          </span>
        </span>
      )
    }

    if (isLeaf) {
      if (!hasShowLine) {
        return (
          <span
            className={cn(
              'inline-flex w-6 shrink-0 self-stretch',
              semanticClassNames.itemSwitcher,
            )}
            style={semanticStyles.itemSwitcher}
            aria-hidden
          />
        )
      }

      const showLeafIconOpt = leafLineConfig?.showLeafIcon
      if (showLeafIconOpt && showLeafIconOpt !== true) {
        const leafNodeIcon =
          typeof showLeafIconOpt === 'function'
            ? showLeafIconOpt(eventNode)
            : showLeafIconOpt
        return (
          <span
            className={cn(
              'relative inline-flex w-6 shrink-0 items-start justify-center self-stretch',
              semanticClassNames.itemSwitcher,
            )}
            style={semanticStyles.itemSwitcher}
            aria-hidden
          >
            <span
              className="relative z-10 inline-flex w-6 items-center justify-center"
              style={{ height: headHeight }}
            >
              {leafNodeIcon}
            </span>
          </span>
        )
      }

      if (showLeafIconOpt === true) {
        return (
          <span
            className={cn(
              'relative inline-flex w-6 shrink-0 items-start justify-center self-stretch',
              semanticClassNames.itemSwitcher,
            )}
            style={semanticStyles.itemSwitcher}
            aria-hidden
          >
            <span
              className="relative z-10 inline-flex w-6 items-center justify-center"
              style={{ height: headHeight }}
            >
              <FileText className="size-3.5 text-muted-foreground" />
            </span>
          </span>
        )
      }

      return (
        <span
          className={cn(
            'relative inline-flex w-6 shrink-0 self-stretch',
            semanticClassNames.itemSwitcher,
          )}
          style={semanticStyles.itemSwitcher}
          aria-hidden
        >
          {isLastInLevel ? (
            <span
              className="pointer-events-none absolute top-0 left-3 w-px bg-border"
              style={{ height: anchorY }}
            />
          ) : (
            <span className="pointer-events-none absolute inset-y-0 left-3 w-px bg-border" />
          )}
          <span
            className="pointer-events-none absolute left-3 h-px w-2.5 bg-border"
            style={{ top: anchorY }}
          />
        </span>
      )
    }

    const customSwitcher = data.switcherIcon ?? switcherIcon
    let switcherGraphic: ReactNode
    if (typeof customSwitcher === 'function') {
      switcherGraphic = customSwitcher(eventNode)
    } else if (customSwitcher !== undefined) {
      switcherGraphic = customSwitcher
    } else if (hasShowLine) {
      switcherGraphic = (
        <span
          className={cn(
            'inline-flex size-3.5 items-center justify-center rounded-[3px] border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary',
            directoryMode &&
              selected &&
              'border-primary-foreground/60 bg-primary text-primary-foreground',
          )}
        >
          {expanded ? (
            <Minus className="size-2.5" />
          ) : (
            <Plus className="size-2.5" />
          )}
        </span>
      )
    } else {
      switcherGraphic = (
        <ChevronRight
          className={cn(
            'size-3.5 transition-transform duration-150',
            expanded && 'rotate-90',
          )}
        />
      )
    }

    return (
      <button
        type="button"
        tabIndex={-1}
        aria-label={expanded ? 'Collapse node' : 'Expand node'}
        data-tree-switcher="true"
        onClick={(e) => {
          e.stopPropagation()
          onExpand(key, e.nativeEvent)
        }}
        className={cn(
          'relative z-10 inline-flex w-6 shrink-0 cursor-pointer items-start justify-center self-stretch rounded-sm text-muted-foreground transition-colors hover:text-foreground',
          directoryMode &&
            selected &&
            'text-primary-foreground hover:text-primary-foreground',
          semanticClassNames.itemSwitcher,
        )}
        style={semanticStyles.itemSwitcher}
      >
        <span
          className="relative z-10 inline-flex w-6 items-center justify-center"
          style={{ height: headHeight }}
        >
          {switcherGraphic}
        </span>
      </button>
    )
  }

  const renderNodeIcon = () => {
    if (!showIcon) return null
    const rawIcon = data.icon ?? treeIcon
    if (!rawIcon) return null
    const iconEl = typeof rawIcon === 'function' ? rawIcon(eventNode) : rawIcon
    if (!iconEl) return null
    return (
      <span
        className={cn(
          'inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-3.5',
          directoryMode && selected && 'text-primary-foreground',
          semanticClassNames.itemIcon,
        )}
        style={semanticStyles.itemIcon}
      >
        {iconEl}
      </span>
    )
  }

  const rawTitle = data[fieldNames.title]
  const titleNode = titleRender
    ? titleRender(data)
    : typeof rawTitle === 'function'
      ? rawTitle(data)
      : rawTitle

  const isFullRowInteractive = blockNode || directoryMode

  const handleRowClick = (e: MouseEvent<HTMLElement>) => {
    onClick?.(e, eventNode)
    const target = e.target as HTMLElement
    if (
      target.closest(
        '[data-tree-switcher], [data-tree-checkbox], [data-tree-drag]',
      )
    ) {
      return
    }
    if (!isFullRowInteractive && !target.closest('[data-tree-content]')) {
      return
    }
    if (!nodeDisabled) {
      onSelect(key, e.nativeEvent)
    }
  }

  const handleRowDoubleClick = (e: MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (
      target.closest(
        '[data-tree-switcher], [data-tree-checkbox], [data-tree-drag]',
      )
    ) {
      return
    }
    if (!isFullRowInteractive && !target.closest('[data-tree-content]')) {
      return
    }
    onDoubleClick?.(e, eventNode)
  }

  const handleContextMenu = (e: MouseEvent<HTMLElement>) => {
    if (!onRightClick) return
    const target = e.target as HTMLElement
    if (!isFullRowInteractive && !target.closest('[data-tree-content]')) {
      return
    }
    onRightClick({ event: e, node: eventNode })
  }

  const ariaChecked: boolean | 'mixed' | undefined = nodeCheckable
    ? halfChecked
      ? 'mixed'
      : checked
    : undefined

  return (
    <div
      role="treeitem"
      data-slot="tree-item"
      data-tree-key={String(key)}
      data-selected={selected || undefined}
      data-disabled={nodeDisabled || undefined}
      aria-level={level + 1}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-expanded={isLeaf ? undefined : expanded}
      aria-selected={nodeSelectable ? selected : undefined}
      aria-checked={ariaChecked}
      aria-disabled={nodeDisabled || undefined}
      tabIndex={isFocused ? 0 : -1}
      draggable={draggable && !nodeDisabled}
      onClick={handleRowClick}
      onDoubleClick={handleRowDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={(e) => onKeyDown(e, flattenNode)}
      onDragStart={(e) =>
        draggable && !nodeDisabled && onDragStart(e, eventNode)
      }
      onDragEnter={(e) => draggable && onDragEnter(e, eventNode)}
      onDragOver={(e) => draggable && onDragOver(e, eventNode)}
      onDragLeave={(e) => draggable && onDragLeave(e, eventNode)}
      onDragEnd={(e) => draggable && onDragEnd(e, eventNode)}
      onDrop={(e) => draggable && onDrop(e, eventNode)}
      className={cn(
        'group/tree-item relative flex items-start rounded-sm text-[13px] transition-colors outline-none select-none',
        itemHeight === undefined && 'min-h-7',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        directoryMode && [
          'cursor-pointer px-1',
          !selected &&
            !nodeDisabled &&
            'hover:bg-accent hover:text-accent-foreground',
          selected && 'bg-primary text-primary-foreground',
        ],
        !directoryMode &&
          isFullRowInteractive && [
            !selected && !nodeDisabled && 'hover:bg-accent/70',
            selected && 'bg-primary/10',
          ],
        dragOver && 'bg-primary/15 ring-1 ring-primary/50',
        nodeDisabled && 'cursor-not-allowed text-muted-foreground opacity-60',
        data.className,
        semanticClassNames.item,
      )}
      style={{
        ...(itemHeight !== undefined ? { height: itemHeight } : undefined),
        ...data.style,
        ...semanticStyles.item,
      }}
    >
      {/* Drop indicator lines (gap top / gap bottom) */}
      {dragOverGapTop && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 left-6 z-20 h-0.5 bg-primary before:absolute before:-top-[3px] before:-left-1 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-background"
        />
      )}
      {dragOverGapBottom && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-0 left-6 z-20 h-0.5 bg-primary before:absolute before:-top-[3px] before:-left-1 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-background"
        />
      )}

      {/* Drag handle */}
      {treeDraggable && dragIcon !== false && (
        <span
          data-tree-drag="true"
          aria-hidden
          className={cn(
            'inline-flex w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/70 active:cursor-grabbing',
            (!draggable || nodeDisabled) && 'invisible cursor-default',
          )}
          style={{ height: headHeight }}
        >
          {dragIcon ?? <GripVertical className="size-3.5" />}
        </span>
      )}

      {/* Ancestor indent guides */}
      {level > 0 && (
        <span className="inline-flex shrink-0 self-stretch" aria-hidden>
          {Array.from({ length: level }, (_, idx) => (
            <span
              key={idx}
              className="relative inline-block w-6 shrink-0 self-stretch"
            >
              {hasShowLine && !isEnd[idx] && (
                <span className="absolute inset-y-0 left-3 w-px bg-border" />
              )}
            </span>
          ))}
        </span>
      )}

      {/* Expand/collapse switcher */}
      {renderSwitcher()}

      {/* Checkbox (shadcn) */}
      {nodeCheckable && (
        <span
          data-tree-checkbox="true"
          className="mx-1.5 inline-flex shrink-0 items-center"
          style={{ height: headHeight }}
        >
          <Checkbox
            tabIndex={-1}
            disabled={nodeDisabled || disableCheckbox}
            checked={checked}
            indeterminate={!checked && halfChecked}
            onCheckedChange={() => {
              if (!nodeDisabled && !disableCheckbox) {
                onCheck(key, new globalThis.MouseEvent('click'))
              }
            }}
          />
        </span>
      )}

      {/* Icon + Title content wrapper */}
      <span
        data-tree-content="true"
        className={cn(
          'inline-flex min-w-0 items-center gap-1.5 rounded-sm px-1.5 transition-colors',
          isFullRowInteractive
            ? 'flex-1 py-1'
            : 'my-0.5 max-w-full min-h-6 py-0.5',
          !directoryMode &&
            !isFullRowInteractive && [
              !nodeDisabled &&
                nodeSelectable &&
                'cursor-pointer hover:bg-accent',
              selected && 'bg-primary/12 text-primary font-medium',
            ],
          !directoryMode &&
            isFullRowInteractive && [
              !nodeDisabled && nodeSelectable && 'cursor-pointer',
              selected && 'text-primary font-medium',
            ],
          matchedFilter && !selected && 'font-medium text-destructive',
          matchedFilter &&
            directoryMode &&
            selected &&
            'underline underline-offset-2',
        )}
        style={isFullRowInteractive ? { minHeight: headHeight } : undefined}
      >
        {renderNodeIcon()}
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            semanticClassNames.itemTitle,
          )}
          style={semanticStyles.itemTitle}
        >
          {titleNode}
        </span>
      </span>
    </div>
  )
}
