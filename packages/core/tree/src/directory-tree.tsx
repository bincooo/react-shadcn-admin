import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type MouseEvent,
  type ReactElement,
} from 'react'
import { FileText, Folder, FolderOpen } from 'lucide-react'
import { TreeRoot } from './tree'
import {
  buildKeyEntities,
  collectAllExpandableKeys,
  conductExpandParent,
  convertChildrenToData,
  fillFieldNames,
  flattenTreeData,
} from './tree-utils'
import type {
  AntTreeNodeProps,
  BasicDataNode,
  DirectoryTreeProps,
  EventDataNode,
  SelectInfo,
  TreeDataNode,
  TreeKey,
  TreeRef,
} from './types'

function DirectoryTreeImpl<T extends BasicDataNode = TreeDataNode>(
  props: DirectoryTreeProps<T>,
  ref: ForwardedRef<TreeRef>,
) {
  const {
    expandAction = 'click',
    showIcon = true,
    blockNode = true,
    icon,
    multiple = false,
    treeData,
    children,
    fieldNames: rawFieldNames,
    defaultExpandAll = false,
    defaultExpandedKeys,
    defaultExpandParent = true,
    expandedKeys: controlledExpandedKeys,
    defaultSelectedKeys = [],
    selectedKeys: controlledSelectedKeys,
    onExpand,
    onSelect,
    onDoubleClick,
    ...restProps
  } = props

  const fieldNames = useMemo(
    () => fillFieldNames(rawFieldNames),
    [rawFieldNames],
  )

  const mergedTreeData = useMemo(() => {
    if (treeData !== undefined) return treeData as readonly T[]
    return convertChildrenToData(children) as unknown as readonly T[]
  }, [treeData, children])

  const { keyEntities } = useMemo(
    () => buildKeyEntities(mergedTreeData, fieldNames),
    [mergedTreeData, fieldNames],
  )

  // Manage expand state here so expandAction click/doubleClick works smoothly in uncontrolled mode
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

  const activeExpandedKeys =
    controlledExpandedKeys !== undefined
      ? controlledExpandedKeys
      : innerExpandedKeys

  const [innerSelectedKeys, setInnerSelectedKeys] = useState<TreeKey[]>(() => [
    ...defaultSelectedKeys,
  ])
  const activeSelectedKeys =
    controlledSelectedKeys !== undefined
      ? controlledSelectedKeys
      : innerSelectedKeys

  const lastSelectedKeyRef = useRef<TreeKey | null>(
    activeSelectedKeys[0] ?? null,
  )

  const toggleExpandNode = useCallback(
    (
      node: EventDataNode<T>,
      nativeEvent: globalThis.MouseEvent | globalThis.KeyboardEvent,
    ) => {
      if (node.isLeaf) return
      const expandedSet = new Set(activeExpandedKeys)
      const nextExpanded = !expandedSet.has(node.key)
      const nextKeys = nextExpanded
        ? Array.from(new Set([...activeExpandedKeys, node.key]))
        : activeExpandedKeys.filter((k) => k !== node.key)

      if (controlledExpandedKeys === undefined) {
        setInnerExpandedKeys(nextKeys)
      }
      onExpand?.(nextKeys, {
        node: { ...node, expanded: nextExpanded },
        expanded: nextExpanded,
        nativeEvent,
      })
    },
    [activeExpandedKeys, controlledExpandedKeys, onExpand],
  )

  const handleSelect = useCallback(
    (keys: TreeKey[], info: SelectInfo<T>) => {
      const { node, nativeEvent } = info
      const isMouseEvent = 'ctrlKey' in nativeEvent || 'metaKey' in nativeEvent
      const ctrlOrMeta =
        isMouseEvent && (nativeEvent.ctrlKey || nativeEvent.metaKey)
      const shift = isMouseEvent && nativeEvent.shiftKey

      let nextSelectedKeys = keys

      if (multiple) {
        if (shift && lastSelectedKeyRef.current !== null) {
          const expandedSet = new Set(activeExpandedKeys)
          const flattened = flattenTreeData(
            mergedTreeData,
            expandedSet,
            fieldNames,
            Boolean(props.loadData),
          )
          const startIdx = flattened.findIndex(
            (item) => item.key === lastSelectedKeyRef.current,
          )
          const endIdx = flattened.findIndex((item) => item.key === node.key)
          if (startIdx !== -1 && endIdx !== -1) {
            const [minIdx, maxIdx] =
              startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
            nextSelectedKeys = flattened
              .slice(minIdx, maxIdx + 1)
              .filter((item) => {
                const isDisabled =
                  props.disabled || Boolean(item.data[fieldNames.disabled])
                const isSelectable =
                  item.data[fieldNames.selectable] !== undefined
                    ? Boolean(item.data[fieldNames.selectable])
                    : (props.selectable ?? true)
                return !isDisabled && isSelectable
              })
              .map((item) => item.key)
          }
        } else if (ctrlOrMeta) {
          const prevSet = new Set(activeSelectedKeys)
          if (prevSet.has(node.key)) prevSet.delete(node.key)
          else prevSet.add(node.key)
          nextSelectedKeys = Array.from(prevSet)
          lastSelectedKeyRef.current = node.key
        } else {
          nextSelectedKeys = [node.key]
          lastSelectedKeyRef.current = node.key
        }
      } else {
        nextSelectedKeys = [node.key]
        lastSelectedKeyRef.current = node.key
      }

      if (controlledSelectedKeys === undefined) {
        setInnerSelectedKeys(nextSelectedKeys)
      }

      const selectedNodes = nextSelectedKeys
        .map((k) => keyEntities.get(k)?.node)
        .filter((n): n is T => n !== undefined)

      onSelect?.(nextSelectedKeys, {
        ...info,
        selected: nextSelectedKeys.includes(node.key),
        selectedNodes,
      })

      if (expandAction === 'click') {
        toggleExpandNode(node, nativeEvent)
      }
    },
    [
      multiple,
      activeExpandedKeys,
      mergedTreeData,
      fieldNames,
      props.loadData,
      props.disabled,
      props.selectable,
      activeSelectedKeys,
      controlledSelectedKeys,
      keyEntities,
      onSelect,
      expandAction,
      toggleExpandNode,
    ],
  )

  const handleDoubleClick = useCallback(
    (e: MouseEvent<HTMLElement>, node: EventDataNode<T>) => {
      onDoubleClick?.(e, node)
      if (expandAction === 'doubleClick') {
        toggleExpandNode(node, e.nativeEvent)
      }
    },
    [onDoubleClick, expandAction, toggleExpandNode],
  )

  const defaultDirectoryIcon = useCallback((nodeProps: AntTreeNodeProps<T>) => {
    if (nodeProps.isLeaf) {
      return <FileText className="size-3.5" />
    }
    return nodeProps.expanded ? (
      <FolderOpen className="size-3.5" />
    ) : (
      <Folder className="size-3.5" />
    )
  }, [])

  return (
    <TreeRoot<T>
      ref={ref}
      {...restProps}
      treeData={treeData}
      fieldNames={rawFieldNames}
      showIcon={showIcon}
      blockNode={blockNode}
      multiple={multiple}
      icon={icon ?? defaultDirectoryIcon}
      expandedKeys={activeExpandedKeys}
      selectedKeys={activeSelectedKeys}
      onExpand={(keys, info) => {
        if (controlledExpandedKeys === undefined) {
          setInnerExpandedKeys(keys)
        }
        onExpand?.(keys, info)
      }}
      onSelect={handleSelect}
      onDoubleClick={handleDoubleClick}
      _directoryMode
    >
      {children}
    </TreeRoot>
  )
}

export const DirectoryTree = forwardRef(DirectoryTreeImpl) as <
  T extends BasicDataNode = TreeDataNode,
>(
  props: DirectoryTreeProps<T> & { ref?: ForwardedRef<TreeRef> },
) => ReactElement
