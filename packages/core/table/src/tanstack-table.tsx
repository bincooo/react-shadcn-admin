import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ColumnOrderState,
  type ExpandedState,
  type Header,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { Inbox, Loader2 } from 'lucide-react'
import { TooltipProvider } from '@repo/ui/components/tooltip'
import { cn } from '@repo/ui/lib/utils'
import {
  buildColumnMap,
  buildColumnsSignature,
  compileTanStackColumns,
  pruneEmptyColumnGroups,
  type InternalTableMeta,
} from './compile-columns'
import { ColumnSorterIcon } from './column-sorter-icon'
import { ColumnFilterPopover } from './column-filter-popover'
import { ColumnHeaderMenu } from './column-header-menu'
import { ColumnFilterCell } from './column-filter-cell'
import { ColumnSettingsPopover } from './column-settings-popover'
import { TablePagination } from './pagination'
import { collectExpandableRowKeys } from './row-keys'
import { useColumnResize } from './use-column-resize'
import { TableLocaleProvider, useTableLocale } from './locale'
import type { TableLocale } from './locale'
import type {
  TanStackColumnMeta,
  TanStackColumnsType,
  TanStackColumnType,
  TanStackTableProps,
  TableSize,
} from './types'

function collectTrueLeafHeaders<TData>(
  header: Header<TData, unknown>,
): Header<TData, unknown>[] {
  if (!header.subHeaders || header.subHeaders.length === 0) {
    return [header]
  }
  return header.subHeaders.flatMap(collectTrueLeafHeaders)
}

type PinSide = 'left' | 'center' | 'right'

/** Split a cell's visible leaf headers into consecutive pin-region segments */
function partitionByPinSide<TData>(
  leafHeaders: Header<TData, unknown>[],
): Array<{ side: PinSide; leafHeaders: Header<TData, unknown>[] }> {
  const segments: Array<{
    side: PinSide
    leafHeaders: Header<TData, unknown>[]
  }> = []
  for (const leafHeaderItem of leafHeaders) {
    const side = (leafHeaderItem.column.getIsPinned() || 'center') as PinSide
    const last = segments[segments.length - 1]
    if (last && last.side === side) {
      last.leafHeaders.push(leafHeaderItem)
    } else {
      segments.push({ side, leafHeaders: [leafHeaderItem] })
    }
  }
  return segments
}

/**
 * PERF: faceted row models / unique-value counts are only ever consumed by
 * menu-style filter popovers. Skip installing them entirely when no column
 * uses menu mode (search-only tables, nested sub-tables, …).
 *
 * 显式 filters 与仅声明 filterMode='menu' 的列都需要 facet：
 * 后者在运行时从数据值自动建立选项索引。
 */
function columnsNeedFaceting<TData>(
  columns: TanStackColumnsType<TData>,
): boolean {
  return columns.some((col) =>
    col.children && col.children.length > 0
      ? columnsNeedFaceting(col.children)
      : Boolean(
          (col.filters && col.filters.length > 0) || col.filterMode === 'menu',
        ),
  )
}

export function TanStackTable<TData extends Record<string, any>>(
  props: TanStackTableProps<TData>,
) {
  // 表格文案：props 覆盖 > 宿主 Provider > 内置中文
  const inheritedLocale = useTableLocale()
  const { locale: localeProp, ...rest } = props
  const locale = useMemo(
    () => ({ ...inheritedLocale, ...localeProp }),
    [inheritedLocale, localeProp],
  )

  return (
    <TableLocaleProvider value={locale}>
      <TanStackTableRoot {...rest} locale={locale} />
    </TableLocaleProvider>
  )
}

function TanStackTableRoot<TData extends Record<string, any>>({
  columns,
  dataSource,
  rowKey = 'id',
  bordered = false,
  striped = false,
  size: externalSize = 'middle',
  resizable = true,
  scroll,
  fillHeight = false,
  stickyHeader = true,
  filterDisplay,
  loading = false,
  expandable,
  selection: rowSelection,
  pagination = {
    defaultPageSize: 50,
    showSizeChanger: true,
    showQuickJumper: true,
  },
  toolbar,
  summary,
  emptyText,
  onTableChange: onTableStateChange,
  className,
  locale,
}: Omit<TanStackTableProps<TData>, 'locale'> & { locale: TableLocale }) {
  if (
    scroll?.virtual &&
    !fillHeight &&
    (typeof scroll.y !== 'number' ||
      !Number.isFinite(scroll.y) ||
      scroll.y <= 0)
  ) {
    throw new Error(
      'scroll.virtual requires a positive numeric scroll.y, or fillHeight for a flex viewport',
    )
  }
  if (toolbar === true) {
    toolbar = {}
  }
  const resolvedFilterDisplay = filterDisplay ?? 'none'
  const [internalSize, setInternalSize] = useState<TableSize>(externalSize)
  useEffect(() => {
    setInternalSize(externalSize)
  }, [externalSize])

  const childrenColumnName = expandable?.childrenColumnName || 'children'

  // 列模板的结构签名：行为字段（render / 比较器 / 过滤谓词）不参与，
  // 调用方每次渲染重建 columns 数组时不会触发重新编译。
  const columnsSignature = buildColumnsSignature(columns)
  // 最新列模板：编译后的单元格按 id 从这里读取最新的行为字段。
  const latestColumnsRef = useRef<Map<string, TanStackColumnType<TData>>>(
    new Map(),
  )
  latestColumnsRef.current = buildColumnMap(columns)
  // 最新声明数组：结构签名不变时 appliedColumns 复用同一份模板。
  const latestColumnsArrayRef = useRef(columns)
  latestColumnsArrayRef.current = columns

  // Column-tree view override produced by the 「列配置」 panel
  // (user-created / renamed / dissolved / reordered groups).
  const [columnTreeOverride, setColumnTreeOverride] =
    useState<TanStackColumnsType<TData> | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: 结构签名变化时才需要取最新的声明列模板。
  const appliedColumns = useMemo(
    () => columnTreeOverride ?? latestColumnsArrayRef.current,
    [columnTreeOverride, columnsSignature],
  )
  // Empty user groups live only in the panel; drop them before compiling
  // (otherwise an empty `children: []` would be compiled as a data-less leaf).
  const effectiveColumns = useMemo(
    () => pruneEmptyColumnGroups(appliedColumns),
    [appliedColumns],
  )
  const needsFaceting = useMemo(
    () => columnsNeedFaceting(effectiveColumns),
    [effectiveColumns],
  )
  // The override is tied to the declared column template; drop it when the
  // structural signature changes (not merely when the array reference does).
  const declaredColumnsSignatureRef = useRef(columnsSignature)
  useEffect(() => {
    if (declaredColumnsSignatureRef.current !== columnsSignature) {
      declaredColumnsSignatureRef.current = columnsSignature
      setColumnTreeOverride(null)
    }
  }, [columnsSignature])

  const resolveRowKey = useCallback(
    (record: TData, index: number, parentId?: string): string => {
      if (typeof rowKey === 'function') return String(rowKey(record))
      const val = record?.[rowKey]
      return val !== undefined && val !== null
        ? String(val)
        : parentId
          ? `${parentId}.row_${index}`
          : `row_${index}`
    },
    [rowKey],
  )

  // Detect whether dataset contains nested tree children
  const hasTreeData = useMemo(() => {
    return dataSource.some((item) => {
      const children = item?.[childrenColumnName]
      return Array.isArray(children) && children.length > 0
    })
  }, [dataSource, childrenColumnName])

  // Keep latest config objects in refs so inline (unstable) props do NOT
  // invalidate column compilation on every render (which caused an infinite
  // re-render loop: compiled.initialPinning -> setColumnPinning -> re-render).
  const rowSelectionRef = useRef(rowSelection)
  rowSelectionRef.current = rowSelection
  const expandableRef = useRef(expandable)
  expandableRef.current = expandable

  // Compile declarative columns -> TanStack ColumnDef[]
  // Only structural / primitive inputs may be dependencies here.
  const hasRowSelection = Boolean(rowSelection)
  const hasExpandedRowRender = Boolean(expandable?.expandedRowRender)
  // biome-ignore lint/correctness/useExhaustiveDependencies: structural config is read through refs, so primitive changes must invalidate compilation.
  const compiled = useMemo(
    () =>
      compileTanStackColumns({
        columns: effectiveColumns,
        hasTreeData,
        resizable,
        rowSelectionRef,
        expandableRef,
        latestColumnsRef,
        hasRowSelection,
        hasExpandedRowRender,
        locale,
      }),
    [
      effectiveColumns,
      hasTreeData,
      resizable,
      hasRowSelection,
      rowSelection?.type,
      rowSelection?.fixed,
      rowSelection?.columnWidth,
      hasExpandedRowRender,
      expandable?.fixed,
      expandable?.columnWidth,
      locale,
    ],
  )

  // ---- Controlled / Uncontrolled States ----
  const [sorting, setSorting] = useState<SortingState>(compiled.initialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    resolvedFilterDisplay === 'none' ? [] : compiled.initialFilters,
  )
  useEffect(() => {
    if (resolvedFilterDisplay === 'none' && columnFilters.length > 0) {
      setColumnFilters([])
    }
  }, [resolvedFilterDisplay, columnFilters])
  const [globalFilter, setGlobalFilter] = useState<string>('')
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    compiled.initialPinning,
  )
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    compiled.initialVisibility,
  )
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

  // Sync pinning ONLY when the structural pinning config actually changes.
  // A value-level guard prevents setState loops when column defs are recompiled.
  const initialPinningKey = useMemo(
    () => JSON.stringify(compiled.initialPinning),
    [compiled.initialPinning],
  )
  useEffect(() => {
    setColumnPinning((prev) =>
      JSON.stringify(prev) === initialPinningKey
        ? prev
        : (JSON.parse(initialPinningKey) as ColumnPinningState),
    )
  }, [initialPinningKey])

  // Tree expansion state (TanStack ExpandedState)
  const [internalTreeExpanded, setInternalTreeExpanded] =
    useState<ExpandedState>(() => {
      if (expandable?.defaultExpandAllTreeRows) return true
      if (expandable?.defaultExpandedTreeKeys) {
        return Object.fromEntries(
          expandable.defaultExpandedTreeKeys.map((k) => [k, true]),
        )
      }
      return {}
    })
  const treeExpanded =
    expandable?.expandedTreeKeys !== undefined
      ? expandable.expandedTreeKeys
      : internalTreeExpanded

  const handleTreeExpandedChange = useCallback(
    (updater: ExpandedState | ((old: ExpandedState) => ExpandedState)) => {
      const next =
        typeof updater === 'function' ? updater(treeExpanded) : updater
      const cfg = expandableRef.current
      if (cfg?.expandedTreeKeys === undefined) {
        setInternalTreeExpanded(next)
      }
      cfg?.onExpandedTreeChange?.(next)
    },
    [treeExpanded],
  )

  // Detail Row Expansion state (independent from tree children expansion!)
  const [internalDetailKeys, setInternalDetailKeys] = useState<string[]>(() => {
    if (expandable?.defaultExpandAllRows && expandable?.expandedRowRender) {
      return collectExpandableRowKeys(
        dataSource,
        resolveRowKey,
        childrenColumnName,
        expandable.rowExpandable,
      )
    }
    return expandable?.defaultExpandedRowKeys || []
  })

  const detailExpandedKeys =
    expandable?.expandedRowKeys !== undefined
      ? expandable.expandedRowKeys
      : internalDetailKeys

  const detailExpandedSet = useMemo(
    () => new Set(detailExpandedKeys),
    [detailExpandedKeys],
  )

  const toggleDetailRow = useCallback(
    (rowId: string, record: TData) => {
      const cfg = expandableRef.current
      if (cfg?.rowExpandable && !cfg.rowExpandable(record)) {
        return
      }
      const exists = detailExpandedSet.has(rowId)
      const nextKeys = exists
        ? detailExpandedKeys.filter((k) => k !== rowId)
        : [...detailExpandedKeys, rowId]
      if (cfg?.expandedRowKeys === undefined) {
        setInternalDetailKeys(nextKeys)
      }
      cfg?.onExpand?.(!exists, record)
      cfg?.onExpandedRowsChange?.(nextKeys)
    },
    [detailExpandedKeys, detailExpandedSet],
  )

  // Row Selection state
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>(() => {
      if (rowSelection?.defaultSelectedRowKeys) {
        return Object.fromEntries(
          rowSelection.defaultSelectedRowKeys.map((k) => [k, true]),
        )
      }
      return {}
    })

  const resolvedRowSelection = useMemo<RowSelectionState>(() => {
    if (rowSelection?.selectedRowKeys !== undefined) {
      return Object.fromEntries(
        rowSelection.selectedRowKeys.map((k) => [k, true]),
      )
    }
    return internalRowSelection
  }, [rowSelection?.selectedRowKeys, internalRowSelection])

  const isServerPaging =
    pagination !== false &&
    pagination.total !== undefined &&
    pagination.onChange !== undefined

  // Pagination state
  const [internalPaginationState, setInternalPaginationState] =
    useState<PaginationState>({
      pageIndex: 0,
      pageSize:
        pagination !== false
          ? pagination.pageSize || pagination.defaultPageSize || 50
          : 99999,
    })
  const paginationState: PaginationState = isServerPaging
    ? {
        pageIndex: Math.max(0, (pagination.current ?? 1) - 1),
        pageSize: pagination.pageSize || pagination.defaultPageSize || 50,
      }
    : internalPaginationState

  // Table Meta passed into cells without forcing column re-compilation
  const tableMeta = useMemo<InternalTableMeta<TData>>(
    () => ({
      detailExpandedSet,
      toggleDetailRow,
      indentSize: expandable?.indentSize ?? 20,
      treeLine: expandable?.treeLine ?? false,
      locale,
    }),
    [
      detailExpandedSet,
      toggleDetailRow,
      expandable?.indentSize,
      expandable?.treeLine,
      locale,
    ],
  )

  // Stable identity: the row-model machinery reads this on every data access.
  const getRowId = useCallback(
    (originalRow: TData, index: number, parent?: Row<TData>) => {
      const base = resolveRowKey(originalRow, index, parent?.id)
      return base || (parent ? `${parent.id}.${index}` : String(index))
    },
    [resolveRowKey],
  )

  const table = useReactTable<TData>({
    data: dataSource,
    columns: compiled.tanstackColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnPinning,
      columnSizing,
      columnVisibility,
      columnOrder,
      expanded: treeExpanded,
      rowSelection: resolvedRowSelection,
      ...(pagination !== false ? { pagination: paginationState } : {}),
    },
    meta: tableMeta,
    enableColumnResizing: resizable,
    enableColumnFilters: resolvedFilterDisplay !== 'none',
    enableMultiSort: true,
    enableSubRowSelection: !(rowSelection?.checkStrictly ?? false),
    // getCheckboxProps 里标记 disabled 的行不参与选择：表头全选 / 全选状态
    // 都通过 row.getCanSelect() 计算，避免把禁选行一起选中。
    enableRowSelection: (row) =>
      !rowSelectionRef.current?.getCheckboxProps?.(row.original)?.disabled,
    filterFromLeafRows: hasTreeData,
    getRowId,
    getSubRows: hasTreeData
      ? (row) => {
          const sub = row?.[childrenColumnName]
          return Array.isArray(sub) && sub.length > 0 ? sub : undefined
        }
      : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onExpandedChange: handleTreeExpandedChange,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(resolvedRowSelection) : updater
      if (rowSelection?.selectedRowKeys === undefined) {
        setInternalRowSelection(next)
      }
      if (rowSelection?.onChange) {
        const keys = Object.keys(next).filter((k) => next[k])
        const rowMap = table.getCoreRowModel().rowsById
        const records = keys
          .map((k) => rowMap[k]?.original)
          .filter(Boolean) as TData[]
        rowSelection.onChange(keys, records)
      }
    },
    ...(pagination !== false
      ? {
          onPaginationChange: (
            updater:
              | PaginationState
              | ((old: PaginationState) => PaginationState),
          ) => {
            const next =
              typeof updater === 'function' ? updater(paginationState) : updater
            if (isServerPaging) {
              pagination.onChange?.(next.pageIndex + 1, next.pageSize)
              return
            }
            setInternalPaginationState(next)
          },
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    // PERF: only install the faceting machinery when a menu filter can use it.
    ...(needsFaceting
      ? {
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedUniqueValues: getFacetedUniqueValues(),
        }
      : {}),
    ...(pagination !== false && !isServerPaging
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
    ...(isServerPaging
      ? {
          manualPagination: true,
          rowCount: pagination.total,
        }
      : {}),
  })

  // Notify external state inspector if subscribed
  useEffect(() => {
    onTableStateChange?.({
      sorting,
      columnFilters,
      globalFilter,
      columnPinning,
      columnSizing,
      columnVisibility,
      expanded: treeExpanded,
      detailExpandedKeys,
      rowSelection: resolvedRowSelection,
    })
  }, [
    sorting,
    columnFilters,
    globalFilter,
    columnPinning,
    columnSizing,
    columnVisibility,
    treeExpanded,
    detailExpandedKeys,
    resolvedRowSelection,
    onTableStateChange,
  ])

  // ---- Horizontal Scroll Shadow & Viewport Width Measurement ----
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  // Store a logical identity, not a DOM node: virtual scrolling unmounts and
  // recreates off-screen cells, so DOM-only selection would be lost.
  const [activeCell, setActiveCell] = useState<{
    rowId: string
    columnId: string
  } | null>(null)

  const selectCell = (
    event: React.MouseEvent<HTMLTableCellElement>,
    selectable: boolean,
    rowId: string,
    columnId: string,
  ) => {
    const cell = event.currentTarget
    if ((event.target as Element).closest('table') !== cell.closest('table'))
      return
    setActiveCell((current) => {
      if (!selectable) return null
      if (current?.rowId === rowId && current.columnId === columnId)
        return current
      return { rowId, columnId }
    })
  }
  const startColumnResize = useColumnResize({ table, scrollContainerRef })
  const [pingLeft, setPingLeft] = useState(false)
  const [pingRight, setPingRight] = useState(false)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  const updateScrollShadows = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setContainerWidth(clientWidth)
    setPingLeft(scrollLeft > 1)
    setPingRight(scrollLeft + clientWidth < scrollWidth - 1)
  }, [])

  // PERF: coalesce scroll/resize notifications into one layout read per frame.
  // Scroll events can fire far faster than the display refresh; reading
  // scrollWidth/clientWidth on each one forces redundant layout work.
  const scrollRafRef = useRef<number | null>(null)
  const scheduleScrollShadows = useCallback(() => {
    if (scrollRafRef.current !== null) return
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null
      updateScrollShadows()
    })
  }, [updateScrollShadows])

  // Observe viewport size once (both callbacks are stable).
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    updateScrollShadows()
    const ro = new ResizeObserver(() => scheduleScrollShadows())
    ro.observe(el)
    return () => {
      ro.disconnect()
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = null
      }
    }
  }, [updateScrollShadows, scheduleScrollShadows])

  // Re-measure when the table's intrinsic layout changes (resize drag, pinning,
  // visibility, data) — without tearing down / re-creating the ResizeObserver.
  // biome-ignore lint/correctness/useExhaustiveDependencies: layout changes require a fresh scroll-shadow measurement.
  useEffect(() => {
    scheduleScrollShadows()
  }, [
    columnSizing,
    columnPinning,
    columnVisibility,
    dataSource,
    scheduleScrollShadows,
  ])

  const handleResetAllColumns = useCallback(() => {
    setColumnSizing({})
    setColumnPinning(compiled.initialPinning)
    setColumnVisibility(compiled.initialVisibility)
    setColumnOrder([])
    setColumnTreeOverride(null)
  }, [compiled.initialPinning, compiled.initialVisibility])

  // Padding classes by AntD Table size
  const cellPadding = useMemo(() => {
    switch (internalSize) {
      case 'small':
        return 'px-2.5 py-1.5 text-xs'
      case 'large':
        return 'px-4 py-3.5 text-sm'
      default:
        return 'px-3 py-2.5 text-[13px]'
    }
  }, [internalSize])

  const headerPadding = useMemo(() => {
    switch (internalSize) {
      case 'small':
        return 'px-2.5 py-2 text-xs'
      case 'large':
        return 'px-4 py-3 text-sm'
      default:
        return 'px-3 py-2.5 text-xs'
    }
  }, [internalSize])

  const headerGroups = table.getHeaderGroups()
  const totalHeaderRows = headerGroups.length
  const leftPinnedLeafCols = table.getLeftLeafColumns()
  const rightPinnedLeafCols = table.getRightLeafColumns()
  const lastLeftPinnedId =
    leftPinnedLeafCols.length > 0
      ? leftPinnedLeafCols[leftPinnedLeafCols.length - 1].id
      : null
  const firstRightPinnedId =
    rightPinnedLeafCols.length > 0 ? rightPinnedLeafCols[0].id : null

  const visibleRows = table.getRowModel().rows
  const virtualEnabled = scroll?.virtual === true
  // Detail panels are individual virtual items, so both rows and panels can
  // be measured independently as their content changes.
  const renderItems = useMemo(() => {
    const items: Array<{ row: Row<TData>; rowIndex: number; detail: boolean }> =
      []
    visibleRows.forEach((row, rowIndex) => {
      items.push({ row, rowIndex, detail: false })
      if (expandable?.expandedRowRender && detailExpandedSet.has(row.id)) {
        items.push({ row, rowIndex, detail: true })
      }
    })
    return items
  }, [visibleRows, expandable?.expandedRowRender, detailExpandedSet])
  const [virtualScrollMargin, setVirtualScrollMargin] = useState(0)
  useLayoutEffect(() => {
    if (!virtualEnabled) return
    const container = scrollContainerRef.current
    const head = container?.querySelector(':scope > table > thead')
    const tableEl = container?.querySelector(':scope > table')
    if (!container || !head || !tableEl) return
    const measure = () =>
      setVirtualScrollMargin(
        (tableEl as HTMLElement).offsetTop + (head as HTMLElement).offsetHeight,
      )
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(head)
    return () => observer.disconnect()
  }, [virtualEnabled])
  const rowVirtualizer = useVirtualizer({
    count: renderItems.length,
    enabled: virtualEnabled,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) =>
      renderItems[index]?.detail
        ? 220
        : internalSize === 'small'
          ? 42
          : internalSize === 'large'
            ? 64
            : 56,
    getItemKey: (index) => {
      const item = renderItems[index]
      return item
        ? `${item.row.id}:${item.detail ? 'detail' : 'row'}`
        : String(index)
    },
    overscan: 5,
    scrollMargin: virtualScrollMargin,
  })
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the virtual viewport when the row ordering or page changes.
  useEffect(() => {
    if (virtualEnabled && scrollContainerRef.current)
      scrollContainerRef.current.scrollTop = 0
  }, [
    virtualEnabled,
    paginationState.pageIndex,
    paginationState.pageSize,
    sorting,
    columnFilters,
    globalFilter,
  ])
  const virtualItems = virtualEnabled ? rowVirtualizer.getVirtualItems() : []
  const displayedItems = virtualEnabled
    ? virtualItems.map((virtualItem) => ({
        ...renderItems[virtualItem.index],
        virtualItem,
      }))
    : renderItems.map((item) => ({ ...item, virtualItem: undefined }))
  const paddingTop = virtualItems.length
    ? Math.max(0, virtualItems[0].start - virtualScrollMargin)
    : 0
  const paddingBottom = virtualItems.length
    ? Math.max(
        0,
        rowVirtualizer.getTotalSize() -
          (virtualItems[virtualItems.length - 1].end - virtualScrollMargin),
      )
    : 0
  const allFilteredRows = table.getPrePaginationRowModel().rows
  // Column pinning reorders the rendered cells to [left…, center…, right…]
  // (see row.getVisibleCells / getHeaderGroups). The colgroup and the filter
  // row MUST render in the same order, otherwise cells land on the wrong
  // tracks (table-fixed assigns widths by cell index).
  const allVisibleLeafCols = [
    ...table.getLeftVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getRightVisibleLeafColumns(),
  ]
  const hasVisibleFilterableColumn = allVisibleLeafCols.some(
    (col) =>
      !(col.columnDef.meta as TanStackColumnMeta<TData> | undefined)
        ?.isBuiltinColumn && col.getCanFilter(),
  )
  const visibleLeafColumnsCount = allVisibleLeafCols.length
  const veryLastLeafColId =
    allVisibleLeafCols.length > 0
      ? allVisibleLeafCols[allVisibleLeafCols.length - 1].id
      : null

  const selectedCount =
    Object.values(resolvedRowSelection).filter(Boolean).length

  // Computed table pixel width
  const totalCalculatedSize = table.getTotalSize()
  const minScrollX = typeof scroll?.x === 'number' ? scroll.x : undefined
  const tableStyleWidth = minScrollX
    ? Math.max(minScrollX, totalCalculatedSize)
    : totalCalculatedSize

  return (
    <TooltipProvider delay={200}>
      <div
        className={cn(
          'flex min-h-0 flex-col overflow-hidden bg-card text-card-foreground',
          fillHeight && 'min-h-0 flex-1',
          className,
        )}
      >
        {/* ProTable Optional Toolbar */}
        {typeof toolbar === 'object' && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 bg-card">
            <div className="min-w-0">
              {toolbar.title && (
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {toolbar.title}
                </div>
              )}
              {toolbar.description && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {toolbar.description}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {toolbar.extra}
              {toolbar.showColumnSettings !== false && (
                <ColumnSettingsPopover
                  table={table}
                  columns={columns}
                  columnsSignature={columnsSignature}
                  appliedColumns={appliedColumns}
                  defaultVisibility={compiled.initialVisibility}
                  defaultPinning={compiled.initialPinning}
                  onApplyView={setColumnTreeOverride}
                  onResetAll={handleResetAllColumns}
                />
              )}
            </div>
          </div>
        )}

        {/* Ant Design ProTable Selection Info Banner */}
        {rowSelection && selectedCount > 0 && (
          <div className="flex shrink-0 items-center justify-between border-b bg-primary/[0.07] px-4 py-2 text-xs">
            <span className="text-foreground">
              {locale.selectedSummary(selectedCount)}
              {hasTreeData && (
                <span className="ml-2 text-muted-foreground">
                  ·{' '}
                  {rowSelection.checkStrictly
                    ? locale.selectionStrict
                    : locale.selectionCascade}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => table.resetRowSelection()}
              className="text-primary font-medium hover:underline"
            >
              {locale.clearSelection}
            </button>
          </div>
        )}

        {/* Main Scrollable Table Viewport */}
        <div
          ref={scrollContainerRef}
          onScroll={scheduleScrollShadows}
          style={
            !fillHeight && scroll?.y != null
              ? { height: scroll.y, maxHeight: scroll.y }
              : undefined
          }
          className={cn(
            'relative w-full overflow-auto tanstack-table-scroll-container',
            fillHeight && 'min-h-0 flex-1',
          )}
        >
          {/* Loading Overlay */}
          {loading && (
            <div className="sticky left-0 top-0 z-50 h-0 w-full">
              <div
                className="absolute left-0 top-0 flex w-full items-center justify-center bg-card/70 backdrop-blur-[1px]"
                style={{ height: scrollContainerRef.current?.clientHeight }}
              >
                <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-md text-xs font-medium text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {locale.loading}
                </div>
              </div>
            </div>
          )}

          <table
            style={{
              width: '100%',
              minWidth: tableStyleWidth,
            }}
            className="border-separate border-spacing-0 table-fixed text-left"
          >
            {/* Explicit colgroup locks exact column widths during drag-resizing & multi-row colSpan */}
            <colgroup>
              {allVisibleLeafCols.map((col) => (
                <col key={col.id} style={{ width: col.getSize() }} />
              ))}
            </colgroup>

            {/* THEAD: Supports Multi-Level Grouped Headers with True rowSpan + colSpan + Sticky Left/Right */}
            <thead className={cn(stickyHeader && 'sticky top-0 z-30')}>
              {headerGroups.map((headerGroup, rowIndex) => {
                return (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      // AntD true rowSpan logic: skip placeholder headers below their origin depth
                      if (rowIndex > header.column.depth) {
                        return null
                      }

                      const isGroupHeader = header.column.columns.length > 0
                      const rowSpan = isGroupHeader
                        ? 1
                        : totalHeaderRows - rowIndex
                      const trueLeafHeaders = collectTrueLeafHeaders(header)
                      // A group header may render as several cells (one per
                      // contiguous pin-region segment). EVERY segment shows the
                      // group title (narrow slivers truncate with an ellipsis),
                      // so a pinned column's group context stays visible.
                      const segments = partitionByPinSide(trueLeafHeaders)

                      const meta = (header.column.columnDef.meta ||
                        {}) as TanStackColumnMeta<TData>
                      const align = meta.align ?? 'left'

                      const cells = segments.map((segment) => {
                        const segLeafHeaders = segment.leafHeaders
                        const leafHeader = segLeafHeaders[0] || header
                        const firstLeafCol =
                          segLeafHeaders[0]?.column || header.column
                        const lastLeafCol =
                          segLeafHeaders[segLeafHeaders.length - 1]?.column ||
                          header.column
                        const colSpan = segLeafHeaders.length
                        const cellWidth = segLeafHeaders.reduce(
                          (total, h) => total + h.column.getSize(),
                          0,
                        )
                        const pinned =
                          segment.side === 'center' ? false : segment.side
                        const stickyLeft =
                          pinned === 'left'
                            ? firstLeafCol.getStart('left')
                            : undefined
                        const stickyRight =
                          pinned === 'right'
                            ? lastLeafCol.getAfter('right')
                            : undefined

                        const isLastLeft =
                          pinned === 'left' &&
                          lastLeafCol.id === lastLeftPinnedId
                        const isFirstRight =
                          pinned === 'right' &&
                          firstLeafCol.id === firstRightPinnedId

                        const canSort =
                          !isGroupHeader && leafHeader.column.getCanSort()
                        const sortDir = !isGroupHeader
                          ? leafHeader.column.getIsSorted()
                          : false
                        const canFilter =
                          !isGroupHeader && leafHeader.column.getCanFilter()
                        const canResize =
                          !isGroupHeader && leafHeader.column.getCanResize()
                        // 排序表头同时支持鼠标与键盘：Enter / Space 切换排序
                        const toggleSorting = canSort
                          ? leafHeader.column.getToggleSortingHandler()
                          : undefined

                        return (
                          <th
                            key={`${header.id}::${segment.side}`}
                            colSpan={colSpan}
                            rowSpan={rowSpan}
                            style={{
                              width: cellWidth,
                              position: pinned ? 'sticky' : 'relative',
                              left: stickyLeft,
                              right: stickyRight,
                              zIndex: pinned ? 35 : 10,
                            }}
                            tabIndex={canSort ? 0 : undefined}
                            aria-sort={
                              canSort
                                ? sortDir === 'asc'
                                  ? 'ascending'
                                  : sortDir === 'desc'
                                    ? 'descending'
                                    : 'none'
                                : undefined
                            }
                            onClick={toggleSorting}
                            onKeyDown={
                              canSort
                                ? (event) => {
                                    // 只处理表头自身；内部菜单/筛选按钮的键盘事件不触发排序
                                    if (event.target !== event.currentTarget)
                                      return
                                    if (
                                      event.key === 'Enter' ||
                                      event.key === ' '
                                    ) {
                                      event.preventDefault()
                                      toggleSorting?.(event)
                                    }
                                  }
                                : undefined
                            }
                            className={cn(
                              'tanstack-table-th group/th select-none border-b border-(--table-border-color) transition-colors',
                              isGroupHeader
                                ? 'tanstack-table-th-group'
                                : 'tanstack-table-th-leaf',
                              headerPadding,
                              bordered &&
                                lastLeafCol.id !== veryLastLeafColId &&
                                'border-r',
                              canSort &&
                                'cursor-pointer tanstack-table-th-sortable',
                              isLastLeft && 'tanstack-table-pin-left-shadow',
                              isLastLeft &&
                                pingLeft &&
                                'tanstack-table-pin-left-shadow-active',
                              isFirstRight && 'tanstack-table-pin-right-shadow',
                              isFirstRight &&
                                pingRight &&
                                'tanstack-table-pin-right-shadow-active',
                              meta.headerClassName,
                            )}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <div
                                className={cn(
                                  'flex items-center gap-1 min-w-0 flex-1',
                                  align === 'center' &&
                                    'justify-center text-center',
                                  align === 'right' && 'justify-end text-right',
                                )}
                              >
                                <span
                                  className="truncate"
                                  title={
                                    typeof header.column.columnDef.header ===
                                    'string'
                                      ? header.column.columnDef.header
                                      : undefined
                                  }
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    leafHeader.getContext(),
                                  )}
                                </span>
                                {canSort && (
                                  <span
                                    className={cn(
                                      'inline-flex transition-opacity',
                                      sortDir
                                        ? 'opacity-100'
                                        : 'opacity-0 group-hover/th:opacity-100',
                                    )}
                                  >
                                    <ColumnSorterIcon direction={sortDir} />
                                  </span>
                                )}
                              </div>

                              {/* Integrated filter mode puts the funnel in the header. */}
                              {canFilter &&
                                resolvedFilterDisplay === 'header' && (
                                  <ColumnFilterPopover
                                    column={leafHeader.column}
                                  />
                                )}
                              {!isGroupHeader && !meta.isBuiltinColumn && (
                                <ColumnHeaderMenu column={leafHeader.column} />
                              )}
                            </div>

                            {!bordered &&
                              lastLeafCol.id !== veryLastLeafColId && (
                                <span
                                  aria-hidden="true"
                                  className="tanstack-table-header-separator"
                                />
                              )}

                            {/* Invisible resize hit area: only the cursor changes. */}
                            {canResize && (
                              <div
                                aria-hidden="true"
                                data-column-resize-handle=""
                                onMouseDown={(e) =>
                                  startColumnResize(e, leafHeader)
                                }
                                onTouchStart={(e) =>
                                  startColumnResize(e, leafHeader)
                                }
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => {
                                  e.stopPropagation()
                                  leafHeader.column.resetSize()
                                }}
                                className="absolute right-0 top-0 bottom-0 z-40 w-2.5 cursor-col-resize select-none touch-none"
                              />
                            )}
                          </th>
                        )
                      })
                      return (
                        <React.Fragment key={header.id}>{cells}</React.Fragment>
                      )
                    })}
                  </tr>
                )
              })}

              {/* AG-Grid-style floating filter row: input + funnel per filterable column */}
              {resolvedFilterDisplay === 'row' &&
                hasVisibleFilterableColumn && (
                  <tr className="tanstack-table-filter-row">
                    {allVisibleLeafCols.map((col) => {
                      const pinned = col.getIsPinned()
                      const stickyLeft =
                        pinned === 'left' ? col.getStart('left') : undefined
                      const stickyRight =
                        pinned === 'right' ? col.getAfter('right') : undefined
                      const isLastLeft =
                        pinned === 'left' && col.id === lastLeftPinnedId
                      const isFirstRight =
                        pinned === 'right' && col.id === firstRightPinnedId
                      const cMeta = (col.columnDef.meta ||
                        {}) as TanStackColumnMeta<TData>
                      const isBuiltin = Boolean(cMeta.isBuiltinColumn)
                      const canFilterCol = col.getCanFilter()

                      return (
                        <th
                          key={col.id}
                          style={{
                            width: col.getSize(),
                            position: pinned ? 'sticky' : 'relative',
                            left: stickyLeft,
                            right: stickyRight,
                            zIndex: pinned ? 35 : 10,
                          }}
                          className={cn(
                            'tanstack-table-filter-th border-b border-(--table-border-color)',
                            bordered &&
                              col.id !== veryLastLeafColId &&
                              'border-r',
                            isLastLeft && 'tanstack-table-pin-left-shadow',
                            isLastLeft &&
                              pingLeft &&
                              'tanstack-table-pin-left-shadow-active',
                            isFirstRight && 'tanstack-table-pin-right-shadow',
                            isFirstRight &&
                              pingRight &&
                              'tanstack-table-pin-right-shadow-active',
                          )}
                        >
                          {!isBuiltin && canFilterCol && (
                            <ColumnFilterCell column={col} />
                          )}
                          {!bordered && col.id !== veryLastLeafColId && (
                            <span
                              aria-hidden="true"
                              className="tanstack-table-header-separator"
                            />
                          )}
                        </th>
                      )
                    })}
                  </tr>
                )}
            </thead>

            {/* TBODY: Rows + Tree Hierarchy + Viewport-Locked Expandable Detail Rows */}
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleLeafColumnsCount}
                    className="py-14 text-center text-muted-foreground bg-card"
                  >
                    {emptyText || (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                          <Inbox className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-medium">
                          {locale.emptyText}
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                <>
                  {paddingTop > 0 && (
                    <tr aria-hidden="true">
                      <td
                        colSpan={visibleLeafColumnsCount}
                        style={{ height: paddingTop, padding: 0, border: 0 }}
                      />
                    </tr>
                  )}
                  {displayedItems.map(
                    ({ row, rowIndex: rowVisualIdx, detail, virtualItem }) => {
                      if (detail && expandable?.expandedRowRender) {
                        return (
                          <tr
                            key={`${row.id}:detail`}
                            data-index={virtualItem?.index}
                            ref={
                              virtualEnabled
                                ? rowVirtualizer.measureElement
                                : undefined
                            }
                            className="bg-(--table-expanded-bg)"
                          >
                            <td
                              colSpan={visibleLeafColumnsCount}
                              className="p-0 border-b border-(--table-border-color) bg-(--table-expanded-bg)"
                            >
                              <div
                                style={{
                                  position: 'sticky',
                                  left: 0,
                                  width:
                                    containerWidth > 0
                                      ? `${containerWidth}px`
                                      : '100%',
                                }}
                                className="px-5 py-4 overflow-hidden animate-in fade-in-0 slide-in-from-top-1 duration-150"
                              >
                                {expandable.expandedRowRender(
                                  row.original,
                                  rowVisualIdx,
                                  true,
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      }
                      const isSelected = row.getIsSelected()
                      return (
                        <tr
                          key={`${row.id}:row`}
                          data-index={virtualItem?.index}
                          ref={
                            virtualEnabled
                              ? rowVirtualizer.measureElement
                              : undefined
                          }
                          onClick={() => {
                            if (
                              expandable?.expandRowByClick &&
                              expandable?.expandedRowRender
                            ) {
                              toggleDetailRow(row.id, row.original)
                            }
                          }}
                          className={cn(
                            'tanstack-table-tr-row group/row',
                            striped &&
                              rowVisualIdx % 2 === 1 &&
                              'tanstack-table-tr-striped',
                            isSelected && 'tanstack-table-tr-selected',
                            expandable?.expandRowByClick &&
                              expandable?.expandedRowRender &&
                              'cursor-pointer',
                          )}
                        >
                          {row.getVisibleCells().map((cell) => {
                            const col = cell.column
                            const pinned = col.getIsPinned()
                            const stickyLeft =
                              pinned === 'left'
                                ? col.getStart('left')
                                : undefined
                            const stickyRight =
                              pinned === 'right'
                                ? col.getAfter('right')
                                : undefined

                            const isLastLeft =
                              pinned === 'left' && col.id === lastLeftPinnedId
                            const isFirstRight =
                              pinned === 'right' &&
                              col.id === firstRightPinnedId

                            const meta = (col.columnDef.meta ||
                              {}) as TanStackColumnMeta<TData>
                            const align = meta.align ?? 'left'

                            return (
                              <td
                                key={cell.id}
                                onMouseDownCapture={(event) => {
                                  // Firefox can natively multi-select table cells on Ctrl/Cmd-click.
                                  // Suppress that behavior on plain cells, but retain normal modifier
                                  // behavior for links, form controls and other interactive content.
                                  const target = event.target as Element
                                  if (
                                    (event.ctrlKey || event.metaKey) &&
                                    !target.closest(
                                      'a, button, input, textarea, select, [contenteditable], [role=button], [role=link]',
                                    )
                                  ) {
                                    event.preventDefault()
                                  }
                                }}
                                onClickCapture={(event) =>
                                  selectCell(
                                    event,
                                    !meta.isBuiltinColumn &&
                                      meta.lightCell !== false,
                                    row.id,
                                    col.id,
                                  )
                                }
                                style={{
                                  width: col.getSize(),
                                  position: pinned ? 'sticky' : 'relative',
                                  left: stickyLeft,
                                  right: stickyRight,
                                  zIndex: pinned ? 20 : 1,
                                }}
                                className={cn(
                                  'tanstack-table-td-surface border-b border-(--table-border-color) text-foreground/90 align-middle',
                                  activeCell?.rowId === row.id &&
                                    activeCell.columnId === col.id &&
                                    !meta.isBuiltinColumn &&
                                    meta.lightCell !== false &&
                                    'tanstack-table-light-cell',
                                  cellPadding,
                                  bordered && 'border-r last:border-r-0',
                                  align === 'center' && 'text-center',
                                  align === 'right' &&
                                    'text-right tabular-nums',
                                  isLastLeft &&
                                    'tanstack-table-pin-left-shadow',
                                  isLastLeft &&
                                    pingLeft &&
                                    'tanstack-table-pin-left-shadow-active',
                                  isFirstRight &&
                                    'tanstack-table-pin-right-shadow',
                                  isFirstRight &&
                                    pingRight &&
                                    'tanstack-table-pin-right-shadow-active',
                                  meta.cellClassName,
                                )}
                              >
                                <div
                                  className={cn(
                                    'min-w-0',
                                    meta.ellipsis && 'truncate',
                                  )}
                                >
                                  {flexRender(
                                    col.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    },
                  )}
                  {paddingBottom > 0 && (
                    <tr aria-hidden="true">
                      <td
                        colSpan={visibleLeafColumnsCount}
                        style={{ height: paddingBottom, padding: 0, border: 0 }}
                      />
                    </tr>
                  )}
                </>
              )}
            </tbody>

            {/* TFOOT: Optional AntD Summary Row */}
            {summary && visibleRows.length > 0 && (
              <tfoot className="sticky bottom-0 z-25 bg-(--table-header-bg) font-medium shadow-[0_-1px_0_var(--table-border-color)]">
                {summary(
                  visibleRows.map((r) => r.original),
                  allFilteredRows.map((r) => r.original),
                  {
                    visibleColumnCount: visibleLeafColumnsCount,
                    containerWidth,
                  },
                )}
              </tfoot>
            )}
          </table>
        </div>

        {/* Ant Design Pagination Bar */}
        {pagination !== false && (
          <TablePagination
            table={table}
            config={pagination}
            totalRows={
              isServerPaging ? (pagination.total ?? 0) : allFilteredRows.length
            }
          />
        )}
      </div>
    </TooltipProvider>
  )
}
