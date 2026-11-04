import { useMemo } from 'react'
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnsType } from '@rc-component/table'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { ConfigItem } from './column-config'
import { GridTableHeaderCell } from './grid-table-header'
import {
  DEFAULT_COLUMN_WIDTH,
  SELECT_COLUMN_ID,
  type ColumnEntry,
  type RcColumn,
} from './grid-table-model'
import type { GridTableSort } from './types'

const ARIA_SORT = {
  asc: 'ascending',
  desc: 'descending',
  none: undefined,
} as const

function sortDirection(
  sort: GridTableSort | undefined,
): 'asc' | 'desc' | false {
  if (!sort) return false
  return sort.desc ? 'desc' : 'asc'
}

interface GridTableColumnsOptions<TData extends object> {
  /** 面板列树（分组 / 顺序） */
  treeState: ConfigItem[]
  leaves: Map<string, ColumnEntry<TData>>
  visibilityState: Record<string, boolean>
  pinningState: { start: string[]; end: string[] }
  widthsState: Record<string, number>
  sortingValue: GridTableSort[]
  groupLabels: Record<string, string>
  selectionEnabled: boolean
  selectVisibleState: boolean
  selectableRows: TData[]
  allPageSelected: boolean
  somePageSelected: boolean
  selectedKeys: ReadonlySet<string> | undefined
  getRowKey: (row: TData) => string
  isRowSelectable: ((row: TData) => boolean) | undefined
  selectionSize: number | undefined
  toggleSort: (id: string, event: ReactMouseEvent<HTMLButtonElement>) => void
  setRowSelected: (row: TData, selected: boolean) => void
  setPageSelected: (selected: boolean) => void
  resizingIdState: string | null
  startResize: (event: ReactPointerEvent<HTMLSpanElement>, id: string) => void
  resizeColumn: (event: ReactPointerEvent<HTMLSpanElement>) => void
  stopResize: () => void
  resetColumnWidth: (id: string) => void
}

/**
 * 把面板列树与表格状态翻译成 rc-table 的列定义：
 * 叶子列按可见性展开，分组递归嵌套，勾选列按需插到最前。
 */
export function useGridTableColumns<TData extends object>({
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
  isRowSelectable,
  selectionSize,
  toggleSort,
  setRowSelected,
  setPageSelected,
  resizingIdState,
  startResize,
  resizeColumn,
  stopResize,
  resetColumnWidth,
}: GridTableColumnsOptions<TData>): ColumnsType<TData> {
  const { t } = useTranslation()

  return useMemo<ColumnsType<TData>>(() => {
    // 固定列按 id 查表；列数多时避免每列都做一次数组 includes
    const pinnedStart = new Set(pinningState.start)
    const pinnedEnd = new Set(pinningState.end)
    const fixedSide = (id: string): 'start' | 'end' | undefined => {
      if (pinnedStart.has(id)) return 'start'
      if (pinnedEnd.has(id)) return 'end'
      return undefined
    }

    const buildLeaf = (entry: ColumnEntry<TData>): RcColumn<TData> => {
      const { id, column } = entry
      const align = column.align ?? 'left'
      const sortable = column.sortable ?? Boolean(column.dataIndex)
      const resizable = column.resizable ?? Boolean(column.dataIndex)
      const direction = sortDirection(
        sortingValue.find((sort) => sort.id === id),
      )

      // 排序按钮 / 调宽手柄都需要一个定位容器
      const title =
        sortable || resizable ? (
          <GridTableHeaderCell
            title={column.title}
            label={entry.label}
            align={align}
            sortable={sortable}
            resizable={resizable}
            direction={direction}
            resizing={resizingIdState === id}
            onToggleSort={(event) => toggleSort(id, event)}
            onStartResize={(event) => startResize(event, id)}
            onResizeMove={resizeColumn}
            onResizeEnd={stopResize}
            onResetWidth={() => resetColumnWidth(id)}
          />
        ) : (
          column.title
        )

      return {
        key: id,
        dataIndex: column.dataIndex,
        width: widthsState[id] ?? column.width ?? DEFAULT_COLUMN_WIDTH,
        align,
        title,
        render: column.render,
        onHeaderCell: () => ({
          className: cn('h-9', sortable && 'cursor-pointer'),
          'aria-sort': ARIA_SORT[direction || 'none'],
        }),
        fixed: fixedSide(id),
      }
    }

    /** 面板列树 → rc-table 列定义：叶子按可见性展开，分组递归嵌套 */
    const buildNode = (node: ConfigItem): RcColumn<TData> | null => {
      if (node.kind === 'leaf') {
        if (visibilityState[node.id] === false) return null
        const leaf = leaves.get(node.id)
        return leaf ? buildLeaf(leaf) : null
      }
      const children = node.children
        .map(buildNode)
        .filter((column): column is RcColumn<TData> => column !== null)
      if (children.length === 0) return null
      return {
        key: node.id,
        title: node.label ?? groupLabels[node.id] ?? node.id,
        align: 'center',
        onHeaderCell: () => ({ className: 'h-8' }),
        children,
      }
    }

    const nodes = treeState
      .map(buildNode)
      .filter((column): column is RcColumn<TData> => column !== null)

    if (selectionEnabled && selectVisibleState) {
      let pageChecked: boolean | 'indeterminate' = false
      if (allPageSelected) pageChecked = true
      else if (somePageSelected) pageChecked = 'indeterminate'

      const selectColumn: RcColumn<TData> = {
        key: SELECT_COLUMN_ID,
        title: (
          <Checkbox
            checked={pageChecked}
            disabled={selectableRows.length === 0}
            aria-label={t('table.selectAllPage')}
            onCheckedChange={(checked) => setPageSelected(checked === true)}
          />
        ),
        width: selectionSize ?? 40,
        align: 'center',
        onHeaderCell: () => ({ className: 'h-9' }),
        render: (_value: unknown, record: TData, index: number) => (
          <Checkbox
            checked={selectedKeys?.has(getRowKey(record)) ?? false}
            disabled={isRowSelectable ? !isRowSelectable(record) : false}
            aria-label={t('table.selectRow', { id: index + 1 })}
            onCheckedChange={(checked) =>
              setRowSelected(record, checked === true)
            }
          />
        ),
        fixed: pinnedStart.has(SELECT_COLUMN_ID) ? 'start' : undefined,
      }
      nodes.unshift(selectColumn)
    }

    return nodes
  }, [
    allPageSelected,
    getRowKey,
    groupLabels,
    isRowSelectable,
    leaves,
    pinningState,
    resetColumnWidth,
    resizeColumn,
    resizingIdState,
    selectableRows.length,
    selectedKeys,
    selectionEnabled,
    selectionSize,
    selectVisibleState,
    setPageSelected,
    setRowSelected,
    somePageSelected,
    sortingValue,
    startResize,
    stopResize,
    t,
    toggleSort,
    treeState,
    visibilityState,
    widthsState,
  ])
}
