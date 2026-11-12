import { Children, isValidElement, type ReactNode } from 'react'
import type {
  BasicDataNode,
  DataEntity,
  FlattenNode,
  TreeDataNode,
  TreeFieldNames,
  TreeKey,
  TreeNodeProps,
} from './types'

export interface ResolvedFieldNames {
  title: string
  key: string
  children: string
  disabled: string
  selectable: string
  disableCheckbox: string
  checkable: string
  isLeaf: string
}

export function fillFieldNames(
  fieldNames?: TreeFieldNames,
): ResolvedFieldNames {
  return {
    title: fieldNames?.title ?? 'title',
    key: fieldNames?.key ?? 'key',
    children: fieldNames?.children ?? 'children',
    disabled: fieldNames?.disabled ?? 'disabled',
    selectable: fieldNames?.selectable ?? 'selectable',
    disableCheckbox: fieldNames?.disableCheckbox ?? 'disableCheckbox',
    checkable: fieldNames?.checkable ?? 'checkable',
    isLeaf: fieldNames?.isLeaf ?? 'isLeaf',
  }
}

export function getNodeKey<T extends BasicDataNode>(
  node: T,
  fieldNames: ResolvedFieldNames,
  fallbackPos: string,
): TreeKey {
  const rawKey = node[fieldNames.key]
  if (rawKey !== undefined && rawKey !== null) {
    return rawKey as TreeKey
  }
  return fallbackPos
}

export function getNodeChildren<T extends BasicDataNode>(
  node: T,
  fieldNames: ResolvedFieldNames,
): readonly T[] | null | undefined {
  return node[fieldNames.children] as readonly T[] | null | undefined
}

export function isNodeCheckDisabled<T extends BasicDataNode>(
  node: T,
  fieldNames: ResolvedFieldNames,
): boolean {
  return Boolean(
    node[fieldNames.disabled] ||
      node[fieldNames.disableCheckbox] ||
      node[fieldNames.checkable] === false,
  )
}

/** Convert declarative `<Tree.TreeNode />` JSX children to `TreeDataNode[]`. */
export function convertChildrenToData(children: ReactNode): TreeDataNode[] {
  const result: TreeDataNode[] = []
  Children.forEach(children, (child, index) => {
    if (!isValidElement<TreeNodeProps>(child)) return
    const { children: childNodes, title, ...restProps } = child.props
    const key = (child.key ?? `rc-tree-node-${index}`) as TreeKey
    const dataNode: TreeDataNode = {
      ...restProps,
      key,
      title,
    }
    if (childNodes !== undefined && childNodes !== null) {
      const converted = convertChildrenToData(childNodes)
      if (converted.length > 0) {
        dataNode.children = converted
      }
    }
    result.push(dataNode)
  })
  return result
}

export interface KeyEntitiesResult<T extends BasicDataNode> {
  keyEntities: Map<TreeKey, DataEntity<T>>
  posEntities: Map<string, DataEntity<T>>
  levelEntities: Map<number, Set<DataEntity<T>>>
  maxLevel: number
}

export function buildKeyEntities<T extends BasicDataNode>(
  treeData: readonly T[],
  fieldNames: ResolvedFieldNames,
): KeyEntitiesResult<T> {
  const keyEntities = new Map<TreeKey, DataEntity<T>>()
  const posEntities = new Map<string, DataEntity<T>>()
  const levelEntities = new Map<number, Set<DataEntity<T>>>()
  let maxLevel = 0

  const visit = (
    nodes: readonly T[],
    parent: DataEntity<T> | null,
    parentPos: string,
    level: number,
  ) => {
    if (level > maxLevel) maxLevel = level
    let levelSet = levelEntities.get(level)
    if (!levelSet) {
      levelSet = new Set()
      levelEntities.set(level, levelSet)
    }

    nodes.forEach((node, index) => {
      const pos = `${parentPos}-${index}`
      const key = getNodeKey(node, fieldNames, pos)
      const entity: DataEntity<T> = {
        node,
        key,
        index,
        pos,
        level,
        parent,
        children: [],
      }
      keyEntities.set(key, entity)
      posEntities.set(pos, entity)
      levelSet.add(entity)
      if (parent) {
        parent.children.push(entity)
      }

      const children = getNodeChildren(node, fieldNames)
      if (children && children.length > 0) {
        visit(children, entity, pos, level + 1)
      }
    })
  }

  visit(treeData, null, '0', 0)
  return { keyEntities, posEntities, levelEntities, maxLevel }
}

export function flattenTreeData<T extends BasicDataNode>(
  treeData: readonly T[],
  expandedKeys: ReadonlySet<TreeKey>,
  fieldNames: ResolvedFieldNames,
  hasLoadData = false,
): FlattenNode<T>[] {
  const flattenList: FlattenNode<T>[] = []

  const dig = (
    nodes: readonly T[],
    parent: FlattenNode<T> | null,
    parentPos: string,
    level: number,
    parentIsStart: boolean[],
    parentIsEnd: boolean[],
  ): FlattenNode<T>[] => {
    return nodes.map((node, index) => {
      const pos = `${parentPos}-${index}`
      const key = getNodeKey(node, fieldNames, pos)
      const children = getNodeChildren(node, fieldNames)
      const explicitIsLeaf = node[fieldNames.isLeaf] as boolean | undefined
      const isLeaf =
        explicitIsLeaf !== undefined
          ? Boolean(explicitIsLeaf)
          : hasLoadData && children == null
            ? false
            : !(children && children.length > 0)

      const isStart = [...parentIsStart, index === 0]
      const isEnd = [...parentIsEnd, index === nodes.length - 1]

      const flattenNode: FlattenNode<T> = {
        key,
        data: node,
        parent,
        children: [],
        pos,
        level,
        isStart,
        isEnd,
        isLeaf,
      }
      flattenList.push(flattenNode)

      if (expandedKeys.has(key) && children && children.length > 0) {
        flattenNode.children = dig(
          children,
          flattenNode,
          pos,
          level + 1,
          isStart,
          isEnd,
        )
      }

      return flattenNode
    })
  }

  dig(treeData, null, '0', 0, [], [])
  return flattenList
}

export function collectAllExpandableKeys<T extends BasicDataNode>(
  treeData: readonly T[],
  fieldNames: ResolvedFieldNames,
): TreeKey[] {
  const keys: TreeKey[] = []
  const walk = (nodes: readonly T[], parentPos: string) => {
    nodes.forEach((node, index) => {
      const pos = `${parentPos}-${index}`
      const key = getNodeKey(node, fieldNames, pos)
      const children = getNodeChildren(node, fieldNames)
      if (children && children.length > 0) {
        keys.push(key)
        walk(children, pos)
      }
    })
  }
  walk(treeData, '0')
  return keys
}

export function conductExpandParent<T extends BasicDataNode>(
  keyList: readonly TreeKey[],
  keyEntities: Map<TreeKey, DataEntity<T>>,
): TreeKey[] {
  const expanded = new Set<TreeKey>()

  const dig = (key: TreeKey) => {
    if (expanded.has(key)) return
    const entity = keyEntities.get(key)
    if (!entity) return
    expanded.add(key)
    if (entity.parent) {
      dig(entity.parent.key)
    }
  }

  for (const key of keyList) {
    dig(key)
  }
  return Array.from(expanded)
}

export interface ConductCheckResult {
  checkedKeys: TreeKey[]
  halfCheckedKeys: TreeKey[]
}

/**
 * Ant Design / rc-tree check conductance:
 * - Stops at disabled / disableCheckbox / checkable=false nodes.
 * - Supports both checking (`checked: true`) and unchecking (`checked: false`).
 */
export function conductCheck<T extends BasicDataNode>(
  keyList: readonly TreeKey[],
  checked: true | { checked: false; halfCheckedKeys: readonly TreeKey[] },
  keyEntities: Map<TreeKey, DataEntity<T>>,
  levelEntities: Map<number, Set<DataEntity<T>>>,
  maxLevel: number,
  fieldNames: ResolvedFieldNames,
  treeDisabled = false,
): ConductCheckResult {
  const isDisabled = (entity: DataEntity<T>) =>
    treeDisabled || isNodeCheckDisabled(entity.node, fieldNames)

  const checkedSet = new Set<TreeKey>()
  const halfCheckedSet = new Set<TreeKey>()

  for (const key of keyList) {
    if (keyEntities.has(key)) {
      checkedSet.add(key)
    }
  }

  if (checked === true) {
    // Top-down fill: propagate check to enabled descendants
    for (let level = 0; level <= maxLevel; level += 1) {
      const entities = levelEntities.get(level)
      if (!entities) continue
      for (const entity of entities) {
        if (!checkedSet.has(entity.key) || isDisabled(entity)) continue
        for (const child of entity.children) {
          if (!isDisabled(child)) {
            checkedSet.add(child.key)
          }
        }
      }
    }
  } else {
    for (const key of checked.halfCheckedKeys) {
      if (keyEntities.has(key)) {
        halfCheckedSet.add(key)
      }
    }

    // Top-down clean: if parent is neither checked nor halfChecked, clear enabled children
    for (let level = 0; level <= maxLevel; level += 1) {
      const entities = levelEntities.get(level)
      if (!entities) continue
      for (const entity of entities) {
        if (
          checkedSet.has(entity.key) ||
          halfCheckedSet.has(entity.key) ||
          isDisabled(entity)
        ) {
          continue
        }
        for (const child of entity.children) {
          if (!isDisabled(child)) {
            checkedSet.delete(child.key)
            halfCheckedSet.delete(child.key)
          }
        }
      }
    }
  }

  // Bottom-up calculate: sync parent checked / halfChecked from enabled children
  for (let level = maxLevel; level >= 0; level -= 1) {
    const entities = levelEntities.get(level)
    if (!entities) continue
    for (const entity of entities) {
      if (isDisabled(entity)) continue
      const enabledChildren = entity.children.filter(
        (child) => !isDisabled(child),
      )
      if (enabledChildren.length === 0) continue

      let allChecked = true
      let anyCheckedOrHalf = false

      for (const child of enabledChildren) {
        const childChecked = checkedSet.has(child.key)
        const childHalf = halfCheckedSet.has(child.key)
        if (childChecked || childHalf) {
          anyCheckedOrHalf = true
        }
        if (!childChecked) {
          allChecked = false
        }
      }

      if (allChecked) {
        checkedSet.add(entity.key)
        halfCheckedSet.delete(entity.key)
      } else if (anyCheckedOrHalf) {
        checkedSet.delete(entity.key)
        halfCheckedSet.add(entity.key)
      } else {
        checkedSet.delete(entity.key)
        halfCheckedSet.delete(entity.key)
      }
    }
  }

  return {
    checkedKeys: Array.from(checkedSet),
    halfCheckedKeys: Array.from(halfCheckedSet),
  }
}

export function getDragNodesKeys<T extends BasicDataNode>(
  dragKey: TreeKey,
  keyEntities: Map<TreeKey, DataEntity<T>>,
): TreeKey[] {
  const keys: TreeKey[] = []
  const dig = (entity: DataEntity<T>) => {
    keys.push(entity.key)
    for (const child of entity.children) {
      dig(child)
    }
  }
  const root = keyEntities.get(dragKey)
  if (root) dig(root)
  return keys
}

export function calcDropPosition(clientY: number, rect: DOMRect): -1 | 0 | 1 {
  const offsetTop = clientY - rect.top
  const threshold = Math.min(rect.height * 0.25, 8)
  if (offsetTop <= threshold) return -1
  if (offsetTop >= rect.height - threshold) return 1
  return 0
}

/** Drop nodes that fail `keep`; keep matching nodes and recurse into children. */
export function filterTree<T extends { children?: T[] | null }>(
  nodes: readonly T[],
  keep: (node: T) => boolean,
  childrenKey: keyof T = 'children' as keyof T,
): T[] {
  const result: T[] = []
  for (const node of nodes) {
    if (!keep(node)) continue
    const rawChildren =
      (node[childrenKey] as readonly T[] | null | undefined) ?? []
    const children = filterTree(rawChildren, keep, childrenKey)
    result.push({
      ...node,
      [childrenKey]: children.length > 0 ? children : undefined,
    })
  }
  return result
}

/**
 * Map children first, then the current node. `transform` returning null drops
 * the node. Processing children first lets the parent mapping see mapped kids.
 */
export function mapTree<T, R>(
  nodes: readonly T[],
  transform: (node: T, children: R[]) => R | null,
  childrenOf: (node: T) => readonly T[] | null | undefined,
): R[] {
  const result: R[] = []
  for (const node of nodes) {
    const children = mapTree(childrenOf(node) ?? [], transform, childrenOf)
    const mapped = transform(node, children)
    if (mapped !== null) result.push(mapped)
  }
  return result
}

/** Keep matching nodes and their ancestors; prune unmatched branches in one pass. */
export function filterTreeWithAncestors<T extends { children?: T[] | null }>(
  nodes: readonly T[],
  matches: (node: T) => boolean,
  childrenKey: keyof T = 'children' as keyof T,
): T[] {
  return mapTree(
    nodes,
    (node, children) => {
      if (!matches(node) && children.length === 0) return null
      return {
        ...node,
        [childrenKey]: children.length > 0 ? children : undefined,
      }
    },
    (node) => node[childrenKey] as readonly T[] | null | undefined,
  )
}
