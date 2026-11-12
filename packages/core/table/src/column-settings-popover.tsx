import type React from 'react'
import { Fragment, useMemo, useRef, useState } from 'react'
import type {
  ColumnPinningState,
  Table,
  VisibilityState,
} from '@tanstack/react-table'
import {
  ChevronRight,
  Folder,
  FolderPlus,
  GripVertical,
  ListChecks,
  Pencil,
  Pin,
  RotateCcw,
  Settings2,
  Ungroup,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'
import { extractTextFromNode, resolveColumnId } from './compile-columns'
import { useTableLocale } from './locale'
import type {
  TanStackColumnMeta,
  TanStackColumnsType,
  TanStackColumnType,
} from './types'

/** Virtual parent key of the root level (top-level columns & groups) */
const ROOT_KEY = '__column_settings_root__'

interface SettingsNode {
  /** Resolved column id (identical to the id used by the compiled table columns) */
  id: string
  /** Plain text label (possibly user-renamed) */
  title: string
  kind: 'group' | 'leaf'
  children: SettingsNode[]
  /** Ids of every descendant leaf (self included for leaves) */
  leafIds: string[]
  /** Original declarative column definition (kept by reference) */
  raw: TanStackColumnType<any>
}

/** parent id (or ROOT_KEY) -> child ids + id -> parent id, derived from the draft tree */
const buildParentInfo = (tree: SettingsNode[]) => {
  const parentOf = new Map<string, string>()
  const walk = (nodes: SettingsNode[], parentKey: string) => {
    for (const node of nodes) {
      parentOf.set(node.id, parentKey)
      if (node.kind === 'group') walk(node.children, node.id)
    }
  }
  walk(tree, ROOT_KEY)
  return parentOf
}

interface NormalizedColumns {
  topNodes: SettingsNode[]
  byId: Map<string, SettingsNode>
  allLeafIds: string[]
  userLeafSet: Set<string>
}

/**
 * Normalize the declarative `columns` prop into the tree rendered by the panel.
 * The tree mirrors `columns` 1:1: same order, same group nesting, same ids —
 * so "列顺序和分组和 columns 保持一致" (unless the user edited the view).
 */
function normalizeColumns<TData>(
  columns: TanStackColumnsType<TData>,
): NormalizedColumns {
  const byId = new Map<string, SettingsNode>()

  const build = (
    col: TanStackColumnType<TData>,
    pathPrefix: string,
    index: number,
  ): SettingsNode => {
    const id = resolveColumnId(col, pathPrefix, index)
    const title = col.titleText || extractTextFromNode(col.title, id)
    // Keep the exact same "group" rule as the column compiler.
    const isGroup = Array.isArray(col.children) && col.children.length > 0
    const node: SettingsNode = {
      id,
      title,
      kind: isGroup ? 'group' : 'leaf',
      children: [],
      leafIds: [],
      raw: col,
    }
    byId.set(id, node)
    if (isGroup) {
      node.children = (col.children ?? []).map((child, i) =>
        build(child, id, i),
      )
      node.leafIds = node.children.flatMap((c) => c.leafIds)
    } else {
      node.leafIds = [id]
    }
    return node
  }

  const topNodes = columns.map((col, i) => build(col, 'root', i))
  const allLeafIds = topNodes.flatMap((n) => n.leafIds)
  return {
    topNodes,
    byId,
    allLeafIds,
    userLeafSet: new Set(allLeafIds),
  }
}

/** Deep clone the tree; `raw` references are kept, `leafIds` recomputed */
const cloneTree = (nodes: SettingsNode[]): SettingsNode[] =>
  nodes.map((n) => {
    if (n.kind !== 'group') return { ...n, children: [], leafIds: [n.id] }
    const children = cloneTree(n.children)
    return { ...n, children, leafIds: children.flatMap((c) => c.leafIds) }
  })

/** Recompute every group's leafIds (bottom-up) after structural mutations */
const recomputeLeafIds = (nodes: SettingsNode[]): SettingsNode[] =>
  nodes.map((n) => {
    if (n.kind !== 'group') return n
    const children = recomputeLeafIds(n.children)
    return { ...n, children, leafIds: children.flatMap((c) => c.leafIds) }
  })

/** Remove a node by id (mutates the given tree!) */
const removeNodeById = (
  nodes: SettingsNode[],
  id: string,
): SettingsNode | null => {
  const i = nodes.findIndex((n) => n.id === id)
  if (i >= 0) return nodes.splice(i, 1)[0]
  for (const n of nodes) {
    if (n.kind === 'group') {
      const removed = removeNodeById(n.children, id)
      if (removed) return removed
    }
  }
  return null
}

/** Find the array (inside the tree) that directly contains `id` */
const findListOf = (
  nodes: SettingsNode[],
  id: string,
): SettingsNode[] | null => {
  if (nodes.some((n) => n.id === id)) return nodes
  for (const n of nodes) {
    if (n.kind === 'group') {
      const found = findListOf(n.children, id)
      if (found) return found
    }
  }
  return null
}

/** Find a node by id */
const findNodeById = (
  nodes: SettingsNode[],
  id: string,
): SettingsNode | null => {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.kind === 'group') {
      const found = findNodeById(n.children, id)
      if (found) return found
    }
  }
  return null
}

/** Ids of a node + all its descendants */
const collectSubtreeIds = (node: SettingsNode): Set<string> => {
  const set = new Set<string>([node.id])
  for (const child of node.children) {
    for (const id of collectSubtreeIds(child)) set.add(id)
  }
  return set
}

/** Canonical projection used to detect "unchanged vs. the declared `columns`" */
const projectTree = (nodes: SettingsNode[]): unknown =>
  nodes.map((n) => ({
    id: n.id,
    title: n.title,
    children: n.kind === 'group' ? projectTree(n.children) : [],
  }))

/** Emit a `TanStackColumnsType` from the (draft) tree — keeps empty user groups */
const emitColumns = <TData,>(
  tree: SettingsNode[],
): TanStackColumnsType<TData> => {
  const build = (nodes: SettingsNode[]): TanStackColumnsType<TData> =>
    nodes.map((node) => {
      if (node.kind === 'group') {
        return {
          ...(node.raw as TanStackColumnType<TData>),
          title: node.title,
          children: build(node.children),
        }
      }
      return node.raw as TanStackColumnType<TData>
    })
  return build(tree)
}

interface DraftState {
  tree: SettingsNode[]
  visibility: Record<string, boolean>
  pinning: Record<string, 'left' | 'right'>
}

type DropZone = 'before' | 'after' | 'inside'

interface ColumnSettingsPopoverProps<TData> {
  table: Table<TData>
  /** Declarative columns as passed by the app — the baseline for "恢复默认" */
  columns: TanStackColumnsType<TData>
  /** 列模板的结构签名；引用变化不重建，结构变化才重建 */
  columnsSignature: string
  /** Currently applied columns (declaration or the confirmed view override) */
  appliedColumns?: TanStackColumnsType<TData>
  /** Factory defaults (same values the table was initialized with) */
  defaultVisibility: VisibilityState
  defaultPinning: ColumnPinningState
  /** Apply a confirmed view override (`null` = back to the declared columns) */
  onApplyView?: (view: TanStackColumnsType<TData> | null) => void
  /** Immediate full reset: widths + pinning + visibility + order + view override */
  onResetAll: () => void
  extra?: React.ReactNode
}

/**
 * Column Settings Popover (「列配置」):
 * - Mirrors the declarative `columns` tree (order + grouping) by default
 * - Supports user-defined groups: 新建分组 / 编辑分组 (rename) / 分解分组 (dissolve),
 * dragging a column into a group row, drag-to-reorder within the same level
 * - Staged editing: 「确认」applies visibility / pinning / order / grouping to the
 *   table (via a column-tree override); 「取消」discards the draft entirely
 * - 「恢复默认」immediately restores the declared `columns` view
 */
export function ColumnSettingsPopover<TData>({
  table,
  columns,
  columnsSignature,
  appliedColumns,
  defaultVisibility,
  defaultPinning,
  onApplyView,
  onResetAll,
}: ColumnSettingsPopoverProps<TData>) {
  const tableLocale = useTableLocale()
  // columns 只作为模板使用；最新引用放在 ref 里，结构签名变化时才重算。
  const columnsRef = useRef(columns)
  columnsRef.current = columns
  // biome-ignore lint/correctness/useExhaustiveDependencies: 以结构签名为模板依赖，忽略列数组引用变化。
  const normalizedApplied = useMemo(
    () => normalizeColumns(appliedColumns ?? columnsRef.current),
    [appliedColumns, columnsSignature],
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: 以结构签名为模板依赖，忽略列数组引用变化。
  const normalizedDeclared = useMemo(
    () => normalizeColumns(columnsRef.current),
    [columnsSignature],
  )
  const { allLeafIds, userLeafSet } = normalizedApplied

  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    id: string
    zone: DropZone
  } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const newGroupSeq = useRef(0)

  /** DFS pre-order of a tree — the actual leaf render order */
  const dfsLeaves = (tree: SettingsNode[]): string[] => {
    const out: string[] = []
    const walk = (nodes: SettingsNode[]) => {
      for (const node of nodes) {
        if (node.kind === 'leaf') out.push(node.id)
        else walk(node.children)
      }
    }
    walk(tree)
    return out
  }

  /** Draft reflecting the currently applied columns/state */
  const buildDraftFromApplied = (): DraftState => {
    const visState = table.getState().columnVisibility
    const visibility: Record<string, boolean> = {}
    for (const id of allLeafIds) visibility[id] = visState[id] !== false

    const pinState = table.getState().columnPinning
    const pinning: Record<string, 'left' | 'right'> = {}
    for (const id of pinState.left ?? [])
      if (userLeafSet.has(id)) pinning[id] = 'left'
    for (const id of pinState.right ?? [])
      if (userLeafSet.has(id)) pinning[id] = 'right'

    return {
      tree: cloneTree(normalizedApplied.topNodes),
      visibility,
      pinning,
    }
  }

  /** Draft reflecting the factory defaults declared by `columns` */
  const buildDraftFromDefaults = (): DraftState => {
    const visibility: Record<string, boolean> = {}
    for (const id of allLeafIds)
      visibility[id] = defaultVisibility[id] !== false

    const pinning: Record<string, 'left' | 'right'> = {}
    const declaredLeaves = new Set(
      normalizedDeclared.topNodes.flatMap((n) => n.leafIds),
    )
    for (const id of defaultPinning.left ?? [])
      if (declaredLeaves.has(id)) pinning[id] = 'left'
    for (const id of defaultPinning.right ?? [])
      if (declaredLeaves.has(id)) pinning[id] = 'right'

    return {
      tree: cloneTree(normalizedDeclared.topNodes),
      visibility,
      pinning,
    }
  }

  const [draft, setDraft] = useState<DraftState>(() => buildDraftFromApplied())
  const parentOf = useMemo(() => buildParentInfo(draft.tree), [draft.tree])
  const draggedNode = useMemo(
    () => (dragId ? findNodeById(draft.tree, dragId) : null),
    [dragId, draft.tree],
  )
  const draggedSubtreeIds = useMemo(
    () => (draggedNode ? collectSubtreeIds(draggedNode) : null),
    [draggedNode],
  )

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      // Always start from the applied state — 「取消」 simply discards the draft
      setDraft(buildDraftFromApplied())
      setCollapsed({})
      setDragId(null)
      setDropTarget(null)
      setEditingId(null)
    }
  }

  /* ---------------- Draft mutations ---------------- */

  const setVisibilityFor = (ids: string[], value: boolean) =>
    setDraft((d) => {
      const visibility = { ...d.visibility }
      for (const id of ids) visibility[id] = value
      return { ...d, visibility }
    })

  const togglePinFor = (node: SettingsNode, side: 'left' | 'right') =>
    setDraft((d) => {
      // Leaves pin individually; group rows pin all descendant leaves.
      // Partial group pins are supported: the header renderer blanks the
      // label on every split segment except the one holding the group's
      // first visible leaf, so the boundary stays visually clean.
      const leafIds = node.leafIds
      const allPinned =
        leafIds.length > 0 && leafIds.every((id) => d.pinning[id] === side)
      const pinning = { ...d.pinning }
      for (const id of leafIds) {
        if (allPinned) delete pinning[id]
        else pinning[id] = side
      }
      return { ...d, pinning }
    })

  const updateDraftTree = (fn: (tree: SettingsNode[]) => void) =>
    setDraft((d) => {
      const cloned = cloneTree(d.tree)
      fn(cloned)
      return { ...d, tree: recomputeLeafIds(cloned) }
    })

  /** Sibling reorder (or same-list move) */
  const moveNode = (draggedId: string, targetId: string, before: boolean) =>
    updateDraftTree((tree) => {
      const dragged = removeNodeById(tree, draggedId)
      if (!dragged) return
      const list = findListOf(tree, targetId)
      if (!list) return
      let index = list.findIndex((n) => n.id === targetId)
      if (index === -1) return
      if (!before) index += 1
      list.splice(index, 0, dragged)
    })

  /** Move a node into a group (appended at the end of the group) */
  const moveNodeIntoGroup = (draggedId: string, groupId: string) => {
    updateDraftTree((tree) => {
      const dragged = removeNodeById(tree, draggedId)
      if (!dragged) return
      const target = findNodeById(tree, groupId)
      if (target?.kind !== 'group') return
      target.children.push(dragged)
    })
    // Make the drop destination visible
    setCollapsed((prev) => ({ ...prev, [groupId]: false }))
  }

  /** Dissolve a group: its children are spliced into the parent list */
  const ungroupNode = (groupId: string) =>
    updateDraftTree((tree) => {
      const list = findListOf(tree, groupId)
      const node = list?.find((n) => n.id === groupId)
      if (!list || !node) return
      const index = list.indexOf(node)
      list.splice(index, 1, ...node.children)
    })

  const renameGroup = (groupId: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    updateDraftTree((tree) => {
      const node = findNodeById(tree, groupId)
      if (node) node.title = trimmed
    })
  }

  /** Create an empty user-defined group at the end of the root level */
  const createGroup = () => {
    const id = `__user_group_${Date.now().toString(36)}_${(newGroupSeq.current++).toString(36)}`
    updateDraftTree((tree) => {
      tree.push({
        id,
        title: tableLocale.newGroup,
        kind: 'group',
        children: [],
        leafIds: [],
        raw: {
          key: id,
          title: tableLocale.newGroup,
          align: 'center',
          children: [],
        } as TanStackColumnType<TData>,
      })
    })
    setEditTitle(tableLocale.newGroup)
    setEditingId(id)
  }

  const commitRename = () => {
    if (editingId) renameGroup(editingId, editTitle)
    setEditingId(null)
  }

  const handleRestoreDefaults = () => {
    setDraft(buildDraftFromDefaults())
    setCollapsed({})
    setEditingId(null)
    // Immediate full reset: widths / order / pinning / visibility / view override
    onResetAll()
  }

  const handleConfirm = () => {
    const flatSelection = dfsLeaves(draft.tree)

    // 1) Visibility — write every user leaf explicitly
    const visibility: VisibilityState = {}
    for (const id of allLeafIds) visibility[id] = draft.visibility[id] !== false
    table.setColumnVisibility(visibility)

    // 2) Pinning — keep system column pins, apply draft for user columns
    //    (order within each side follows the draft tree order)
    const cur = table.getState().columnPinning
    const sysLeft = (cur.left ?? []).filter((id) => !userLeafSet.has(id))
    const sysRight = (cur.right ?? []).filter((id) => !userLeafSet.has(id))
    table.setColumnPinning({
      left: [
        ...sysLeft,
        ...flatSelection.filter((id) => draft.pinning[id] === 'left'),
      ],
      right: [
        ...sysRight,
        ...flatSelection.filter((id) => draft.pinning[id] === 'right'),
      ],
    })

    // 3) Column order — empty state means "declaration order"
    const defaultFlat = dfsLeaves(normalizedDeclared.topNodes)
    if (JSON.stringify(flatSelection) === JSON.stringify(defaultFlat)) {
      if ((table.getState().columnOrder?.length ?? 0) > 0) {
        table.setColumnOrder([])
      }
    } else {
      const sysIds = table
        .getAllLeafColumns()
        .filter(
          (c) =>
            (c.columnDef.meta as TanStackColumnMeta | undefined)
              ?.isBuiltinColumn,
        )
        .map((c) => c.id)
      table.setColumnOrder([...sysIds, ...flatSelection])
    }

    // 4) Grouping view override — only when the tree actually changed
    const isDefaultView =
      JSON.stringify(projectTree(draft.tree)) ===
      JSON.stringify(projectTree(cloneTree(normalizedDeclared.topNodes)))
    onApplyView?.(isDefaultView ? null : emitColumns(draft.tree))

    setEditingId(null)
    setOpen(false)
  }

  /* ---------------- Derived view state ---------------- */

  const visibleCount = allLeafIds.filter((id) => draft.visibility[id]).length
  const allVisible = allLeafIds.length > 0 && visibleCount === allLeafIds.length
  const someVisible = visibleCount > 0

  const nodePinState = (node: SettingsNode, side: 'left' | 'right') => {
    if (node.leafIds.length === 0) return 'none'
    const values = node.leafIds.map((id) => draft.pinning[id])
    const all = values.every((v) => v === side)
    const some = values.some((v) => v === side)
    return all ? 'all' : some ? 'some' : 'none'
  }

  const renderPinButtons = (node: SettingsNode) => {
    const leftState = nodePinState(node, 'left')
    const rightState = nodePinState(node, 'right')
    const makeButton = (
      side: 'left' | 'right',
      state: 'all' | 'some' | 'none',
    ) => {
      const active = state === 'all'
      const label = side === 'left' ? tableLocale.pinLeft : tableLocale.pinRight
      return (
        <button
          key={side}
          type="button"
          title={
            active
              ? side === 'left'
                ? tableLocale.unpinLeft
                : tableLocale.unpinRight
              : label
          }
          aria-label={label}
          aria-pressed={active}
          onClick={() => togglePinFor(node, side)}
          className="rounded p-1 shrink-0 transition-colors hover:bg-muted"
        >
          <Pin
            className={cn(
              'h-3.5 w-3.5',
              active
                ? 'text-primary'
                : state === 'some'
                  ? 'text-foreground/80'
                  : 'text-muted-foreground',
              side === 'left' ? '-rotate-45' : 'rotate-45',
            )}
          />
        </button>
      )
    }
    return (
      <div className="flex items-center gap-0.5 shrink-0">
        {makeButton('left', leftState)}
        {makeButton('right', rightState)}
      </div>
    )
  }

  const zoneFromEvent = (
    e: React.DragEvent<HTMLDivElement>,
    node: SettingsNode,
  ): DropZone | null => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    if (node.kind === 'group') {
      if (y < rect.height * 0.25) return 'before'
      if (y > rect.height * 0.75) return 'after'
      return 'inside'
    }
    return y < rect.height / 2 ? 'before' : 'after'
  }

  const handleRowDragOver =
    (node: SettingsNode) => (e: React.DragEvent<HTMLDivElement>) => {
      if (!dragId || !draggedNode || dragId === node.id) return
      const zone = zoneFromEvent(e, node)
      if (!zone) return

      if (zone === 'inside') {
        // Only into groups, never into own descendant
        if (!draggedSubtreeIds || draggedSubtreeIds.has(node.id)) return
      } else {
        // Sibling-only reorder within the same parent
        if (parentOf.get(dragId) !== parentOf.get(node.id)) return
      }
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDropTarget((prev) =>
        prev && prev.id === node.id && prev.zone === zone
          ? prev
          : { id: node.id, zone },
      )
    }

  const handleRowDrop =
    (node: SettingsNode) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!dragId || dragId === node.id) return
      const zone = zoneFromEvent(e, node)
      if (zone === 'inside') {
        if (draggedSubtreeIds?.has(node.id)) return
        moveNodeIntoGroup(dragId, node.id)
      } else if (zone) {
        if (parentOf.get(dragId) !== parentOf.get(node.id)) return
        moveNode(dragId, node.id, zone === 'before')
      }
      setDragId(null)
      setDropTarget(null)
    }

  const renderNode = (node: SettingsNode, depth: number): React.ReactNode => {
    const isGroup = node.kind === 'group'
    const isCollapsed = collapsed[node.id] ?? true
    const isEditing = editingId === node.id
    const dropZone = dropTarget?.id === node.id ? dropTarget.zone : null

    const visValues = node.leafIds.map((id) => draft.visibility[id])
    const allChecked = visValues.length > 0 && visValues.every(Boolean)
    const someChecked = visValues.some(Boolean)

    return (
      <Fragment key={node.id}>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: HTML5 drag-and-drop row target — no sensible keyboard equivalent (each row also exposes its actions as buttons) */}
        <div
          className={cn(
            'relative flex items-center border border-transparent gap-1.5 py-1.25 pr-1.5 text-xs transition-colors',
            dropZone === 'inside'
              ? 'bg-primary/5 border-dashed border-primary/50'
              : 'hover:bg-accent/60',
            dragId === node.id && 'opacity-40',
          )}
          style={{ paddingLeft: 6 + depth * 18 }}
          onDragOver={handleRowDragOver(node)}
          onDrop={handleRowDrop(node)}
          onDragLeave={() =>
            setDropTarget((prev) => (prev?.id === node.id ? null : prev))
          }
        >
          {dropZone === 'before' && (
            <div className="pointer-events-none absolute left-1 right-1 top-0 h-0.5 rounded-full bg-primary" />
          )}
          {dropZone === 'after' && (
            <div className="pointer-events-none absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-primary" />
          )}

          {/* Drag handle — only the handle initiates dragging */}
          {!isEditing && (
            <span
              draggable
              role="button"
              aria-label={tableLocale.dragToReorder(node.title)}
              title={tableLocale.dragReorderHint}
              onDragStart={(e) => {
                setDragId(node.id)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', node.id)
              }}
              onDragEnd={() => {
                setDragId(null)
                setDropTarget(null)
              }}
              className="shrink-0 cursor-grab opacity-40 transition-opacity hover:opacity-80 active:cursor-grabbing"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          )}

          <Checkbox
            checked={allChecked}
            indeterminate={!allChecked && someChecked}
            onCheckedChange={(val) => setVisibilityFor(node.leafIds, !!val)}
            aria-label={tableLocale.toggleColumnVisibility(node.title)}
            disabled={node.leafIds.length === 0}
          />

          {isGroup && (
            <button
              type="button"
              onClick={() =>
                setCollapsed((prev) => ({
                  ...prev,
                  [node.id]: !(prev[node.id] ?? true),
                }))
              }
              aria-label={
                isCollapsed
                  ? tableLocale.expandGroupLabel(node.title)
                  : tableLocale.collapseGroupLabel(node.title)
              }
              className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:bg-muted hover:opacity-100"
            >
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-150',
                  !isCollapsed && 'rotate-90',
                )}
              />
            </button>
          )}

          {isGroup && <Folder className="h-3.5 w-3.5 shrink-0" />}

          {isEditing ? (
            <input
              // Focus on mount (same contract as autoFocus, but explicit):
              // creating a group opens its inline rename input by design.
              ref={(el) => {
                el?.focus({ preventScroll: true })
              }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                // Keep Base UI Popover's document-level Escape/Enter handling out:
                // the input manages its own keys while editing a group name.
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  commitRename()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  e.stopPropagation()
                  setEditingId(null)
                }
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label={tableLocale.groupName}
              className="tanstack-table-input"
            />
          ) : (
            <span
              className="min-w-0 flex-1 truncate font-medium text-foreground/90"
              title={node.title}
            >
              {node.title}
            </span>
          )}

          {isGroup && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none tabular-nums text-muted-foreground">
              {node.leafIds.length}
            </span>
          )}

          {isGroup && !isEditing && (
            <>
              <button
                type="button"
                title={tableLocale.editGroup}
                aria-label={tableLocale.editGroupLabel(node.title)}
                onClick={() => {
                  setEditingId(node.id)
                  setEditTitle(node.title)
                }}
                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title={tableLocale.dissolveGroupHint}
                aria-label={tableLocale.dissolveGroupLabel(node.title)}
                onClick={() => ungroupNode(node.id)}
                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Ungroup className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {renderPinButtons(node)}
        </div>

        {isGroup &&
          !isCollapsed &&
          node.children.map((child) => renderNode(child, depth + 1))}
      </Fragment>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={<Button variant="ghost" />}>
        <Settings2 />
        {tableLocale.columnSettings}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-85 gap-0 overflow-hidden p-0 text-xs shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3.5 py-2.5">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
            <ListChecks className="h-4 w-4" />
            {tableLocale.columnSettings}
          </span>
          <button
            type="button"
            onClick={handleRestoreDefaults}
            title={tableLocale.restoreDefaultsHint}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground/80 transition-colors hover:text-foreground hover:underline"
          >
            <RotateCcw className="h-3 w-3" />
            {tableLocale.restoreDefaults}
          </button>
        </div>

        {/* Select-all row */}
        <div className="flex items-center justify-between gap-2 border-b px-3.5 py-2">
          <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-foreground">
            <Checkbox
              checked={allVisible}
              indeterminate={!allVisible && someVisible}
              onCheckedChange={(val) => setVisibilityFor(allLeafIds, !!val)}
              aria-label={tableLocale.selectAllColumns}
            />
            {tableLocale.allColumns}
          </label>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {tableLocale.selectedCount(visibleCount, allLeafIds.length)}
          </span>
        </div>

        {/* Column tree (mirrors the applied columns) */}
        <div className="max-h-105 overflow-y-auto px-2 py-1.5">
          {draft.tree.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              {tableLocale.noConfigurableColumns}
            </div>
          ) : (
            draft.tree.map((node) => renderNode(node, 0))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={createGroup}
          >
            <FolderPlus className="h-3.5 w-3.5" />
            {tableLocale.newGroup}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setOpen(false)}
            >
              {tableLocale.cancel}
            </Button>
            <Button size="sm" className="text-xs" onClick={handleConfirm}>
              {tableLocale.confirm}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
