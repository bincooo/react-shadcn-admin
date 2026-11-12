import { useMemo, useState } from 'react'
import type { Column } from '@tanstack/react-table'
import { cn } from '@repo/ui/lib/utils'
import { ColumnFilterPopover } from './column-filter-popover'
import { useTableLocale } from './locale'
import type { TanStackColumnMeta } from './types'
import { useDebouncedInput } from './use-debounced-input'

interface ColumnFilterCellProps<TData> {
  column: Column<TData, unknown>
}

/**
 * AG-Grid-style floating filter row cell: a compact input plus a funnel
 * button. Search-mode columns filter live as you type; menu / number-range
 * columns show a read-only summary and open the advanced filter popover.
 */
export function ColumnFilterCell<TData>({
  column,
}: ColumnFilterCellProps<TData>) {
  const tableLocale = useTableLocale()
  const meta = (column.columnDef.meta || {}) as TanStackColumnMeta<TData>
  const mode = meta.filterMode || (meta.filters ? 'menu' : 'search')
  const value = column.getFilterValue()
  const [open, setOpen] = useState(false)

  // PERF: debounce live filtering — one pipeline run per typing pause instead
  // of one per keystroke. Enter / blur commits immediately.
  const { draft, setDraft, flush } = useDebouncedInput(
    typeof value === 'string' ? value : '',
    (next) => column.setFilterValue(next || undefined),
  )

  const summary = useMemo(() => {
    if (mode === 'menu') {
      if (Array.isArray(value) && value.length > 0) {
        const labels = value.map((v) => {
          const match = meta.filters?.find((f) => f.value === v)
          return match && typeof match.text === 'string'
            ? match.text
            : String(v)
        })
        return labels.join(tableLocale.listSeparator)
      }
      return ''
    }
    if (mode === 'numberRange' || mode === 'dateRange') {
      if (Array.isArray(value)) {
        const [min, max] = value as [unknown, unknown]
        const hasMin = min !== undefined && min !== null && min !== ''
        const hasMax = max !== undefined && max !== null && max !== ''
        if (hasMin || hasMax) {
          return `${hasMin ? min : tableLocale.unbounded} ~ ${hasMax ? max : tableLocale.unbounded}`
        }
      }
      return ''
    }
    return typeof value === 'string' ? value : ''
  }, [mode, value, meta.filters, tableLocale])

  const isFiltered = summary.trim().length > 0

  return (
    <div className="tanstack-table-filter-cell-inner">
      {mode === 'search' ? (
        <input
          type="text"
          className="tanstack-table-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') flush()
          }}
          onBlur={flush}
          onClick={(e) => e.stopPropagation()}
          placeholder=""
          aria-label={tableLocale.filterColumnLabel(
            meta.titleText || column.id,
          )}
        />
      ) : (
        <input
          type="text"
          className={cn(
            'tanstack-table-input cursor-pointer',
            isFiltered && 'tanstack-table-input-active',
          )}
          value={summary}
          readOnly
          placeholder=""
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
          }}
          aria-label={tableLocale.filterColumnLabel(
            meta.titleText || column.id,
          )}
        />
      )}
      <ColumnFilterPopover column={column} open={open} onOpenChange={setOpen} />
    </div>
  )
}
