import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  cloneConfig,
  containsId,
  detachItem,
  findItem,
  flattenGroup,
  insertIntoGroup,
  moveBeside,
  moveToTopLevel,
  pruneEmptyGroups,
  renameGroup,
  type ColumnConfigSnapshot,
  type ConfigGroup,
  type ConfigItem,
  type ConfigItemRef,
  type DropPosition,
} from './column-config'

interface DropTarget {
  /** 行 key：`top:${id}` 或 `child:${groupId}:${leafId}` */
  key: string
  /** before / after = 插到该行前 / 后；into = 放入分组末尾 */
  mode: 'before' | 'after' | 'into'
}

interface GridTableConfigEditorProps {
  initial: ColumnConfigSnapshot
  defaults: ColumnConfigSnapshot
  leafLabels: Record<string, string>
  groupLabels: Record<string, string>
  onApply: (next: ColumnConfigSnapshot) => void
}

/**
 * 编辑器的草稿状态与交互逻辑。视图留在 GridTableConfig，
 * 这里集中处理排序、分组、固定列与拖拽状态，避免 UI 文件变成控制器。
 */
export function useGridTableConfigEditor({
  initial,
  defaults,
  leafLabels,
  groupLabels,
  onApply,
}: GridTableConfigEditorProps) {
  const { t } = useTranslation()

  const [itemsState, setItems] = useState<ConfigItem[]>(() =>
    cloneConfig(initial.items),
  )
  const [visibilityState, setVisibility] = useState<Record<string, boolean>>(
    () => ({
      ...initial.visibility,
    }),
  )
  const [pinningState, setPinning] = useState(() => ({
    start: [...initial.pinning.start],
    end: [...initial.pinning.end],
  }))
  const [collapsedState, setCollapsed] = useState<Set<string>>(() => new Set())
  const [editingIdState, setEditingId] = useState<string | null>(null)
  const [editingNameState, setEditingName] = useState('')
  const [dragSourceState, setDragSource] = useState<ConfigItemRef | null>(null)
  const [dropTargetState, setDropTarget] = useState<DropTarget | null>(null)
  const cancelRenameRef = useRef(false)
  const newGroupSeq = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  /** 拖拽到列表上下边缘时自动滚动：方向 -1 / 0 / 1 + rAF 句柄 */
  const autoScrollRef = useRef({ dir: 0, frame: 0 })

  const stopAutoScroll = () => {
    autoScrollRef.current.dir = 0
    if (autoScrollRef.current.frame) {
      cancelAnimationFrame(autoScrollRef.current.frame)
      autoScrollRef.current.frame = 0
    }
  }

  /** dragover 只负责设定方向；真正滚动交给 rAF，指针停住也能持续滚动 */
  const trackAutoScroll = (clientY: number) => {
    const el = scrollRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const edge = 28
    const dir =
      clientY < rect.top + edge ? -1 : clientY > rect.bottom - edge ? 1 : 0
    autoScrollRef.current.dir = dir
    if (dir === 0 || autoScrollRef.current.frame) return

    const step = () => {
      const node = scrollRef.current
      if (!node || autoScrollRef.current.dir === 0) {
        autoScrollRef.current.frame = 0
        return
      }
      node.scrollTop += autoScrollRef.current.dir * 8
      autoScrollRef.current.frame = requestAnimationFrame(step)
    }
    autoScrollRef.current.frame = requestAnimationFrame(step)
  }

  useEffect(
    () => () => {
      if (autoScrollRef.current.frame) {
        cancelAnimationFrame(autoScrollRef.current.frame)
      }
    },
    [],
  )

  /** dragover 高频触发：落点没变时复用旧状态，避免整棵树反复渲染 */
  const applyDropTarget = (next: DropTarget | null) => {
    setDropTarget((prev) =>
      prev === next ||
      (prev !== null &&
        next !== null &&
        prev.key === next.key &&
        prev.mode === next.mode)
        ? prev
        : next,
    )
  }

  /** 某一行当前的落点状态：插到前 / 后，或放入分组 */
  const dropState = (key: string) => ({
    before: dropTargetState?.key === key && dropTargetState.mode === 'before',
    after: dropTargetState?.key === key && dropTargetState.mode === 'after',
    into: dropTargetState?.key === key && dropTargetState.mode === 'into',
  })

  const leaves = Object.keys(leafLabels)
  // 一次遍历同时得出全选 / 半选
  let visibleCount = 0
  for (const id of leaves) if (visibilityState[id] ?? true) visibleCount++
  const allVisible = visibleCount === leaves.length
  const someVisible = visibleCount > 0
  const setAllVisible = (visible: boolean) => {
    setVisibility((prev) => {
      const next = { ...prev }
      for (const id of leaves) next[id] = visible
      return next
    })
  }

  /** 行（或分组）是否已停靠到某一侧 */
  const isPinned = (ids: string[], side: 'start' | 'end') =>
    ids.length > 0 && ids.every((id) => pinningState[side].includes(id))

  const togglePin = (ids: string[], side: 'start' | 'end') => {
    setPinning((prev) => {
      const fullyPinned = ids.every((id) => prev[side].includes(id))
      const idSet = new Set<string>(ids)
      const rest = {
        start: prev.start.filter((id) => !idSet.has(id)),
        end: prev.end.filter((id) => !idSet.has(id)),
      }
      if (fullyPinned) return rest
      return { ...rest, [side]: [...rest[side], ...ids] }
    })
  }

  const groupLabel = (group: ConfigGroup) =>
    group.label ?? groupLabels[group.id] ?? group.id

  const toggleCollapse = (groupId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const startRename = (group: ConfigGroup) => {
    setEditingId(group.id)
    setEditingName(groupLabel(group))
  }

  const cancelRename = () => {
    cancelRenameRef.current = true
  }

  const finishRename = (save: boolean) => {
    if (!editingIdState) return
    if (save) {
      const name = editingNameState.trim()
      setItems((prev) =>
        renameGroup(prev, editingIdState, name || t('table.newGroup')),
      )
    }
    setEditingId(null)
  }

  const handleRenameBlur = () => {
    if (cancelRenameRef.current) {
      cancelRenameRef.current = false
      setEditingId(null)
      return
    }
    finishRename(true)
  }

  const ungroup = (groupId: string) =>
    setItems((prev) => flattenGroup(prev, groupId))

  const addGroup = () => {
    const id = `group-${Date.now()}-${newGroupSeq.current++}`
    setItems((prev) => [
      ...prev,
      { kind: 'group', id, label: t('table.newGroup'), children: [] },
    ])
    setEditingId(id)
    setEditingName(t('table.newGroup'))
  }

  const resetDraft = () => {
    setItems(cloneConfig(defaults.items))
    setVisibility({ ...defaults.visibility })
    setPinning({
      start: [...defaults.pinning.start],
      end: [...defaults.pinning.end],
    })
    setCollapsed(new Set())
    setEditingId(null)
    setDragSource(null)
    setDropTarget(null)
  }

  /* ------------------------------ 拖拽 ------------------------------ */

  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    source: ConfigItemRef,
  ) => {
    event.dataTransfer.effectAllowed = 'move'
    // Firefox 需要写入数据才会开始拖拽
    event.dataTransfer.setData('text/plain', source.id)
    // 用整行作为拖拽影子，比默认只拖一个手柄更容易看清
    const row = event.currentTarget.parentElement
    if (row) event.dataTransfer.setDragImage(row, 16, 16)
    setDragSource(source)
    stopAutoScroll()
  }

  const handleDragEnd = () => {
    setDragSource(null)
    setDropTarget(null)
    stopAutoScroll()
  }

  /** 指针在目标行的上半 / 下半部分决定插入方向，从而支持拖到末尾 */
  const getDropPosition = (event: DragEvent<HTMLElement>): DropPosition => {
    const rect = event.currentTarget.getBoundingClientRect()
    return event.clientY > rect.top + rect.height / 2 ? 'after' : 'before'
  }

  /** source 能否放到 target 上：排除自身与自己的后代（分组不能套进自己的子树） */
  const dropInvalid = (source: ConfigItemRef, target: ConfigItem) => {
    if (source.kind === target.kind && source.id === target.id) return true
    const src = findItem(itemsState, source.id)
    return src?.kind === 'group' && containsId(src.children, target.id)
  }

  const handleTopDragOver = (
    event: DragEvent<HTMLElement>,
    target: ConfigItem,
  ) => {
    if (!dragSourceState || dropInvalid(dragSourceState, target)) return
    const position = getDropPosition(event)
    // 拖到分组行：上半 = 插到分组前面，下半 = 移入分组（任意来源，支持嵌套）；
    // 拖到叶子行 = 前 / 后。「移到分组后面」用下一项的上半 / 底部落点区表达
    const intoGroup = target.kind === 'group' && position === 'after'
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    applyDropTarget({
      key: `top:${target.id}`,
      mode: intoGroup ? 'into' : position,
    })
  }

  const handleTopDrop = (event: DragEvent<HTMLElement>, target: ConfigItem) => {
    if (!dragSourceState || dropInvalid(dragSourceState, target)) return
    const source = dragSourceState
    const position = getDropPosition(event)
    event.preventDefault()
    setDragSource(null)
    setDropTarget(null)

    // 分组行下半部：移入该分组末尾，并展开它
    if (target.kind === 'group' && position === 'after') {
      const moved = findItem(itemsState, source.id)
      if (!moved) return
      setItems((prev) =>
        insertIntoGroup(detachItem(prev, source.id), target.id, moved),
      )
      setCollapsed((prev) => {
        if (!prev.has(target.id)) return prev
        const next = new Set(prev)
        next.delete(target.id)
        return next
      })
      return
    }

    // 插到目标前 / 后（与目标同层级，可在任意深度）
    setItems((prev) => moveBeside(prev, source, target.id, position))
  }

  const handleChildDragOver = (
    event: DragEvent<HTMLElement>,
    groupId: string,
    leafId: string,
  ) => {
    if (!dragSourceState) return
    const target: ConfigItem = { kind: 'leaf', id: leafId }
    if (dropInvalid(dragSourceState, target)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    applyDropTarget(
      dragSourceState.id === leafId
        ? null
        : {
            key: `child:${groupId}:${leafId}`,
            mode: getDropPosition(event),
          },
    )
  }

  const handleChildDrop = (
    event: DragEvent<HTMLElement>,
    groupId: string,
    leafId: string,
  ) => {
    if (!dragSourceState) return
    const source = dragSourceState
    const target: ConfigItem = { kind: 'leaf', id: leafId }
    if (dropInvalid(source, target)) return
    const position = getDropPosition(event)
    event.preventDefault()
    setDragSource(null)
    setDropTarget(null)
    if (source.id === leafId) return
    const moved = findItem(itemsState, source.id)
    if (!moved) return
    setItems((prev) =>
      insertIntoGroup(
        detachItem(prev, source.id),
        groupId,
        moved,
        leafId,
        position,
      ),
    )
  }

  /**
   * 列表头部 / 底部的放置区：头部落到「全部」下方 = 插到最前，底部 = 插到最后。
   * 首个 / 末个顶层项是分组时，悬停分组行会被解释成「放进分组」，
   * 所以单独留出这两个落点；落点高亮复用首行 before / 末行 after 线。
   */
  const handleEdgeDragOver = (
    event: DragEvent<HTMLDivElement>,
    edge: 'head' | 'foot',
  ) => {
    const target =
      edge === 'head' ? itemsState[0] : itemsState[itemsState.length - 1]
    if (!dragSourceState || !target) return
    if (
      dragSourceState.kind === target.kind &&
      dragSourceState.id === target.id
    )
      return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    applyDropTarget({
      key: `top:${target.id}`,
      mode: edge === 'head' ? 'before' : 'after',
    })
  }

  const handleEdgeDrop = (
    event: DragEvent<HTMLDivElement>,
    edge: 'head' | 'foot',
  ) => {
    const target =
      edge === 'head' ? itemsState[0] : itemsState[itemsState.length - 1]
    if (!dragSourceState || !target) return
    event.preventDefault()
    const source = dragSourceState
    setDragSource(null)
    setDropTarget(null)
    if (source.kind === target.kind && source.id === target.id) return
    setItems((prev) =>
      moveToTopLevel(
        prev,
        source,
        target.id,
        edge === 'head' ? 'before' : 'after',
      ),
    )
  }

  const apply = () =>
    onApply({
      items: pruneEmptyGroups(itemsState),
      visibility: { ...visibilityState },
      pinning: {
        start: [...pinningState.start],
        end: [...pinningState.end],
      },
    })

  return {
    itemsState,
    visibilityState,
    collapsedState,
    editingIdState,
    editingNameState,
    setEditingName,
    dragSourceState,
    scrollRef,
    allVisible,
    someVisible,
    setVisibility,
    dropState,
    applyDropTarget,
    dropInvalid,
    cancelRename,
    handleRenameBlur,
    trackAutoScroll,
    stopAutoScroll,
    handleDragStart,
    handleDragEnd,
    handleTopDragOver,
    handleTopDrop,
    handleChildDragOver,
    handleChildDrop,
    handleEdgeDragOver,
    handleEdgeDrop,
    isPinned,
    togglePin,
    groupLabel,
    toggleCollapse,
    startRename,
    finishRename,
    ungroup,
    resetDraft,
    addGroup,
    setAllVisible,
    apply,
  }
}
