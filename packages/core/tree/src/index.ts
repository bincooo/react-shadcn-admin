import type { ForwardedRef, ReactElement } from 'react'
import { DirectoryTree } from './directory-tree'
import { TreeNode, TreeRoot, useTree } from './tree'
import type { BasicDataNode, TreeDataNode, TreeProps, TreeRef } from './types'

type TreeComponent = (<T extends BasicDataNode = TreeDataNode>(
  props: TreeProps<T> & { ref?: ForwardedRef<TreeRef> },
) => ReactElement) & {
  TreeNode: typeof TreeNode
  DirectoryTree: typeof DirectoryTree
  useTree: typeof useTree
}

export const Tree = Object.assign(TreeRoot, {
  TreeNode,
  DirectoryTree,
  useTree,
}) as TreeComponent

export { DirectoryTree, TreeNode, useTree }
export { TreeSelect } from './tree-select'
export {
  buildKeyEntities,
  collectAllExpandableKeys,
  conductCheck,
  conductExpandParent,
  fillFieldNames,
  filterTree,
  filterTreeWithAncestors,
  flattenTreeData,
  mapTree,
  type ResolvedFieldNames,
} from './tree-utils'

export type {
  AllowDropOptions,
  AntTreeNodeProps,
  BasicDataNode,
  CheckInfo,
  DataEntity,
  DataNode,
  DirectoryTreeProps,
  DragEnterInfo,
  DragInfo,
  DropInfo,
  EventDataNode,
  ExpandInfo,
  FlattenNode,
  LoadInfo,
  SelectInfo,
  TreeClassNames,
  TreeDataNode,
  TreeDraggableConfig,
  TreeFieldNames,
  TreeInstance,
  TreeKey,
  TreeNodeProps,
  TreeProps,
  TreeRef,
  TreeScrollToConfig,
  TreeSelectFieldNames,
  TreeSelectProps,
  TreeSemanticName,
  TreeShowLine,
  TreeStyles,
} from './types'
