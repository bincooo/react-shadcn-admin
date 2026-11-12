import type React from 'react'
import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import type { TableLocale } from './locale'

export type TableSize = 'small' | 'middle' | 'large'
export type ColumnAlign = 'left' | 'center' | 'right'
export type TanStackSortOrder = 'ascend' | 'descend' | null
export type TanStackFilterMode = 'menu' | 'search' | 'numberRange' | 'dateRange'

export interface TanStackFilterItem {
  text: React.ReactNode
  value: string | number | boolean
}

export interface TanStackColumnMeta<TData = any> {
  titleText: string
  align?: ColumnAlign
  ellipsis?: boolean
  fixed?: 'left' | 'right'
  filters?: TanStackFilterItem[]
  filterMode?: TanStackFilterMode
  filterSearch?: boolean
  filterMultiple?: boolean
  unit?: string
  isBuiltinColumn?: boolean
  lightCell?: boolean
  isTreeColumn?: boolean
  headerClassName?: string
  cellClassName?: string
  rawColumn?: TanStackColumnType<TData>
}

export interface TanStackColumnType<TData = any> {
  /** Unique column identifier (falls back to stringified dataIndex) */
  key?: string
  /** Header title node */
  title: React.ReactNode
  /** Plain text label used in column settings & active filter tags */
  titleText?: string
  /** Property key or nested path array like ['q1', 'revenue'] */
  dataIndex?: keyof TData | string | string[]
  /** Initial pixel width */
  width?: number
  /** Minimum drag-resize width */
  minWidth?: number
  /** Maximum drag-resize width */
  maxWidth?: number
  /** Pin column to left or right edge */
  fixed?: 'left' | 'right' | boolean
  /** Cell & header text alignment */
  align?: ColumnAlign
  /** Truncate cell overflow with tooltip preview */
  ellipsis?: boolean
  /** Allow drag-resizing this column (defaults to table resizable prop) */
  resizable?: boolean
  /** Whether clicking a cell shows the selection border (default true). */
  lightCell?: boolean
  /** Enable sorting: boolean, custom comparator, or multi-sort config */
  sorter?:
    | boolean
    | ((a: TData, b: TData) => number)
    | {
        compare?: (a: TData, b: TData) => number
        multiple?: number
      }
  /** Initial sort direction */
  defaultSortOrder?: 'ascend' | 'descend'
  /**
   * Predefined filter options for menu mode.
   * Omit it to let the table derive options from the current data values.
   */
  filters?: TanStackFilterItem[]
  /**
   * Filter UI mode: checkbox/radio menu, keyword search, numeric min-max range,
   * or inclusive date range.
   * `menu` without `filters` builds the option index from the data automatically.
   */
  filterMode?: TanStackFilterMode
  /** Show search box inside filter dropdown options */
  filterSearch?: boolean
  /** Allow selecting multiple filter values (default true) */
  filterMultiple?: boolean
  /** Initial filter value */
  defaultFilteredValue?: any
  /** Optional unit suffix shown in numberRange filter */
  filterUnit?: string
  /** Custom filter predicate */
  onFilter?: (value: any, record: TData) => boolean
  /** Custom cell renderer: (value, record, rowIndex) */
  render?: (value: any, record: TData, index: number) => React.ReactNode
  /** Mark this column as the host for tree expand/indent controls */
  treeColumn?: boolean
  /** Hide column initially (toggleable via Column Settings) */
  defaultHidden?: boolean
  /** Nested child columns for multi-level grouped headers */
  children?: TanStackColumnType<TData>[]
  /** Custom cell className */
  className?: string
  /** Custom header cell className */
  headerClassName?: string
}

export type TanStackColumnsType<TData = any> = TanStackColumnType<TData>[]

export interface TanStackExpandableConfig<TData = any> {
  /** Render expanded detail panel below row */
  expandedRowRender?: (
    record: TData,
    index: number,
    expanded: boolean,
  ) => React.ReactNode
  /** Predicate controlling whether a row can expand */
  rowExpandable?: (record: TData) => boolean
  /** Controlled expanded detail row keys */
  expandedRowKeys?: string[]
  /** Initial expanded detail row keys */
  defaultExpandedRowKeys?: string[]
  /** Expand all detail rows initially */
  defaultExpandAllRows?: boolean
  /** Callback fired when a row's detail panel toggles */
  onExpand?: (expanded: boolean, record: TData) => void
  /** Callback fired whenever expanded detail keys change */
  onExpandedRowsChange?: (expandedKeys: string[]) => void
  /** Click anywhere on row to toggle detail expansion */
  expandRowByClick?: boolean
  /** Custom header node for expand column */
  columnTitle?: React.ReactNode
  /** Width of expand trigger column (default 48) */
  columnWidth?: number
  /** Pin expand column to left */
  fixed?: 'left' | boolean

  /* ---- Tree Table options (hierarchical children) ---- */
  /** Property holding nested child records (default: 'children') */
  childrenColumnName?: string
  /** Expand all tree nodes initially */
  defaultExpandAllTreeRows?: boolean
  /** Initial expanded tree node keys */
  defaultExpandedTreeKeys?: string[]
  /** Controlled expanded tree node keys */
  expandedTreeKeys?: ExpandedState
  /** Callback when tree expansion state changes */
  onExpandedTreeChange?: (expanded: ExpandedState) => void
  /** Per-depth indentation in px (default: 20) */
  indentSize?: number
  /** Render subtle tree connector lines */
  treeLine?: boolean
}

export interface TanStackRowSelectionConfig<TData = any> {
  type?: 'checkbox' | 'radio'
  selectedRowKeys?: string[]
  defaultSelectedRowKeys?: string[]
  onChange?: (selectedRowKeys: string[], selectedRows: TData[]) => void
  getCheckboxProps?: (record: TData) => { disabled?: boolean }
  /** false = cascade parent/child selection in tree table; true = independent */
  checkStrictly?: boolean
  columnWidth?: number
  fixed?: boolean
}

export interface TanStackPaginationConfig {
  pageSize?: number
  /** Initial page size when uncontrolled. Default: 50 */
  defaultPageSize?: number
  /** Page-size chooser options. Default: [50, 100, 500, 1000] */
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: (total: number, range: [number, number]) => React.ReactNode
  /**
   * Server-side paging: 1-based current page. Provide together with `total`
   * and `onChange`; the table will not slice `dataSource` locally.
   */
  current?: number
  /** Server-side paging: total record count across all pages. */
  total?: number
  /** Server-side paging: fired when the page index or page size changes. */
  onChange?: (page: number, pageSize: number) => void
}

export interface TanStackTableStateSnapshot {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  columnPinning: ColumnPinningState
  columnSizing: ColumnSizingState
  columnVisibility: VisibilityState
  expanded: ExpandedState
  detailExpandedKeys: string[]
  rowSelection: RowSelectionState
}

export interface TanStackTableToolbarConfig {
  title?: React.ReactNode
  description?: React.ReactNode
  searchPlaceholder?: string
  showColumnSettings?: boolean
  extra?: React.ReactNode
}

export interface TanStackTableProps<TData extends Record<string, any>> {
  /** Declarative column definitions */
  columns: TanStackColumnsType<TData>
  /** Table dataset */
  dataSource: TData[]
  /** Unique row key property or extractor function */
  rowKey?: keyof TData | ((record: TData) => string)
  /** Show full cell grid borders */
  bordered?: boolean
  /** Alternating zebra row background */
  striped?: boolean
  /** Row & cell padding density */
  size?: TableSize
  /** Enable drag-to-resize column widths (default true) */
  resizable?: boolean
  /**
   * Scroll viewport. `virtual` row windowing needs a bounded body:
   * pass numeric `y`, or use `fillHeight` so the flex parent sizes it.
   * `x` is an optional minimum table width.
   */
  scroll?:
    | { virtual: true; x?: number; y?: number }
    | { virtual?: false; x?: number | string; y?: number | string }
  /**
   * Stretch the table (toolbar + body + pager) to the parent height.
   * The parent must be a sized flex/grid item. Body scrolls internally;
   * toolbar and pagination stay visible. Overrides `scroll.y` for body height.
   */
  fillHeight?: boolean
  /** Keep header sticky at top of scroll container */
  stickyHeader?: boolean
  /** Column filter presentation: separate row (default), header icons, or disabled.
   * Switching to "none" clears active column filters; global search is unaffected. */
  filterDisplay?: 'row' | 'header' | 'none'
  /** Loading overlay state */
  loading?: boolean
  /** Expandable detail row & Tree table options */
  expandable?: TanStackExpandableConfig<TData>
  /** Row checkbox/radio selection config */
  selection?: TanStackRowSelectionConfig<TData>
  /** Pagination config or false to disable pagination */
  pagination?: TanStackPaginationConfig | false
  /** Built-in toolbar header */
  toolbar?: TanStackTableToolbarConfig | boolean
  /** Custom summary row renderer inside tfoot */
  summary?: (
    pageData: TData[],
    allFilteredData: TData[],
    context: { visibleColumnCount: number; containerWidth: number },
  ) => React.ReactNode
  /** Custom empty state node */
  emptyText?: React.ReactNode
  /** Subscribe to internal TanStack Table state changes */
  onTableChange?: (snapshot: TanStackTableStateSnapshot) => void
  /** Wrapper className */
  className?: string
  /**
   * Override built-in table copy (toolbar, pager, filters, column menu).
   * Unspecified keys fall back to the locale provided by `TableLocaleProvider`
   * (or built-in Chinese when no provider exists).
   */
  locale?: Partial<TableLocale>
}
