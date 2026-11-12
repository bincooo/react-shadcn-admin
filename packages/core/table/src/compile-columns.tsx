import type React from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { ChevronRight, Minus, Plus } from 'lucide-react'
import { Checkbox } from '@repo/ui/components/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip'
import { cn } from '@repo/ui/lib/utils'
import type { TableLocale } from './locale'
import type {
  TanStackColumnMeta,
  TanStackColumnsType,
  TanStackColumnType,
  TanStackExpandableConfig,
  TanStackFilterItem,
  TanStackRowSelectionConfig,
} from './types'

export interface InternalTableMeta<TData = any> {
  detailExpandedSet: Set<string>
  toggleDetailRow: (rowId: string, record: TData) => void
  indentSize: number
  treeLine: boolean
  /** 表格内置文案，供单元格/表头渲染时取用 */
  locale: TableLocale
}

export function getValueByDataIndex(
  record: any,
  dataIndex?: string | number | symbol | string[],
) {
  if (dataIndex === undefined || dataIndex === null) return record
  if (Array.isArray(dataIndex)) {
    return dataIndex.reduce(
      (acc, key) => (acc != null ? acc[key] : undefined),
      record,
    )
  }
  return record?.[dataIndex as any]
}

/**
 * 将日期筛选值转换为时间戳。
 *
 * `YYYY-MM-DD` 视为自然日：起始边界取当天 00:00:00.000，结束边界取
 * 23:59:59.999，保证区间包含整天的数据；带时间的值按精确时间比较。
 */
function toDateTimestamp(
  value: unknown,
  edge: 'start' | 'end',
): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? undefined : time
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
  const time = dateOnly
    ? new Date(
        `${trimmed}T${edge === 'start' ? '00:00:00.000' : '23:59:59.999'}`,
      ).getTime()
    : new Date(trimmed).getTime()
  return Number.isNaN(time) ? undefined : time
}

export function extractTextFromNode(
  node: React.ReactNode,
  fallback: string,
): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  return fallback
}

export function resolveColumnId<TData>(
  col: TanStackColumnType<TData>,
  pathPrefix: string,
  index: number,
): string {
  if (col.key) return col.key
  if (col.dataIndex !== undefined) {
    return Array.isArray(col.dataIndex)
      ? col.dataIndex.join('.')
      : String(col.dataIndex)
  }
  return `${pathPrefix}_col_${index}`
}

/** 扁平化列模板：id → 最新列定义，供单元格读取最新的渲染函数/比较器/过滤谓词 */
export function buildColumnMap<TData>(
  columns: TanStackColumnsType<TData>,
  pathPrefix = 'root',
  map = new Map<string, TanStackColumnType<TData>>(),
): Map<string, TanStackColumnType<TData>> {
  columns.forEach((col, index) => {
    const id = resolveColumnId(col, pathPrefix, index)
    map.set(id, col)
    if (col.children?.length) buildColumnMap(col.children, id, map)
  })
  return map
}

function serializeFilterItem(item: TanStackFilterItem): unknown {
  return {
    text: extractTextFromNode(item.text, ''),
    valueType: typeof item.value,
    value: item.value,
  }
}

function buildColumnSignatureNode<TData>(
  col: TanStackColumnType<TData>,
  pathPrefix: string,
  index: number,
): unknown {
  const id = resolveColumnId(col, pathPrefix, index)
  const sorter = col.sorter
  const sorterKind =
    sorter === undefined || sorter === false
      ? 'none'
      : typeof sorter === 'function'
        ? 'compare'
        : sorter === true
          ? 'boolean'
          : 'object'
  return {
    id,
    titleText: col.titleText ?? extractTextFromNode(col.title, ''),
    dataIndex: col.dataIndex,
    width: col.width,
    minWidth: col.minWidth,
    maxWidth: col.maxWidth,
    fixed: col.fixed,
    align: col.align,
    ellipsis: col.ellipsis,
    resizable: col.resizable,
    lightCell: col.lightCell,
    sorterKind,
    hasComparator:
      typeof sorter === 'function' ||
      (typeof sorter === 'object' &&
        sorter !== null &&
        Boolean(sorter.compare)),
    sorterMultiple:
      typeof sorter === 'object' && sorter !== null
        ? sorter.multiple
        : undefined,
    defaultSortOrder: col.defaultSortOrder,
    filters: col.filters?.map(serializeFilterItem),
    filterMode: col.filterMode,
    filterSearch: col.filterSearch,
    filterMultiple: col.filterMultiple,
    defaultFilteredValue: col.defaultFilteredValue,
    filterUnit: col.filterUnit,
    hasOnFilter: Boolean(col.onFilter),
    treeColumn: col.treeColumn,
    defaultHidden: col.defaultHidden,
    className: col.className,
    headerClassName: col.headerClassName,
    children: col.children?.map((child, childIndex) =>
      buildColumnSignatureNode(child, id, childIndex),
    ),
  }
}

/**
 * 列模板的结构签名。
 *
 * 只包含影响表格结构与初始状态的字段；`render`、`sorter` 比较器、
 * `onFilter` 等行为字段不参与签名，由编译后的单元格在渲染时从最新
 * columns 读取。这样调用方每次渲染重建 columns 数组不会触发重新编译。
 */
export function buildColumnsSignature<TData>(
  columns: TanStackColumnsType<TData>,
): string {
  return JSON.stringify(
    columns.map((col, index) => buildColumnSignatureNode(col, 'root', index)),
  )
}

/**
 * Recursively drop group nodes that have no children.
 * Used so user-created empty groups persist in the settings panel
 * without becoming broken (content-less) header cells in the table.
 */
export function pruneEmptyColumnGroups<TData>(
  columns: TanStackColumnsType<TData>,
): TanStackColumnsType<TData> {
  const out: TanStackColumnsType<TData> = []
  for (const col of columns) {
    if (col.children && col.children.length > 0) {
      out.push({ ...col, children: pruneEmptyColumnGroups(col.children) })
    } else if (col.children) {
    } else {
      out.push(col)
    }
  }
  return out
}

function findFirstLeafColumnId<TData>(
  columns: TanStackColumnsType<TData>,
): string | null {
  // First check explicit treeColumn: true
  const searchExplicit = (
    cols: TanStackColumnsType<TData>,
    prefix: string,
  ): string | null => {
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i]
      const id = resolveColumnId(c, prefix, i)
      if (c.children && c.children.length > 0) {
        const found = searchExplicit(c.children, id)
        if (found) return found
      } else if (c.treeColumn) {
        return id
      }
    }
    return null
  }
  const explicit = searchExplicit(columns, 'root')
  if (explicit) return explicit

  // Fallback to very first leaf column
  const searchFirst = (
    cols: TanStackColumnsType<TData>,
    prefix: string,
  ): string | null => {
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i]
      const id = resolveColumnId(c, prefix, i)
      if (c.children && c.children.length > 0) {
        const found = searchFirst(c.children, id)
        if (found) return found
      } else {
        return id
      }
    }
    return null
  }
  return searchFirst(columns, 'root')
}

export interface CompiledTanStackColumnsResult<TData> {
  tanstackColumns: ColumnDef<TData, any>[]
  initialPinning: ColumnPinningState
  initialSorting: SortingState
  initialFilters: ColumnFiltersState
  initialVisibility: VisibilityState
}

export function compileTanStackColumns<
  TData extends Record<string, any>,
>(options: {
  columns: TanStackColumnsType<TData>
  hasTreeData: boolean
  resizable: boolean
  /** Refs keep cell renderers reading the LATEST config without re-compiling columns on every render. */
  rowSelectionRef: { current: TanStackRowSelectionConfig<TData> | undefined }
  expandableRef: { current: TanStackExpandableConfig<TData> | undefined }
  /** id → 最新列模板；渲染函数/比较器/过滤谓词从这里实时读取 */
  latestColumnsRef: { current: Map<string, TanStackColumnType<TData>> }
  hasRowSelection: boolean
  hasExpandedRowRender: boolean
  locale: TableLocale
}): CompiledTanStackColumnsResult<TData> {
  const {
    columns,
    hasTreeData,
    resizable,
    rowSelectionRef,
    expandableRef,
    latestColumnsRef,
    hasRowSelection,
    hasExpandedRowRender,
    locale,
  } = options
  const rowSelection = rowSelectionRef.current
  const expandable = expandableRef.current

  const leftPinned: string[] = []
  const rightPinned: string[] = []
  const sortingItems: { id: string; desc: boolean; priority: number }[] = []
  const initialFilters: ColumnFiltersState = []
  const initialVisibility: VisibilityState = {}

  const treeHostColumnId = hasTreeData ? findFirstLeafColumnId(columns) : null

  // Check if any user column is fixed left so system columns automatically pin left too
  const hasAnyLeftFixed = (cols: TanStackColumnsType<TData>): boolean =>
    cols.some(
      (c) =>
        c.fixed === 'left' ||
        c.fixed === true ||
        (c.children ? hasAnyLeftFixed(c.children) : false),
    )
  const userHasLeftFixed = hasAnyLeftFixed(columns)

  const builtinColumns: ColumnDef<TData, any>[] = []

  // 1. Row Selection Column (__tanstack_selection__)
  if (hasRowSelection && rowSelection) {
    const selId = '__tanstack_selection__'
    const shouldPinLeft =
      rowSelection.fixed === true ||
      (rowSelection.fixed !== false && userHasLeftFixed)
    if (shouldPinLeft) {
      leftPinned.push(selId)
    }
    const isRadio = rowSelection.type === 'radio'

    builtinColumns.push({
      id: selId,
      size: rowSelection.columnWidth ?? 46,
      minSize: 42,
      maxSize: 64,
      enableResizing: false,
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        titleText: locale.selectionColumnTitle,
        align: 'center',
        fixed: shouldPinLeft ? 'left' : undefined,
        isBuiltinColumn: true,
      } satisfies TanStackColumnMeta<TData>,
      header: ({ table }) => {
        if (isRadio) {
          return <span className="sr-only">{locale.selectionColumnTitle}</span>
        }
        const allSelected = table.getIsAllPageRowsSelected()
        const someSelected = table.getIsSomePageRowsSelected()
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              aria-label={locale.selectAllOnPage}
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )
      },
      cell: ({ row, table }) => {
        const checkboxProps =
          rowSelectionRef.current?.getCheckboxProps?.(row.original) || {}
        const disabled = !!checkboxProps.disabled
        const isSelected = row.getIsSelected()
        const isSomeSelected = row.getIsSomeSelected()

        if (isRadio) {
          return (
            <div className="flex items-center justify-center">
              <button
                type="button"
                disabled={disabled}
                aria-label={locale.selectRow}
                onClick={(e) => {
                  e.stopPropagation()
                  table.setRowSelection({ [row.id]: true })
                }}
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border transition-colors',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-slate-300 dark:border-slate-600 bg-card hover:border-primary',
                  disabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                {isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </button>
            </div>
          )
        }

        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: click is only a stopPropagation guard so toggling selection doesn't trigger the row action
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              aria-label={locale.selectRow}
              disabled={disabled}
              className={cn(
                disabled && 'cursor-not-allowed opacity-50 hover:border-input',
              )}
              checked={isSelected}
              indeterminate={!isSelected && isSomeSelected}
              onCheckedChange={(val) => row.toggleSelected(!!val)}
            />
          </div>
        )
      },
    })
  }

  // 2. Expandable Detail Trigger Column (__tanstack_expand__)
  if (hasExpandedRowRender && expandable) {
    const expId = '__tanstack_expand__'
    const shouldPinLeft =
      expandable.fixed === 'left' ||
      expandable.fixed === true ||
      (expandable.fixed !== false && userHasLeftFixed)
    if (shouldPinLeft) {
      leftPinned.push(expId)
    }

    builtinColumns.push({
      id: expId,
      size: expandable.columnWidth ?? 48,
      minSize: 44,
      maxSize: 68,
      enableResizing: false,
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        titleText: locale.expandColumnTitle,
        align: 'center',
        fixed: shouldPinLeft ? 'left' : undefined,
        isBuiltinColumn: true,
      } satisfies TanStackColumnMeta<TData>,
      header: () => expandableRef.current?.columnTitle ?? null,
      cell: ({ row, table }) => {
        const tMeta = table.options.meta as InternalTableMeta<TData> | undefined
        const rowExpandable = expandableRef.current?.rowExpandable
        const canExpand = rowExpandable ? rowExpandable(row.original) : true

        if (!canExpand) {
          return (
            <div className="flex items-center justify-center">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded border border-dashed border-slate-300 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed" />
                  }
                >
                  <Minus className="h-2.5 w-2.5" />
                </TooltipTrigger>
                <TooltipContent>{locale.noExpandableDetail}</TooltipContent>
              </Tooltip>
            </div>
          )
        }

        const isExpanded = tMeta?.detailExpandedSet.has(row.id) ?? false
        return (
          <div className="flex items-center justify-center">
            <button
              type="button"
              aria-label={
                isExpanded ? locale.collapseRowDetail : locale.expandRowDetail
              }
              onClick={(e) => {
                e.stopPropagation()
                tMeta?.toggleDetailRow(row.id, row.original)
              }}
              className={cn(
                'inline-flex h-4.75 w-4.75 items-center justify-center rounded-md border text-xs transition-all',
                isExpanded
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-slate-300 dark:border-slate-600 bg-card text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary',
              )}
            >
              {isExpanded ? (
                <Minus className="h-3 w-3 stroke-[2.4]" />
              ) : (
                <Plus className="h-3 w-3 stroke-[2.4]" />
              )}
            </button>
          </div>
        )
      },
    })
  }

  // 3. Recursive Compiler for User Columns & Multi-level Column Groups
  const compileNode = (
    col: TanStackColumnType<TData>,
    pathPrefix: string,
    index: number,
    inheritedFixed?: 'left' | 'right',
  ): ColumnDef<TData, any> => {
    const id = resolveColumnId(col, pathPrefix, index)
    const resolvedFixed: 'left' | 'right' | undefined =
      col.fixed === 'left' || col.fixed === true
        ? 'left'
        : col.fixed === 'right'
          ? 'right'
          : inheritedFixed

    const titleText = col.titleText || extractTextFromNode(col.title, id)

    // Group Column (has children)
    if (col.children && col.children.length > 0) {
      return {
        id,
        header: () => col.title,
        meta: {
          titleText,
          align: col.align ?? 'left',
          fixed: resolvedFixed,
          headerClassName: col.headerClassName,
          rawColumn: col,
        } satisfies TanStackColumnMeta<TData>,
        columns: col.children.map((child, childIdx) =>
          compileNode(child, id, childIdx, resolvedFixed),
        ),
      }
    }

    // Leaf Column
    if (resolvedFixed === 'left') leftPinned.push(id)
    if (resolvedFixed === 'right') rightPinned.push(id)
    if (col.defaultHidden) initialVisibility[id] = false

    // Initial sort
    if (col.defaultSortOrder) {
      const priority =
        typeof col.sorter === 'object' && col.sorter.multiple !== undefined
          ? col.sorter.multiple
          : 999
      sortingItems.push({
        id,
        desc: col.defaultSortOrder === 'descend',
        priority,
      })
    }

    // Initial filter
    if (col.defaultFilteredValue !== undefined) {
      initialFilters.push({
        id,
        value: col.defaultFilteredValue,
      })
    }

    // Sorting comparator
    const enableSorting = Boolean(col.sorter)
    const hasCustomComparator =
      typeof col.sorter === 'function' ||
      (typeof col.sorter === 'object' &&
        col.sorter !== null &&
        Boolean(col.sorter.compare))

    // Filtering capability
    const hasFilter = Boolean(
      (col.filters && col.filters.length > 0) || col.filterMode || col.onFilter,
    )
    const filterMode = col.filterMode || (col.filters ? 'menu' : 'search')

    const isTreeCol = treeHostColumnId === id

    return {
      id,
      accessorFn: (record) => getValueByDataIndex(record, col.dataIndex),
      size: col.width ?? 140,
      minSize: col.minWidth ?? 72,
      maxSize: col.maxWidth ?? 680,
      enableResizing: col.resizable !== undefined ? col.resizable : resizable,
      enableSorting,
      enableMultiSort: enableSorting,
      sortingFn: hasCustomComparator
        ? (rowA, rowB) => {
            const latestSorter = latestColumnsRef.current.get(id)?.sorter
            const compare =
              typeof latestSorter === 'function'
                ? latestSorter
                : typeof latestSorter === 'object' && latestSorter !== null
                  ? latestSorter.compare
                  : undefined
            // 结构签名保证编译时存在比较器；最新定义被替换时回退为不排序
            return compare ? compare(rowA.original, rowB.original) : 0
          }
        : 'alphanumeric',
      enableColumnFilter: hasFilter,
      filterFn: (row, columnId, filterValue) => {
        if (
          filterValue === undefined ||
          filterValue === null ||
          filterValue === ''
        ) {
          return true
        }
        const customFilter =
          latestColumnsRef.current.get(id)?.onFilter ?? col.onFilter
        if (customFilter) {
          if (Array.isArray(filterValue)) {
            if (filterValue.length === 0) return true
            return filterValue.some((val) => customFilter(val, row.original))
          }
          return customFilter(filterValue, row.original)
        }

        const cellVal = row.getValue(columnId)

        if (filterMode === 'dateRange' && Array.isArray(filterValue)) {
          const [startValue, endValue] = filterValue as [unknown, unknown]
          const start = toDateTimestamp(startValue, 'start')
          const end = toDateTimestamp(endValue, 'end')
          if (start === undefined && end === undefined) return true
          const cellTime = toDateTimestamp(cellVal, 'start')
          if (cellTime === undefined) return false
          return (
            (start === undefined || cellTime >= start) &&
            (end === undefined || cellTime <= end)
          )
        }

        if (filterMode === 'numberRange' && Array.isArray(filterValue)) {
          const [min, max] = filterValue as [
            number | undefined,
            number | undefined,
          ]
          const num = Number(cellVal)
          if (Number.isNaN(num)) return false
          if (min !== undefined && num < min) return false
          if (max !== undefined && num > max) return false
          return true
        }

        if (Array.isArray(filterValue)) {
          if (filterValue.length === 0) return true
          if (Array.isArray(cellVal)) {
            return filterValue.some((v) => cellVal.includes(v))
          }
          return filterValue.includes(cellVal)
        }

        return String(cellVal ?? '')
          .toLowerCase()
          .includes(String(filterValue).toLowerCase())
      },
      meta: {
        titleText,
        align: col.align ?? 'left',
        ellipsis: col.ellipsis,
        fixed: resolvedFixed,
        filters: col.filters,
        filterMode: hasFilter ? filterMode : undefined,
        filterSearch: col.filterSearch,
        filterMultiple: col.filterMultiple,
        unit: col.filterUnit,
        isTreeColumn: isTreeCol,
        lightCell: col.lightCell ?? true,
        headerClassName: col.headerClassName,
        cellClassName: col.className,
        rawColumn: col,
      } satisfies TanStackColumnMeta<TData>,
      header: () => latestColumnsRef.current.get(id)?.title ?? col.title,
      cell: ({ row, getValue, table }) => {
        const rawVal = getValue()
        const latestRender = latestColumnsRef.current.get(id)?.render
        const content = latestRender
          ? latestRender(rawVal, row.original, row.index)
          : rawVal !== undefined && rawVal !== null
            ? String(rawVal)
            : '—'

        const wrappedContent = col.ellipsis ? (
          <Tooltip>
            <TooltipTrigger render={<span className="block truncate" />}>
              {content}
            </TooltipTrigger>
            <TooltipContent className="max-w-sm wrap-break-word">
              {typeof content === 'string' || typeof content === 'number'
                ? content
                : String(rawVal ?? '')}
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className={cn(col.ellipsis && 'truncate block')}>
            {content}
          </span>
        )

        if (!isTreeCol) {
          return wrappedContent
        }

        // Tree Table Indentation + Connector Guides + Expand Button
        const tMeta = table.options.meta as InternalTableMeta<TData> | undefined
        const indentSize = tMeta?.indentSize ?? 20
        const showTreeLine = tMeta?.treeLine ?? false
        const depth = row.depth
        const canExpandTree = row.getCanExpand()
        const isTreeExpanded = row.getIsExpanded()

        return (
          <div className="flex items-center min-w-0">
            {/* Hierarchy indentation blocks */}
            {depth > 0 && (
              <span className="inline-flex items-stretch self-stretch shrink-0 select-none">
                {Array.from({ length: depth }).map((_, lvl) => (
                  <span
                    key={lvl}
                    style={{ width: indentSize }}
                    className={cn(
                      'relative inline-block shrink-0',
                      showTreeLine &&
                        "before:content-[''] before:absolute before:left-2.25 before:-top-3 before:-bottom-3 before:border-l before:border-dashed before:border-slate-300 dark:before:border-slate-600",
                      showTreeLine &&
                        lvl === depth - 1 &&
                        "after:content-[''] after:absolute after:left-2.25 after:top-1/2 after:w-2.25 after:border-t after:border-dashed after:border-slate-300 dark:after:border-slate-600",
                    )}
                  />
                ))}
              </span>
            )}

            {/* Expand / Collapse Chevron or Leaf Spacer */}
            {canExpandTree ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  row.toggleExpanded()
                }}
                title={
                  isTreeExpanded
                    ? locale.collapseTreeNode
                    : locale.expandTreeNode
                }
                className={cn(
                  'mr-2 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all',
                  isTreeExpanded
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-slate-300 dark:border-slate-600 bg-card text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary',
                )}
              >
                <ChevronRight
                  className={cn(
                    'h-3 w-3 stroke-[2.5] transition-transform duration-150',
                    isTreeExpanded && 'rotate-90',
                  )}
                />
              </button>
            ) : (
              <span className="mr-2 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center">
                {showTreeLine && depth > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                )}
              </span>
            )}

            <div className="min-w-0 flex-1 truncate">{wrappedContent}</div>
          </div>
        )
      },
    }
  }

  const compiledUserColumns = columns.map((col, idx) =>
    compileNode(col, 'root', idx, undefined),
  )

  sortingItems.sort((a, b) => a.priority - b.priority)
  const initialSorting: SortingState = sortingItems.map(({ id, desc }) => ({
    id,
    desc,
  }))

  return {
    tanstackColumns: [...builtinColumns, ...compiledUserColumns],
    initialPinning: {
      left: leftPinned,
      right: rightPinned,
    },
    initialSorting,
    initialFilters,
    initialVisibility,
  }
}
