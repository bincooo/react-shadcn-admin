import type { ColumnsType } from '@rc-component/table'
import { cn } from '@/lib/utils'
import { type ColumnConfigSnapshot, type ConfigItem } from './column-config'
import type {
  GridTableColumn,
  GridTableConfig as GridTableConfigOptions,
  GridTableSort,
} from './types'

/** 内置勾选列的 key（业务传入的列不要占用） */
export const SELECT_COLUMN_ID = 'select'

/** 没有显式 width 的列使用的默认宽度（固定列布局需要每列都有宽度） */
export const DEFAULT_COLUMN_WIDTH = 160
/** 列宽的兜底下限，防止拖拽归零后无法再拖回 */
export const DEFAULT_MIN_WIDTH = 60
/** 单元格对齐 → flex 对齐类名（表头与单元格共用同一映射） */
export const JUSTIFY_CLASS: Record<'left' | 'center' | 'right', string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

/** 固定表头的背景层，保证横向滚动时内容不会透出 */
export const HEADER_SURFACE =
  'bg-[color-mix(in_oklch,var(--muted)_50%,var(--card))]'

/** 未显式提供每页条数选项时使用的默认值 */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/** 表头单元格样式：与数据无关，模块级算一次即可 */
export const HEADER_CELL_CLASS = cn(
  'border-e border-b border-border/70 px-3 text-[12.5px]',
  HEADER_SURFACE,
)

/* ------------------------------ 类型工具 ------------------------------ */

/** rc-table 的列定义（叶子列 / 分组列） */
export type RcColumn<TData extends object> = ColumnsType<TData>[number]

export interface ColumnEntry<TData extends object> {
  id: string
  column: GridTableColumn<TData>
  label: string
}

export interface InitialState extends ColumnConfigSnapshot {
  widths: Record<string, number>
}

/** 列 id：配置面板、显隐、固定、列宽都按它保存（有 dataIndex 时取字段名） */
function resolveColumnId<TData extends object>(
  column: GridTableColumn<TData>,
  index: number,
): string {
  if (column.key) return column.key
  if (typeof column.dataIndex === 'string') return column.dataIndex
  return `col-${index}`
}

/** 列 / 分组在配置面板里的展示名 */
function resolveLabel<TData extends object>(
  column: GridTableColumn<TData>,
  fallback: string,
): string {
  if (typeof column.title === 'string') return column.title
  return column.label ?? fallback
}

/** 收集叶子列与展示名（分组可任意嵌套） */
export function collectColumnInfo<TData extends object>(
  columns: ReadonlyArray<GridTableColumn<TData>>,
): {
  leaves: Map<string, ColumnEntry<TData>>
  leafLabels: Record<string, string>
  groupLabels: Record<string, string>
} {
  const leaves = new Map<string, ColumnEntry<TData>>()
  const leafLabels: Record<string, string> = {}
  const groupLabels: Record<string, string> = {}

  const walk = (cols: ReadonlyArray<GridTableColumn<TData>>) => {
    cols.forEach((column, index) => {
      const id = resolveColumnId(column, index)
      if (column.children?.length) {
        groupLabels[id] = resolveLabel(column, id)
        walk(column.children)
        return
      }
      const label = resolveLabel(column, id)
      leaves.set(id, { id, column, label })
      leafLabels[id] = label
    })
  }

  walk(columns)
  return { leaves, leafLabels, groupLabels }
}

/** 按传入 columns 的分组结构生成面板的初始列树（分组可任意嵌套） */
function buildInitialItems<TData extends object>(
  columns: ReadonlyArray<GridTableColumn<TData>>,
): ConfigItem[] {
  return columns.map((column, index): ConfigItem => {
    const id = resolveColumnId(column, index)
    if (column.children?.length) {
      return {
        kind: 'group',
        id,
        // 有 key 的分组跟随 columns 的标题（如切换语言），没有才固化名称
        label: column.key ? undefined : resolveLabel(column, id),
        children: buildInitialItems(column.children),
      }
    }
    return { kind: 'leaf', id }
  })
}

/** 首次渲染时的列结构 / 显隐 / 固定 / 列宽，「恢复默认」以它为基准 */
export function buildInitialState<TData extends object>(
  columns: ReadonlyArray<GridTableColumn<TData>>,
  config: GridTableConfigOptions<TData>,
  selectionEnabled: boolean,
): InitialState {
  const { leaves } = collectColumnInfo(columns)
  const items = buildInitialItems(columns)
  const visibility: Record<string, boolean> = {}
  const widths: Record<string, number> = {}
  const fixedStart: string[] = []
  const fixedEnd: string[] = []

  for (const [id, entry] of leaves) {
    visibility[id] = config.initialVisibility?.[id] ?? !entry.column.hidden
    widths[id] = entry.column.width ?? DEFAULT_COLUMN_WIDTH
    if (entry.column.fixed === 'left') fixedStart.push(id)
    if (entry.column.fixed === 'right') fixedEnd.push(id)
  }

  const pinning = {
    start: [
      ...new Set([
        ...(selectionEnabled ? [SELECT_COLUMN_ID] : []),
        ...(config.initialPinning?.start ?? []),
        ...fixedStart,
      ]),
    ],
    end: [...new Set([...(config.initialPinning?.end ?? []), ...fixedEnd])],
  }

  return { items, visibility, widths, pinning }
}

/** 三态排序循环：无序 → 升序 → 降序 → 无序；无 sortKey 的列视为不可排序 */
export function nextSorting(
  current: GridTableSort[],
  id: string,
  multi: boolean,
): GridTableSort[] {
  const existing = current.find((sort) => sort.id === id)
  if (!existing) {
    return multi ? [...current, { id, desc: false }] : [{ id, desc: false }]
  }
  if (existing.desc) return current.filter((sort) => sort.id !== id)
  return multi
    ? current.map((sort) => (sort.id === id ? { ...sort, desc: true } : sort))
    : [{ id, desc: true }]
}

/** 单元格比较：数字按数值、其余按本地化字符串，空值恒排在后 */
export function compareCellValue(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === undefined || a === null) return 1
  if (b === undefined || b === null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

/** 取单元格原始值：优先 dataIndex，其次 render 的返回值不可比较，退回 row */
export function readCellValue(row: object, field: string): unknown {
  return (row as unknown as Record<string, unknown>)[field]
}

/** 列宽总和：横向滚动范围与固定列偏移都由它决定 */
export function sumColumnWidths<TData extends object>(
  columns: ColumnsType<TData>,
): number {
  return columns.reduce((total, column) => {
    if ('children' in column) return total + sumColumnWidths(column.children)
    return (
      total +
      (typeof column.width === 'number' ? column.width : DEFAULT_COLUMN_WIDTH)
    )
  }, 0)
}
