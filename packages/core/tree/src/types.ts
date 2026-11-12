import type { CSSProperties, DragEvent, MouseEvent, ReactNode } from 'react'

export type TreeKey = string | number

export type BasicDataNode = Record<string, any>

export interface TreeFieldNames {
  title?: string
  key?: string
  children?: string
  disabled?: string
  selectable?: string
  disableCheckbox?: string
  checkable?: string
  isLeaf?: string
}

export interface TreeDataNode extends BasicDataNode {
  key: TreeKey
  title?: ReactNode | ((data: TreeDataNode) => ReactNode)
  children?: TreeDataNode[] | null
  disabled?: boolean
  disableCheckbox?: boolean
  selectable?: boolean
  checkable?: boolean
  isLeaf?: boolean
  icon?: ReactNode | ((props: AntTreeNodeProps<TreeDataNode>) => ReactNode)
  switcherIcon?:
    | ReactNode
    | ((props: AntTreeNodeProps<TreeDataNode>) => ReactNode)
  className?: string
  style?: CSSProperties
}

export type DataNode = TreeDataNode

export interface AntTreeNodeProps<T extends BasicDataNode = TreeDataNode> {
  key: TreeKey
  eventKey: TreeKey
  expanded: boolean
  selected: boolean
  checked: boolean
  loaded: boolean
  loading: boolean
  halfChecked: boolean
  dragOver: boolean
  dragOverGapTop: boolean
  dragOverGapBottom: boolean
  pos: string
  active: boolean
  isLeaf: boolean
  disabled: boolean
  disableCheckbox: boolean
  selectable: boolean
  checkable?: boolean
  title?: ReactNode
  data: T
}

export type EventDataNode<T extends BasicDataNode = TreeDataNode> = T &
  AntTreeNodeProps<T>

export interface DataEntity<T extends BasicDataNode = TreeDataNode> {
  node: T
  key: TreeKey
  index: number
  pos: string
  level: number
  parent: DataEntity<T> | null
  children: DataEntity<T>[]
}

export interface FlattenNode<T extends BasicDataNode = TreeDataNode> {
  key: TreeKey
  data: T
  parent: FlattenNode<T> | null
  children: FlattenNode<T>[]
  pos: string
  level: number
  isStart: boolean[]
  isEnd: boolean[]
  isLeaf: boolean
}

export type TreeSemanticName =
  | 'root'
  | 'item'
  | 'itemIcon'
  | 'itemTitle'
  | 'itemSwitcher'

export type TreeClassNames<T extends BasicDataNode = TreeDataNode> =
  | Partial<Record<TreeSemanticName, string>>
  | ((info: {
      props: TreeProps<T>
    }) => Partial<Record<TreeSemanticName, string>>)

export type TreeStyles<T extends BasicDataNode = TreeDataNode> =
  | Partial<Record<TreeSemanticName, CSSProperties>>
  | ((info: {
      props: TreeProps<T>
    }) => Partial<Record<TreeSemanticName, CSSProperties>>)

export type TreeShowLine<T extends BasicDataNode = TreeDataNode> =
  | boolean
  | {
      showLeafIcon?:
        | boolean
        | ReactNode
        | ((props: AntTreeNodeProps<T>) => ReactNode)
    }

export type TreeDraggableConfig<T extends BasicDataNode = TreeDataNode> =
  | boolean
  | ((node: T) => boolean)
  | {
      icon?: ReactNode | false
      nodeDraggable?: (node: T) => boolean
    }

export interface AllowDropOptions<T extends BasicDataNode = TreeDataNode> {
  dragNode: EventDataNode<T>
  dropNode: EventDataNode<T>
  dropPosition: -1 | 0 | 1
}

export interface ExpandInfo<T extends BasicDataNode = TreeDataNode> {
  node: EventDataNode<T>
  expanded: boolean
  nativeEvent: globalThis.MouseEvent | globalThis.KeyboardEvent
}

export interface SelectInfo<T extends BasicDataNode = TreeDataNode> {
  event: 'select'
  selected: boolean
  node: EventDataNode<T>
  selectedNodes: T[]
  nativeEvent: globalThis.MouseEvent | globalThis.KeyboardEvent
}

export interface CheckInfo<T extends BasicDataNode = TreeDataNode> {
  event: 'check'
  node: EventDataNode<T>
  checked: boolean
  nativeEvent: globalThis.MouseEvent | globalThis.KeyboardEvent
  checkedNodes: T[]
  checkedNodesPositions?: Array<{ node: T; pos: string }>
  halfCheckedKeys?: TreeKey[]
}

export interface LoadInfo<T extends BasicDataNode = TreeDataNode> {
  event: 'load'
  node: EventDataNode<T>
}

export interface DragInfo<T extends BasicDataNode = TreeDataNode> {
  event: DragEvent<HTMLElement>
  node: EventDataNode<T>
}

export interface DragEnterInfo<T extends BasicDataNode = TreeDataNode>
  extends DragInfo<T> {
  expandedKeys: TreeKey[]
}

export interface DropInfo<T extends BasicDataNode = TreeDataNode> {
  event: DragEvent<HTMLElement>
  node: EventDataNode<T>
  dragNode: EventDataNode<T>
  dragNodesKeys: TreeKey[]
  dropPosition: number
  dropToGap: boolean
}

export interface TreeScrollToConfig {
  key: TreeKey
  align?: 'top' | 'bottom' | 'auto'
  offset?: number
  autoExpand?: boolean
}

export interface TreeRef {
  scrollTo: (config: TreeScrollToConfig) => void
}

export interface TreeInstance<T extends BasicDataNode = TreeDataNode> {
  getPath: (key: TreeKey) => T[]
}

export interface TreeNodeProps<T extends BasicDataNode = TreeDataNode> {
  key?: TreeKey
  title?: ReactNode
  disabled?: boolean
  disableCheckbox?: boolean
  selectable?: boolean
  checkable?: boolean
  isLeaf?: boolean
  icon?: ReactNode | ((props: AntTreeNodeProps<T>) => ReactNode)
  switcherIcon?: ReactNode | ((props: AntTreeNodeProps<T>) => ReactNode)
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export interface TreeProps<T extends BasicDataNode = TreeDataNode> {
  treeData?: readonly T[]
  children?: ReactNode
  fieldNames?: TreeFieldNames
  allowDrop?: (options: AllowDropOptions<T>) => boolean
  autoExpandParent?: boolean
  blockNode?: boolean
  checkable?: boolean
  checkedKeys?: TreeKey[] | { checked: TreeKey[]; halfChecked: TreeKey[] }
  checkStrictly?: boolean
  className?: string
  style?: CSSProperties
  rootClassName?: string
  rootStyle?: CSSProperties
  classNames?: TreeClassNames<T>
  styles?: TreeStyles<T>
  defaultCheckedKeys?: TreeKey[]
  defaultExpandAll?: boolean
  defaultExpandedKeys?: TreeKey[]
  defaultExpandParent?: boolean
  defaultSelectedKeys?: TreeKey[]
  disabled?: boolean
  draggable?: TreeDraggableConfig<T>
  expandedKeys?: TreeKey[]
  filterTreeNode?: (node: EventDataNode<T>) => boolean
  height?: number
  itemHeight?: number
  icon?: ReactNode | ((props: AntTreeNodeProps<T>) => ReactNode)
  loadData?: (node: EventDataNode<T>) => Promise<void>
  loadedKeys?: TreeKey[]
  motion?: boolean
  multiple?: boolean
  selectable?: boolean
  selectedKeys?: TreeKey[]
  showIcon?: boolean
  showLine?: TreeShowLine<T>
  switcherIcon?: ReactNode | ((props: AntTreeNodeProps<T>) => ReactNode)
  switcherLoadingIcon?: ReactNode
  titleRender?: (nodeData: T) => ReactNode
  virtual?: boolean
  ariaLabel?: string
  id?: string
  onCheck?: (
    checked: TreeKey[] | { checked: TreeKey[]; halfChecked: TreeKey[] },
    info: CheckInfo<T>,
  ) => void
  onClick?: (e: MouseEvent<HTMLElement>, node: EventDataNode<T>) => void
  onDoubleClick?: (e: MouseEvent<HTMLElement>, node: EventDataNode<T>) => void
  onDragEnd?: (info: DragInfo<T>) => void
  onDragEnter?: (info: DragEnterInfo<T>) => void
  onDragLeave?: (info: DragInfo<T>) => void
  onDragOver?: (info: DragInfo<T>) => void
  onDragStart?: (info: DragInfo<T>) => void
  onDrop?: (info: DropInfo<T>) => void
  onExpand?: (expandedKeys: TreeKey[], info: ExpandInfo<T>) => void
  onLoad?: (loadedKeys: TreeKey[], info: LoadInfo<T>) => void
  onRightClick?: (info: {
    event: MouseEvent<HTMLElement>
    node: EventDataNode<T>
  }) => void
  onSelect?: (selectedKeys: TreeKey[], info: SelectInfo<T>) => void
}

export interface DirectoryTreeProps<T extends BasicDataNode = TreeDataNode>
  extends TreeProps<T> {
  expandAction?: false | 'click' | 'doubleClick'
}

export interface TreeSelectFieldNames {
  label?: string
  value?: string
  children?: string
  title?: string
  key?: string
  disabled?: string
}

export interface TreeSelectProps<T extends BasicDataNode = TreeDataNode> {
  treeData?: readonly T[]
  fieldNames?: TreeSelectFieldNames
  value?: TreeKey | TreeKey[] | null
  defaultValue?: TreeKey | TreeKey[] | null
  onChange?: (
    value: TreeKey | TreeKey[] | null,
    labelList: ReactNode[],
    extra?: { triggerValue?: TreeKey | null; checked?: boolean },
  ) => void
  placeholder?: string
  nullLabel?: string
  allowClear?: boolean
  showSearch?: boolean
  searchPlaceholder?: string
  treeDefaultExpandAll?: boolean
  treeDefaultExpandedKeys?: TreeKey[]
  treeExpandedKeys?: TreeKey[]
  onTreeExpand?: (expandedKeys: TreeKey[]) => void
  treeLine?: TreeShowLine<T>
  treeIcon?: boolean
  treeCheckable?: boolean
  multiple?: boolean
  disabled?: boolean
  loading?: boolean
  notFoundContent?: ReactNode
  id?: string
  ariaLabel?: string
  className?: string
  popupClassName?: string
  filterTreeNode?: (inputValue: string, treeNode: T) => boolean
}
