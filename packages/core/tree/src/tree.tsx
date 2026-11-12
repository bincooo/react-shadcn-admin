import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ForwardedRef,
  type KeyboardEvent,
  type ReactElement,
  type UIEvent,
} from 'react'
import { cn } from '@repo/ui/lib/utils'
import { buildEventDataNode, TreeNodeRow } from './tree-node'
import {
  buildKeyEntities,
  calcDropPosition,
  collectAllExpandableKeys,
  conductCheck,
  conductExpandParent,
  convertChildrenToData,
  fillFieldNames,
  flattenTreeData,
  getDragNodesKeys,
  isNodeCheckDisabled,
} from './tree-utils'
import type {
  BasicDataNode,
  CheckInfo,
  DataEntity,
  EventDataNode,
  FlattenNode,
  TreeDataNode,
  TreeFieldNames,
  TreeInstance,
  TreeKey,
  TreeNodeProps,
  TreeProps,
  TreeRef,
  TreeScrollToConfig,
  TreeSemanticName,
} from './types'

const DEFAULT_ITEM_HEIGHT = 28
const VIRTUAL_OVERSCAN = 8

export function TreeNode<T extends BasicDataNode = TreeDataNode>(
  _props: TreeNodeProps<T>,
): null {
  return null
}

export function useTree<T extends BasicDataNode = TreeDataNode>(
  treeData: readonly T[],
  config?: { fieldNames?: TreeFieldNames },
): TreeInstance<T> {
  const dataRef = useRef(treeData)
  const fieldNamesRef = useRef(config?.fieldNames)
  dataRef.current = treeData
  fieldNamesRef.current = config?.fieldNames

  const getPath = useCallback((key: TreeKey): T[] => {
    const resolved = fillFieldNames(fieldNamesRef.current)
    const { keyEntities } = buildKeyEntities(dataRef.current, resolved)
    const entity = keyEntities.get(key)
    if (!entity) return []
    const path: T[] = []
    let current: DataEntity<T> | null = entity
    while (current) {
      path.unshift(current.node)
      current = current.parent
    }
    return path
  }, [])

  return useMemo(() => ({ getPath }), [getPath])
}

export interface InternalTreeProps<T extends BasicDataNode = TreeDataNode>
  extends TreeProps<T> {
  /** Internal flag used by DirectoryTree for full-row primary styling. */
  _directoryMode?: boolean
}

function TreeImpl<T extends BasicDataNode = TreeDataNode>(
  props: InternalTreeProps<T>,
  ref: ForwardedRef<TreeRef>,
) {
  const {
    treeData,
    children,
    fieldNames: rawFieldNames,
    allowDrop,
    autoExpandParent = false,
    blockNode = false,
    checkable = false,
    checkedKeys: controlledCheckedKeys,
    checkStrictly = false,
    className,
    style,
    rootClassName,
    rootStyle,
    classNames: rawClassNames,
    styles: rawStyles,
    defaultCheckedKeys = [],
    defaultExpandAll = false,
    defaultExpandedKeys,
    defaultExpandParent = true,
    defaultSelectedKeys = [],
    disabled = false,
    draggable = false,
    expandedKeys: controlledExpandedKeys,
    filterTreeNode,
    height,
    itemHeight,
    icon: treeIcon,
    loadData,
    loadedKeys: controlledLoadedKeys,
    multiple = false,
    selectable = true,
    selectedKeys: controlledSelectedKeys,
    showIcon = false,
    showLine = false,
    switcherIcon,
    switcherLoadingIcon,
    titleRender,
    virtual = true,
    ariaLabel,
    id,
    onCheck,
    onClick,
    onDoubleClick,
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDragStart,
    onDrop,
    onExpand,
    onLoad,
    onRightClick,
    onSelect,
    _directoryMode = false,
  } = props

  const fieldNames = useMemo(
    () => fillFieldNames(rawFieldNames),
    [rawFieldNames],
  )

  const mergedTreeData = useMemo(() => {
    if (treeData !== undefined) return treeData as readonly T[]
    return convertChildrenToData(children) as unknown as readonly T[]
  }, [treeData, children])

  const { keyEntities, levelEntities, maxLevel } = useMemo(
    () => buildKeyEntities(mergedTreeData, fieldNames),
    [mergedTreeData, fieldNames],
  )

  // ---- Expand state ----
  const [innerExpandedKeys, setInnerExpandedKeys] = useState<TreeKey[]>(() => {
    if (defaultExpandAll) {
      return collectAllExpandableKeys(mergedTreeData, fieldNames)
    }
    if (defaultExpandedKeys && defaultExpandedKeys.length > 0) {
      return defaultExpandParent
        ? conductExpandParent(defaultExpandedKeys, keyEntities)
        : [...defaultExpandedKeys]
    }
    return []
  })

  const effectiveExpandedKeys = useMemo(() => {
    const base =
      controlledExpandedKeys !== undefined
        ? controlledExpandedKeys
        : innerExpandedKeys
    if (autoExpandParent) {
      return conductExpandParent(base, keyEntities)
    }
    return base
  }, [controlledExpandedKeys, innerExpandedKeys, autoExpandParent, keyEntities])

  const expandedSet = useMemo(
    () => new Set<TreeKey>(effectiveExpandedKeys),
    [effectiveExpandedKeys],
  )

  // ---- Selected state ----
  const [innerSelectedKeys, setInnerSelectedKeys] = useState<TreeKey[]>(() => [
    ...defaultSelectedKeys,
  ])
  const activeSelectedKeys =
    controlledSelectedKeys !== undefined
      ? controlledSelectedKeys
      : innerSelectedKeys
  const selectedSet = useMemo(
    () => new Set<TreeKey>(activeSelectedKeys),
    [activeSelectedKeys],
  )

  // ---- Checked state ----
  const [innerCheckedState, setInnerCheckedState] = useState<{
    checked: TreeKey[]
    halfChecked: TreeKey[]
  }>(() => ({
    checked: [...defaultCheckedKeys],
    halfChecked: [],
  }))

  const { checkedSet, halfCheckedSet } = useMemo(() => {
    if (checkStrictly) {
      const source =
        controlledCheckedKeys !== undefined
          ? controlledCheckedKeys
          : innerCheckedState
      const checkedList = Array.isArray(source) ? source : source.checked
      const halfList = Array.isArray(source) ? [] : (source.halfChecked ?? [])
      return {
        checkedSet: new Set<TreeKey>(checkedList),
        halfCheckedSet: new Set<TreeKey>(halfList),
      }
    }

    const rawSource =
      controlledCheckedKeys !== undefined
        ? controlledCheckedKeys
        : innerCheckedState.checked
    const rawList = Array.isArray(rawSource) ? rawSource : rawSource.checked
    const conducted = conductCheck(
      rawList,
      true,
      keyEntities,
      levelEntities,
      maxLevel,
      fieldNames,
      disabled,
    )
    return {
      checkedSet: new Set<TreeKey>(conducted.checkedKeys),
      halfCheckedSet: new Set<TreeKey>(conducted.halfCheckedKeys),
    }
  }, [
    checkStrictly,
    controlledCheckedKeys,
    innerCheckedState,
    keyEntities,
    levelEntities,
    maxLevel,
    fieldNames,
    disabled,
  ])

  // ---- Async loadData state ----
  const [innerLoadedKeys, setInnerLoadedKeys] = useState<TreeKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState<Set<TreeKey>>(() => new Set())
  const loadedSet = useMemo(
    () => new Set<TreeKey>(controlledLoadedKeys ?? innerLoadedKeys),
    [controlledLoadedKeys, innerLoadedKeys],
  )

  // ---- Flatten visible nodes ----
  const flattenedNodes = useMemo(
    () =>
      flattenTreeData(
        mergedTreeData,
        expandedSet,
        fieldNames,
        Boolean(loadData),
      ),
    [mergedTreeData, expandedSet, fieldNames, loadData],
  )

  const flattenIndexByKey = useMemo(() => {
    const map = new Map<TreeKey, number>()
    flattenedNodes.forEach((item, index) => {
      map.set(item.key, index)
    })
    return map
  }, [flattenedNodes])

  // ---- Focus & Keyboard nav state ----
  const [focusedKey, setFocusedKey] = useState<TreeKey | null>(null)
  const activeFocusKey = useMemo(() => {
    if (focusedKey !== null && flattenIndexByKey.has(focusedKey)) {
      return focusedKey
    }
    if (
      activeSelectedKeys.length > 0 &&
      flattenIndexByKey.has(activeSelectedKeys[0])
    ) {
      return activeSelectedKeys[0]
    }
    return flattenedNodes[0]?.key ?? null
  }, [focusedKey, flattenIndexByKey, activeSelectedKeys, flattenedNodes])

  // ---- Virtual scrolling & scrollTo ----
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isVirtual = height !== undefined && virtual !== false
  const effectiveItemHeight = isVirtual
    ? (itemHeight ?? DEFAULT_ITEM_HEIGHT)
    : undefined
  const [scrollTop, setScrollTop] = useState(0)
  const pendingScrollRef = useRef<TreeScrollToConfig | null>(null)

  const scrollToNode = useCallback(
    (config: TreeScrollToConfig) => {
      const container = containerRef.current
      if (!container) return

      const idx = flattenIndexByKey.get(config.key)
      if (idx === undefined) return

      const align = config.align ?? 'auto'
      const offset = config.offset ?? 0

      if (
        isVirtual &&
        effectiveItemHeight !== undefined &&
        height !== undefined
      ) {
        const nodeTop = idx * effectiveItemHeight
        const nodeBottom = nodeTop + effectiveItemHeight
        const viewTop = container.scrollTop
        const viewBottom = viewTop + height

        let targetTop = viewTop
        if (align === 'top') {
          targetTop = nodeTop
        } else if (align === 'bottom') {
          targetTop = nodeBottom - height
        } else {
          if (nodeTop < viewTop) {
            targetTop = nodeTop
          } else if (nodeBottom > viewBottom) {
            targetTop = nodeBottom - height
          } else {
            return
          }
        }
        container.scrollTop = Math.max(0, targetTop + offset)
        setScrollTop(container.scrollTop)
        return
      }

      const rowEl = container.querySelector<HTMLElement>(
        `[data-tree-key="${CSS.escape(String(config.key))}"]`,
      )
      if (!rowEl) return
      rowEl.scrollIntoView({
        block:
          align === 'top' ? 'start' : align === 'bottom' ? 'end' : 'nearest',
      })
      if (offset !== 0) {
        container.scrollTop += offset
      }
    },
    [flattenIndexByKey, isVirtual, effectiveItemHeight, height],
  )

  useEffect(() => {
    const pending = pendingScrollRef.current
    if (!pending) return
    if (!flattenIndexByKey.has(pending.key)) return
    pendingScrollRef.current = null
    scrollToNode(pending)
  }, [flattenIndexByKey, scrollToNode])

  useImperativeHandle(
    ref,
    () => ({
      scrollTo: (config: TreeScrollToConfig) => {
        if (config.autoExpand && !flattenIndexByKey.has(config.key)) {
          const entity = keyEntities.get(config.key)
          if (entity) {
            const ancestors: TreeKey[] = []
            let current = entity.parent
            while (current) {
              ancestors.push(current.key)
              current = current.parent
            }
            if (ancestors.length > 0) {
              const merged = Array.from(
                new Set([...effectiveExpandedKeys, ...ancestors]),
              )
              if (controlledExpandedKeys === undefined) {
                pendingScrollRef.current = config
                setInnerExpandedKeys(merged)
                return
              }
            }
          }
        }
        scrollToNode(config)
      },
    }),
    [
      flattenIndexByKey,
      keyEntities,
      effectiveExpandedKeys,
      controlledExpandedKeys,
      scrollToNode,
    ],
  )

  const handleContainerScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!isVirtual) return
    setScrollTop(e.currentTarget.scrollTop)
  }

  // ---- Semantic classNames / styles ----
  const semanticClassNames = useMemo<Partial<Record<TreeSemanticName, string>>>(
    () =>
      typeof rawClassNames === 'function'
        ? rawClassNames({ props })
        : (rawClassNames ?? {}),
    [rawClassNames, props],
  )
  const semanticStyles = useMemo(
    () =>
      typeof rawStyles === 'function'
        ? rawStyles({ props })
        : (rawStyles ?? {}),
    [rawStyles, props],
  )

  // ---- Event handlers ----
  const buildNodeEvent = useCallback(
    (flattenNode: FlattenNode<T>): EventDataNode<T> => {
      const k = flattenNode.key
      return buildEventDataNode(flattenNode, fieldNames, {
        expanded: expandedSet.has(k),
        selected: selectedSet.has(k),
        checked: checkedSet.has(k),
        halfChecked: halfCheckedSet.has(k),
        loaded: loadedSet.has(k),
        loading: loadingKeys.has(k),
        dragOver: false,
        dragOverGapTop: false,
        dragOverGapBottom: false,
        active: activeFocusKey === k,
        treeDisabled: disabled,
        treeSelectable: selectable,
      })
    },
    [
      fieldNames,
      expandedSet,
      selectedSet,
      checkedSet,
      halfCheckedSet,
      loadedSet,
      loadingKeys,
      activeFocusKey,
      disabled,
      selectable,
    ],
  )

  const handleExpand = useCallback(
    (
      key: TreeKey,
      nativeEvent: globalThis.MouseEvent | globalThis.KeyboardEvent,
    ) => {
      const idx = flattenIndexByKey.get(key)
      const flattenNode = idx !== undefined ? flattenedNodes[idx] : undefined
      if (!flattenNode || flattenNode.isLeaf) return

      const nextExpanded = !expandedSet.has(key)
      const nextExpandedKeys = nextExpanded
        ? Array.from(new Set([...effectiveExpandedKeys, key]))
        : effectiveExpandedKeys.filter((k) => k !== key)

      if (controlledExpandedKeys === undefined) {
        setInnerExpandedKeys(nextExpandedKeys)
      }

      const eventNode = buildNodeEvent(flattenNode)
      onExpand?.(nextExpandedKeys, {
        node: { ...eventNode, expanded: nextExpanded },
        expanded: nextExpanded,
        nativeEvent,
      })

      const childrenList = flattenNode.data[fieldNames.children] as
        | readonly T[]
        | undefined
      if (
        nextExpanded &&
        loadData &&
        !loadedSet.has(key) &&
        !loadingKeys.has(key) &&
        (!childrenList || childrenList.length === 0)
      ) {
        setLoadingKeys((prev) => new Set(prev).add(key))
        Promise.resolve(loadData(eventNode))
          .then(() => {
            const nextLoaded = Array.from(
              new Set([...(controlledLoadedKeys ?? innerLoadedKeys), key]),
            )
            if (controlledLoadedKeys === undefined) {
              setInnerLoadedKeys(nextLoaded)
            }
            onLoad?.(nextLoaded, {
              event: 'load',
              node: { ...eventNode, loaded: true, loading: false },
            })
          })
          .finally(() => {
            setLoadingKeys((prev) => {
              const next = new Set(prev)
              next.delete(key)
              return next
            })
          })
      }
    },
    [
      flattenIndexByKey,
      flattenedNodes,
      expandedSet,
      effectiveExpandedKeys,
      controlledExpandedKeys,
      buildNodeEvent,
      onExpand,
      fieldNames.children,
      loadData,
      loadedSet,
      loadingKeys,
      controlledLoadedKeys,
      innerLoadedKeys,
      onLoad,
    ],
  )

  const handleSelect = useCallback(
    (
      key: TreeKey,
      nativeEvent: globalThis.MouseEvent | globalThis.KeyboardEvent,
    ) => {
      const idx = flattenIndexByKey.get(key)
      const flattenNode = idx !== undefined ? flattenedNodes[idx] : undefined
      if (!flattenNode) return

      const nodeDisabled =
        disabled || Boolean(flattenNode.data[fieldNames.disabled])
      const nodeSelectable =
        flattenNode.data[fieldNames.selectable] !== undefined
          ? Boolean(flattenNode.data[fieldNames.selectable])
          : selectable
      if (nodeDisabled || !nodeSelectable) return

      setFocusedKey(key)
      const alreadySelected = selectedSet.has(key)
      const nextSelected = !alreadySelected

      let nextSelectedKeys: TreeKey[]
      if (multiple) {
        nextSelectedKeys = nextSelected
          ? [...activeSelectedKeys, key]
          : activeSelectedKeys.filter((k) => k !== key)
      } else {
        nextSelectedKeys = nextSelected ? [key] : []
      }

      if (controlledSelectedKeys === undefined) {
        setInnerSelectedKeys(nextSelectedKeys)
      }

      const selectedNodes = nextSelectedKeys
        .map((k) => keyEntities.get(k)?.node)
        .filter((n): n is T => n !== undefined)

      onSelect?.(nextSelectedKeys, {
        event: 'select',
        selected: nextSelected,
        node: { ...buildNodeEvent(flattenNode), selected: nextSelected },
        selectedNodes,
        nativeEvent,
      })
    },
    [
      flattenIndexByKey,
      flattenedNodes,
      disabled,
      fieldNames.disabled,
      fieldNames.selectable,
      selectable,
      selectedSet,
      multiple,
      activeSelectedKeys,
      controlledSelectedKeys,
      keyEntities,
      onSelect,
      buildNodeEvent,
    ],
  )

  const handleCheck = useCallback(
    (
      key: TreeKey,
      nativeEvent: globalThis.MouseEvent | globalThis.KeyboardEvent,
    ) => {
      const entity = keyEntities.get(key)
      const idx = flattenIndexByKey.get(key)
      const flattenNode = idx !== undefined ? flattenedNodes[idx] : undefined
      if (!entity || !flattenNode) return
      if (disabled || isNodeCheckDisabled(entity.node, fieldNames)) return

      const targetChecked = !checkedSet.has(key)
      let nextCheckedKeys: TreeKey[]
      let nextHalfCheckedKeys: TreeKey[]

      if (checkStrictly) {
        const nextChecked = new Set(checkedSet)
        if (targetChecked) nextChecked.add(key)
        else nextChecked.delete(key)
        nextCheckedKeys = Array.from(nextChecked)
        nextHalfCheckedKeys = Array.from(halfCheckedSet).filter(
          (k) => k !== key,
        )
      } else if (targetChecked) {
        const result = conductCheck(
          [...checkedSet, key],
          true,
          keyEntities,
          levelEntities,
          maxLevel,
          fieldNames,
          disabled,
        )
        nextCheckedKeys = result.checkedKeys
        nextHalfCheckedKeys = result.halfCheckedKeys
      } else {
        const remainingChecked = Array.from(checkedSet).filter((k) => k !== key)
        const remainingHalf = Array.from(halfCheckedSet).filter(
          (k) => k !== key,
        )
        const result = conductCheck(
          remainingChecked,
          { checked: false, halfCheckedKeys: remainingHalf },
          keyEntities,
          levelEntities,
          maxLevel,
          fieldNames,
          disabled,
        )
        nextCheckedKeys = result.checkedKeys
        nextHalfCheckedKeys = result.halfCheckedKeys
      }

      if (controlledCheckedKeys === undefined) {
        setInnerCheckedState({
          checked: nextCheckedKeys,
          halfChecked: nextHalfCheckedKeys,
        })
      }

      const checkedNodes: T[] = []
      const checkedNodesPositions: Array<{ node: T; pos: string }> = []
      for (const k of nextCheckedKeys) {
        const item = keyEntities.get(k)
        if (item) {
          checkedNodes.push(item.node)
          checkedNodesPositions.push({ node: item.node, pos: item.pos })
        }
      }

      const info: CheckInfo<T> = {
        event: 'check',
        node: {
          ...buildNodeEvent(flattenNode),
          checked: targetChecked,
          halfChecked: false,
        },
        checked: targetChecked,
        nativeEvent,
        checkedNodes,
        checkedNodesPositions,
        halfCheckedKeys: nextHalfCheckedKeys,
      }

      onCheck?.(
        checkStrictly
          ? { checked: nextCheckedKeys, halfChecked: nextHalfCheckedKeys }
          : nextCheckedKeys,
        info,
      )
    },
    [
      keyEntities,
      flattenIndexByKey,
      flattenedNodes,
      disabled,
      fieldNames,
      checkedSet,
      halfCheckedSet,
      checkStrictly,
      levelEntities,
      maxLevel,
      controlledCheckedKeys,
      buildNodeEvent,
      onCheck,
    ],
  )

  // ---- Keyboard navigation ----
  const focusRow = useCallback((key: TreeKey) => {
    setFocusedKey(key)
    const el = containerRef.current?.querySelector<HTMLElement>(
      `[data-tree-key="${CSS.escape(String(key))}"]`,
    )
    el?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>, flattenNode: FlattenNode<T>) => {
      const idx = flattenIndexByKey.get(flattenNode.key)
      if (idx === undefined) return

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          const next = flattenedNodes[idx + 1]
          if (next) focusRow(next.key)
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const prev = flattenedNodes[idx - 1]
          if (prev) focusRow(prev.key)
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          if (!flattenNode.isLeaf && !expandedSet.has(flattenNode.key)) {
            handleExpand(flattenNode.key, e.nativeEvent)
          } else if (flattenNode.children.length > 0) {
            focusRow(flattenNode.children[0].key)
          }
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          if (!flattenNode.isLeaf && expandedSet.has(flattenNode.key)) {
            handleExpand(flattenNode.key, e.nativeEvent)
          } else if (flattenNode.parent) {
            focusRow(flattenNode.parent.key)
          }
          break
        }
        case 'Home': {
          e.preventDefault()
          const first = flattenedNodes[0]
          if (first) focusRow(first.key)
          break
        }
        case 'End': {
          e.preventDefault()
          const last = flattenedNodes[flattenedNodes.length - 1]
          if (last) focusRow(last.key)
          break
        }
        case 'Enter': {
          e.preventDefault()
          handleSelect(flattenNode.key, e.nativeEvent)
          break
        }
        case ' ': {
          e.preventDefault()
          const nodeCheckable =
            flattenNode.data[fieldNames.checkable] !== undefined
              ? Boolean(flattenNode.data[fieldNames.checkable])
              : checkable
          if (nodeCheckable) {
            handleCheck(flattenNode.key, e.nativeEvent)
          } else {
            handleSelect(flattenNode.key, e.nativeEvent)
          }
          break
        }
      }
    },
    [
      flattenIndexByKey,
      flattenedNodes,
      focusRow,
      expandedSet,
      handleExpand,
      handleSelect,
      fieldNames.checkable,
      checkable,
      handleCheck,
    ],
  )

  // ---- Drag & Drop state ----
  const [dragKey, setDragKey] = useState<TreeKey | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    key: TreeKey
    position: -1 | 0 | 1
  } | null>(null)

  const isTreeDraggable = Boolean(draggable)
  const dragIcon =
    typeof draggable === 'object' && draggable !== null
      ? (draggable.icon ?? undefined)
      : undefined
  const isNodeDraggable = useCallback(
    (nodeData: T): boolean => {
      if (!draggable || disabled) return false
      if (typeof draggable === 'function') return draggable(nodeData)
      if (typeof draggable === 'object' && draggable.nodeDraggable) {
        return draggable.nodeDraggable(nodeData)
      }
      return true
    },
    [draggable, disabled],
  )

  const isDescendant = useCallback(
    (ancestorKey: TreeKey, candidateKey: TreeKey): boolean => {
      let current = keyEntities.get(candidateKey)
      while (current) {
        if (current.key === ancestorKey) return true
        current = current.parent ?? undefined
      }
      return false
    },
    [keyEntities],
  )

  const resolveCanDrop = useCallback(
    (
      dragNodeKey: TreeKey,
      dropNode: EventDataNode<T>,
      dropPosition: -1 | 0 | 1,
    ): boolean => {
      if (
        dragNodeKey === dropNode.key ||
        isDescendant(dragNodeKey, dropNode.key)
      ) {
        return false
      }
      if (!allowDrop) return true
      const dragIdx = flattenIndexByKey.get(dragNodeKey)
      const dragFlatten =
        dragIdx !== undefined ? flattenedNodes[dragIdx] : undefined
      if (!dragFlatten) return false
      return allowDrop({
        dragNode: buildNodeEvent(dragFlatten),
        dropNode,
        dropPosition,
      })
    },
    [
      isDescendant,
      allowDrop,
      flattenIndexByKey,
      flattenedNodes,
      buildNodeEvent,
    ],
  )

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(node.key))
      setDragKey(node.key)
      onDragStart?.({ event: e, node })
    },
    [onDragStart],
  )

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => {
      e.preventDefault()
      if (dragKey === null || dragKey === node.key) return
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = calcDropPosition(e.clientY, rect)
      if (resolveCanDrop(dragKey, node, pos)) {
        setDropTarget({ key: node.key, position: pos })
      }
      onDragEnter?.({ event: e, node, expandedKeys: effectiveExpandedKeys })
    },
    [dragKey, resolveCanDrop, onDragEnter, effectiveExpandedKeys],
  )

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => {
      e.preventDefault()
      if (dragKey === null) return
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = calcDropPosition(e.clientY, rect)
      if (resolveCanDrop(dragKey, node, pos)) {
        e.dataTransfer.dropEffect = 'move'
        setDropTarget((prev) =>
          prev?.key === node.key && prev.position === pos
            ? prev
            : { key: node.key, position: pos },
        )
      } else {
        e.dataTransfer.dropEffect = 'none'
        setDropTarget(null)
      }
      onDragOver?.({ event: e, node })
    },
    [dragKey, resolveCanDrop, onDragOver],
  )

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => {
      onDragLeave?.({ event: e, node })
    },
    [onDragLeave],
  )

  const handleDragEnd = useCallback(
    (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => {
      setDragKey(null)
      setDropTarget(null)
      onDragEnd?.({ event: e, node })
    },
    [onDragEnd],
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>, node: EventDataNode<T>) => {
      e.preventDefault()
      const activeDragKey = dragKey
      setDragKey(null)
      setDropTarget(null)
      if (activeDragKey === null) return

      const rect = e.currentTarget.getBoundingClientRect()
      const relPos = calcDropPosition(e.clientY, rect)
      if (!resolveCanDrop(activeDragKey, node, relPos)) return

      const dragIdx = flattenIndexByKey.get(activeDragKey)
      const dragFlatten =
        dragIdx !== undefined ? flattenedNodes[dragIdx] : undefined
      const dragEntity = keyEntities.get(activeDragKey)
      const dropEntity = keyEntities.get(node.key)
      if (!dragFlatten || !dragEntity || !dropEntity) return

      const dragNode = buildNodeEvent(dragFlatten)
      const dragNodesKeys = getDragNodesKeys(activeDragKey, keyEntities)
      const dropPosition = dropEntity.index + relPos

      onDrop?.({
        event: e,
        node,
        dragNode,
        dragNodesKeys,
        dropPosition,
        dropToGap: relPos !== 0,
      })
    },
    [
      dragKey,
      resolveCanDrop,
      flattenIndexByKey,
      flattenedNodes,
      keyEntities,
      buildNodeEvent,
      onDrop,
    ],
  )

  // ---- Sibling counts for aria-setsize / aria-posinset ----
  const siblingMeta = useMemo(() => {
    const map = new Map<TreeKey, { setSize: number; posInSet: number }>()
    const walk = (nodes: readonly T[], parentPos: string) => {
      nodes.forEach((node, index) => {
        const pos = `${parentPos}-${index}`
        const key =
          node[fieldNames.key] !== undefined
            ? (node[fieldNames.key] as TreeKey)
            : pos
        map.set(key, { setSize: nodes.length, posInSet: index + 1 })
        const kids = node[fieldNames.children] as
          | readonly T[]
          | null
          | undefined
        if (kids && kids.length > 0) walk(kids, pos)
      })
    }
    walk(mergedTreeData, '0')
    return map
  }, [mergedTreeData, fieldNames.key, fieldNames.children])

  // ---- Virtual slice calculation ----
  const { visibleNodes, totalHeight, offsetY } = useMemo(() => {
    if (
      !isVirtual ||
      effectiveItemHeight === undefined ||
      height === undefined
    ) {
      return {
        visibleNodes: flattenedNodes,
        totalHeight: undefined,
        offsetY: 0,
      }
    }

    const total = flattenedNodes.length * effectiveItemHeight
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / effectiveItemHeight) - VIRTUAL_OVERSCAN,
    )
    const endIndex = Math.min(
      flattenedNodes.length,
      Math.ceil((scrollTop + height) / effectiveItemHeight) + VIRTUAL_OVERSCAN,
    )

    return {
      visibleNodes: flattenedNodes.slice(startIndex, endIndex),
      totalHeight: total,
      offsetY: startIndex * effectiveItemHeight,
    }
  }, [isVirtual, effectiveItemHeight, height, flattenedNodes, scrollTop])

  const renderRows = () =>
    visibleNodes.map((flattenNode) => {
      const k = flattenNode.key
      const expanded = expandedSet.has(k)
      const selected = selectedSet.has(k)
      const checked = checkedSet.has(k)
      const halfChecked = halfCheckedSet.has(k)
      const loaded = loadedSet.has(k)
      const loading = loadingKeys.has(k)
      const dragOver = dropTarget?.key === k && dropTarget.position === 0
      const dragOverGapTop = dropTarget?.key === k && dropTarget.position === -1
      const dragOverGapBottom =
        dropTarget?.key === k && dropTarget.position === 1
      const eventNode = buildNodeEvent(flattenNode)
      const matchedFilter = filterTreeNode
        ? Boolean(filterTreeNode(eventNode))
        : false
      const ariaPos = siblingMeta.get(k) ?? { setSize: 1, posInSet: 1 }

      return (
        <TreeNodeRow
          key={String(k)}
          flattenNode={flattenNode}
          fieldNames={fieldNames}
          expanded={expanded}
          selected={selected}
          checked={checked}
          halfChecked={halfChecked}
          loaded={loaded}
          loading={loading}
          active={activeFocusKey === k}
          treeDisabled={disabled}
          treeCheckable={checkable}
          treeSelectable={selectable}
          blockNode={blockNode}
          showIcon={showIcon}
          showLine={showLine}
          directoryMode={_directoryMode}
          treeDraggable={isTreeDraggable}
          draggable={isTreeDraggable && isNodeDraggable(flattenNode.data)}
          dragIcon={dragIcon ?? undefined}
          dragOver={dragOver}
          dragOverGapTop={dragOverGapTop}
          dragOverGapBottom={dragOverGapBottom}
          matchedFilter={matchedFilter}
          itemHeight={effectiveItemHeight}
          setSize={ariaPos.setSize}
          posInSet={ariaPos.posInSet}
          isFocused={activeFocusKey === k}
          switcherIcon={switcherIcon}
          switcherLoadingIcon={switcherLoadingIcon}
          treeIcon={treeIcon}
          titleRender={titleRender}
          semanticClassNames={semanticClassNames}
          semanticStyles={semanticStyles}
          onExpand={handleExpand}
          onSelect={handleSelect}
          onCheck={handleCheck}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onRightClick={onRightClick}
          onKeyDown={handleKeyDown}
          onDragStart={handleDragStart}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        />
      )
    })

  return (
    <div
      ref={containerRef}
      id={id}
      role="tree"
      aria-label={ariaLabel}
      aria-multiselectable={multiple || undefined}
      aria-disabled={disabled || undefined}
      data-slot="tree"
      data-directory={_directoryMode || undefined}
      onScroll={handleContainerScroll}
      className={cn(
        'flex flex-col text-[13px] text-foreground',
        isVirtual && 'overflow-y-auto',
        rootClassName,
        semanticClassNames.root,
        className,
      )}
      style={{
        ...(isVirtual && height !== undefined ? { height } : undefined),
        ...rootStyle,
        ...semanticStyles.root,
        ...style,
      }}
    >
      {isVirtual && totalHeight !== undefined ? (
        <div className="relative w-full" style={{ height: totalHeight }}>
          <div
            className="absolute right-0 left-0 flex flex-col"
            style={{ transform: `translateY(${offsetY}px)` }}
          >
            {renderRows()}
          </div>
        </div>
      ) : (
        renderRows()
      )}
    </div>
  )
}

export const TreeRoot = forwardRef(TreeImpl) as <
  T extends BasicDataNode = TreeDataNode,
>(
  props: InternalTreeProps<T> & { ref?: ForwardedRef<TreeRef> },
) => ReactElement
