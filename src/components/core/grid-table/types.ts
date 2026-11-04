import type { ReactNode } from 'react'
import type { ExpandableConfig } from '@rc-component/table'

/**
 * 使用侧提供的列定义（Ant Design Table 风格）。
 *
 * `@rc-component/table` 的列结构与此几乎一致：`title / dataIndex / render /
 * width / align / fixed / children` 会被直接透传，`key / hidden / sortable /
 * resizable / minWidth / label` 由 GridTable 自己消费。
 */
export interface GridTableColumn<TData extends object> {
  /** 表头（分组列时为分组标题） */
  title: ReactNode
  /** 取值字段；不传则视为展示列 */
  dataIndex?: Extract<keyof TData, string>
  /** 唯一标识，默认取 dataIndex；展示列 / 分组必须提供 */
  key?: string
  /** 配置面板里显示的名称（title 不是字符串时使用） */
  label?: string
  /** 自定义单元格，签名与 antd 一致 */
  render?: (value: unknown, record: TData, index: number) => ReactNode
  /** 列宽（px） */
  width?: number
  /** 拖拽调宽时的最小宽度（px） */
  minWidth?: number
  align?: 'left' | 'center' | 'right'
  /** 是否可排序，默认有 dataIndex 即可排序 */
  sortable?: boolean
  /** 是否允许拖拽调宽，默认有 dataIndex 的列允许 */
  resizable?: boolean
  /** 默认隐藏 */
  hidden?: boolean
  /** 固定列（left / right） */
  fixed?: 'left' | 'right'
  /** 分组子列（支持任意层级嵌套） */
  children?: GridTableColumn<TData>[]
}

/** 排序项：`id` 为列 id（取 dataIndex） */
export interface GridTableSort {
  id: string
  desc: boolean
}

/** 排序：受控时由业务侧映射到服务端参数；不传则表格在本地排序 */
export interface GridTableSorting {
  value: GridTableSort[]
  onChange: (next: GridTableSort[]) => void
}

/** 分页：受控的服务端分页 */
export interface GridTablePagination {
  /** 1 开始 */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

/** 多选：`selectedKeys` 为数据主键（会被转成字符串作为行 id） */
export interface GridTableSelection<TData extends object> {
  selectedKeys: ReadonlySet<string>
  onChange: (keys: Set<string>) => void
  /** 行是否可勾选（默认全部可选）；不可选的行禁用复选框且不参与全选 */
  isRowSelectable?: (row: TData) => boolean
  /** 选中胶囊中的业务操作（仅在选中数 > 0 时渲染） */
  actions?: ReactNode
  /** 胶囊 portal 容器；默认 document.body */
  getContainer?: () => HTMLElement | null
  /** 勾选列宽度，默认 40 */
  size?: number
}

export interface GridTableFeatures {
  /** 显示「边框」切换，默认 true */
  border?: boolean
  /** 启用多选列与「多选」切换，默认 true */
  selection?: boolean
  /** 显示「配置」入口，默认 true */
  columnConfig?: boolean
}

export interface GridTableConfig<TData extends object> {
  /** 行主键，默认取 row.id */
  rowKey?: (row: TData) => string | number
  title?: ReactNode
  /** 工具栏右侧（属性/配置按钮前）的操作插槽（如「添加」按钮）；仅在提供时渲染 */
  toolbarAction?: ReactNode
  /** 表格右上角展示的总条数 */
  total?: number
  /** 首屏无数据时展示骨架行 */
  loading?: boolean
  /** 初始边框模式，默认 row（仅横线） */
  defaultBorder?: 'row' | 'grid'
  /** 额外初始固定列（内置勾选列会自动排在最前；列上的 fixed 也会生效） */
  initialPinning?: { start?: string[]; end?: string[] }
  /** 初始列显隐（覆盖列上的 hidden） */
  initialVisibility?: Record<string, boolean>
  sorting?: GridTableSorting
  pagination?: GridTablePagination
  selection?: GridTableSelection<TData>
  /** rc-table 原生展开配置透传；行数据带 `children` 时按树形渲染 */
  expandable?: ExpandableConfig<TData>
  features?: GridTableFeatures
  emptyTitle?: string
  emptyDescription?: string
}

export interface GridTableProps<TData extends object> {
  columns: ReadonlyArray<GridTableColumn<TData>>
  data: TData[]
  config?: GridTableConfig<TData>
}
