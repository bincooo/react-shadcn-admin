import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Table from '@rc-component/table'
import { Inbox } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/common/pagination'
import { cn } from '@/lib/utils'
import {
  collectLeafKeys,
  type ColumnConfigSnapshot,
  type ConfigItem,
} from './column-config'
import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  HEADER_CELL_CLASS,
  HEADER_SURFACE,
  buildInitialState,
  collectColumnInfo,
  sumColumnWidths,
} from './grid-table-model'
import {
  GridTableColumnConfigPopover,
  GridTablePropertiesPopover,
} from './grid-table-toolbar'
import { SelectionCapsule } from './selection-capsule'
import type { GridTableProps } from './types'
import { useGridTableColumns } from './use-grid-table-columns'
import { useGridTableColumnResize } from './use-grid-table-resize'
import { useGridTableSelection } from './use-grid-table-selection'
import { useGridTableSorting } from './use-grid-table-sorting'

/** 树形数据默认每层缩进（px）；rc-table 的 indentSize 缺省会算出 NaN，层级不可见 */
const TREE_INDENT_SIZE = 15

interface GridTableEmptyProps {
  showSkeleton: boolean
  title?: string
  description?: string
}

/** 首屏加载骨架或无数据占位。 */
function GridTableEmpty({
  showSkeleton,
  title,
  description,
}: GridTableEmptyProps) {
  const { t } = useTranslation()

  if (showSkeleton) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  return (
    <Empty className="border-0 py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>{title ?? t('table.emptyTitle')}</EmptyTitle>
        <EmptyDescription>
          {description ?? t('table.emptyDescription')}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/**
 * 通用表格组件（渲染由 `@rc-component/table` 承担）。
 *
 * 使用侧只需要传 `columns`、`data`、`config`：
 * - `columns` 是 antd 风格的 `title / dataIndex / render`，分组用 `children`；
 *   它们会被转成 rc-table 的列定义，分组表头、左右固定列、横向滚动由 rc-table 负责；
 * - `config` 里放标题、分页、排序、多选、初始固定列等行为配置；
 * - 列配置（分组 / 拖拽 / 显隐 / 固定）、边框模式、多选开关、拖拽调宽、
 *   吸顶表头仍由组件内部维护，因为 rc-table 不提供这些交互。
 */
export function GridTable<TData extends object>({
  columns,
  data,
  config = {},
}: GridTableProps<TData>) {
  const { t } = useTranslation()

  const selectionEnabled =
    Boolean(config.selection) && config.features?.selection !== false
  const showBorderToggle = config.features?.border !== false
  const showColumnConfig = config.features?.columnConfig !== false
  // 边框与多选合并进「属性」面板；两者都关闭时整个入口不渲染
  const showProperties = showBorderToggle || selectionEnabled

  // 首次渲染时固化初始结构 / 显隐 / 固定 / 列宽，「恢复默认」以它为基准
  const [initialState] = useState(() =>
    buildInitialState(columns, config, selectionEnabled),
  )

  const [treeState, setTree] = useState<ConfigItem[]>(initialState.items)
  const [visibilityState, setVisibility] = useState(initialState.visibility)
  const [pinningState, setPinning] = useState(initialState.pinning)
  const [configOpenState, setConfigOpen] = useState(false)
  const [borderModeState, setBorderMode] = useState<'row' | 'grid'>(
    config.defaultBorder ?? 'row',
  )

  // columns 变化时重新收集列信息：名称 / render 跟随更新（例如切换语言）
  const { leaves, leafLabels, groupLabels } = useMemo(
    () => collectColumnInfo(columns),
    [columns],
  )

  const { sortingValue, toggleSort, sortedData } = useGridTableSorting({
    sorting: config.sorting,
    data,
  })

  const rowKey = config.rowKey
  const getRowKey = useCallback(
    (row: TData) =>
      rowKey ? String(rowKey(row)) : String((row as { id?: unknown }).id),
    [rowKey],
  )

  const {
    selectVisibleState,
    setSelectable,
    selectedKeys,
    selectedCount,
    selectableRows,
    allPageSelected,
    somePageSelected,
    setRowSelected,
    setPageSelected,
    clearSelection,
  } = useGridTableSelection({
    selection: config.selection,
    selectionEnabled,
    data: sortedData,
    getRowKey,
  })

  const {
    widthsState,
    resizingIdState,
    startResize,
    resizeColumn,
    stopResize,
    resetColumnWidth,
  } = useGridTableColumnResize({ leaves, initialWidths: initialState.widths })

  const tableColumns = useGridTableColumns({
    treeState,
    leaves,
    visibilityState,
    pinningState,
    widthsState,
    sortingValue,
    groupLabels,
    selectionEnabled,
    selectVisibleState,
    selectableRows,
    allPageSelected,
    somePageSelected,
    selectedKeys,
    getRowKey,
    isRowSelectable: config.selection?.isRowSelectable,
    selectionSize: config.selection?.size,
    toggleSort,
    setRowSelected,
    setPageSelected,
    resizingIdState,
    startResize,
    resizeColumn,
    stopResize,
    resetColumnWidth,
  })

  const totalWidth = useMemo(
    () => Math.max(1, Math.round(sumColumnWidths(tableColumns))),
    [tableColumns],
  )

  // 面板打开时才渲染，但快照放在这里缓存，列结构 / 显隐 / 固定不变时不重建
  const configSnapshot = useMemo<ColumnConfigSnapshot>(
    () => ({
      items: treeState,
      visibility: Object.fromEntries(
        collectLeafKeys(treeState).map((id) => [
          id,
          visibilityState[id] ?? true,
        ]),
      ),
      pinning: { start: [...pinningState.start], end: [...pinningState.end] },
    }),
    [treeState, visibilityState, pinningState],
  )

  /** 确认面板：重建列结构，并一次性应用显隐与固定状态 */
  const applyConfig = (next: ColumnConfigSnapshot) => {
    setTree(next.items)
    setVisibility(next.visibility)
    // 固定列只按列 id 打标，实际顺序由列定义（tree）决定，
    // 因此面板里拖拽换位时只要更新列结构即可。
    setPinning({
      start: [...next.pinning.start],
      end: [...next.pinning.end],
    })
    setConfigOpen(false)
  }

  const showSkeleton = Boolean(config.loading) && data.length === 0

  const totalNode =
    config.total === undefined
      ? null
      : t('common.total', { total: config.total })

  return (
    <Card className="rc-grid-card gap-0 py-0">
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3',
          HEADER_SURFACE,
        )}
      >
        <div className="text-[13px] font-medium">
          {config.title}
          {totalNode && (
            <span className="ml-2 text-[12px] font-normal text-muted-foreground">
              {totalNode}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {config.toolbarAction && (
            <>
              {config.toolbarAction}
              <span
                aria-hidden="true"
                className="h-4 w-px shrink-0 bg-border"
              />
            </>
          )}
          {showProperties && (
            <GridTablePropertiesPopover
              showBorderToggle={showBorderToggle}
              borderMode={borderModeState}
              onBorderModeChange={setBorderMode}
              selectionEnabled={selectionEnabled}
              selectVisible={selectVisibleState}
              onSelectVisibleChange={setSelectable}
            />
          )}
          {showColumnConfig && (
            <GridTableColumnConfigPopover
              open={configOpenState}
              onOpenChange={setConfigOpen}
              snapshot={configSnapshot}
              defaults={initialState}
              leafLabels={leafLabels}
              groupLabels={groupLabels}
              onApply={applyConfig}
            />
          )}
        </div>
      </div>

      {/* contain-inline-size：不让表格的最小宽度把页面撑宽，横向滚动留在卡片内 */}
      <div className="contain-inline-size">
        <Table
          className={cn(
            'rc-grid text-[13px]',
            borderModeState === 'grid' && 'rc-grid-border-grid',
          )}
          columns={tableColumns}
          data={sortedData}
          rowKey={getRowKey}
          tableLayout="fixed"
          scroll={{ x: totalWidth }}
          sticky
          expandable={{ indentSize: TREE_INDENT_SIZE, ...config.expandable }}
          rowHoverable
          rowClassName={(row) =>
            selectedKeys?.has(getRowKey(row)) ? 'rc-grid-row-selected' : ''
          }
          emptyText={
            <GridTableEmpty
              showSkeleton={showSkeleton}
              title={config.emptyTitle}
              description={config.emptyDescription}
            />
          }
          classNames={{
            header: { cell: HEADER_CELL_CLASS },
            body: {
              wrapper: config.loading
                ? 'opacity-60 transition-opacity'
                : undefined,
              cell: cn(
                'border-b px-3 py-2 align-middle',
                borderModeState === 'grid' && 'border-e',
              ),
            },
          }}
        />
      </div>

      {config.pagination && (
        <Pagination
          page={config.pagination.page}
          totalPages={Math.max(
            1,
            Math.ceil(config.pagination.total / config.pagination.pageSize),
          )}
          onPageChange={config.pagination.onPageChange}
          pageSize={config.pagination.pageSize}
          pageSizeOptions={
            config.pagination.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS
          }
          onPageSizeChange={config.pagination.onPageSizeChange}
        />
      )}

      {selectedCount > 0 && (
        <SelectionCapsule
          count={selectedCount}
          actions={config.selection?.actions}
          getContainer={config.selection?.getContainer}
          onClear={clearSelection}
        />
      )}
    </Card>
  )
}
