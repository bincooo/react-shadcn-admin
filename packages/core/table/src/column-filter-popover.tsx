import { useEffect, useMemo, useState } from 'react'
import type { Column } from '@tanstack/react-table'
import { Search, RotateCcw, Check } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Input } from '@repo/ui/components/input'
import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'
import { useTableLocale } from './locale'
import type { TanStackColumnMeta, TanStackFilterItem } from './types'

interface ColumnFilterPopoverProps<TData> {
  column: Column<TData, unknown>
  /** Optional controlled open state (used by the floating filter row). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ColumnFilterPopover<TData>({
  column,
  open: openProp,
  onOpenChange,
}: ColumnFilterPopoverProps<TData>) {
  const tableLocale = useTableLocale()
  const meta = (column.columnDef.meta || {}) as TanStackColumnMeta<TData>
  const mode = meta.filterMode || (meta.filters ? 'menu' : 'search')
  const filterMultiple = meta.filterMultiple ?? true
  const currentFilterValue = column.getFilterValue()

  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = (next: boolean) => {
    setInternalOpen(next)
    onOpenChange?.(next)
  }
  const [optionSearch, setOptionSearch] = useState('')

  // Local draft states inside popover (just like Ant Design confirm/reset UX)
  const [selectedValues, setSelectedValues] = useState<unknown[]>([])
  const [keyword, setKeyword] = useState<string>('')
  const [minVal, setMinVal] = useState<string>('')
  const [maxVal, setMaxVal] = useState<string>('')

  // Sync draft state when popover opens or external filter resets
  useEffect(() => {
    if (!open) return
    if (mode === 'menu') {
      if (Array.isArray(currentFilterValue)) {
        setSelectedValues(currentFilterValue)
      } else if (
        currentFilterValue !== undefined &&
        currentFilterValue !== null
      ) {
        setSelectedValues([currentFilterValue])
      } else {
        setSelectedValues([])
      }
    } else if (mode === 'search') {
      setKeyword(
        typeof currentFilterValue === 'string' ? currentFilterValue : '',
      )
    } else if (mode === 'numberRange' || mode === 'dateRange') {
      const pair = Array.isArray(currentFilterValue)
        ? currentFilterValue
        : [undefined, undefined]
      const start =
        pair[0] !== undefined && pair[0] !== '' ? String(pair[0]) : ''
      const end = pair[1] !== undefined && pair[1] !== '' ? String(pair[1]) : ''
      // 日期输入只接受 YYYY-MM-DD；带时间的既有值截取日期部分
      setMinVal(mode === 'dateRange' ? start.slice(0, 10) : start)
      setMaxVal(mode === 'dateRange' ? end.slice(0, 10) : end)
    }
  }, [currentFilterValue, mode, open])

  // PERF: facet counts are only needed while a menu-mode popover is OPEN.
  // Reading getFacetedUniqueValues() eagerly for EVERY column (any mode, even
  // closed) forced a full faceted filter pass per column on every keystroke.
  // TanStack memoizes the computation internally, so a direct read here is
  // cheap and always fresh (the previous useMemo([column]) also went stale).
  const facetedCounts =
    open && mode === 'menu' ? column.getFacetedUniqueValues() : null

  // menu 模式未显式提供 filters 时，从当前数据中去重生成选项（并复用 facet 计数）。
  // 显式 filters 优先，保持调用方定义的顺序与文案。
  const menuOptions = useMemo<TanStackFilterItem[]>(() => {
    if (meta.filters && meta.filters.length > 0) return meta.filters
    if (!facetedCounts) return []
    const items: TanStackFilterItem[] = []
    for (const value of facetedCounts.keys()) {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        items.push({ text: String(value), value })
      }
    }
    // 自动选项按值排序，避免跟随当前排序/筛选后顺序跳动
    items.sort((a, b) =>
      typeof a.value === 'number' && typeof b.value === 'number'
        ? a.value - b.value
        : String(a.value).localeCompare(String(b.value)),
    )
    return items
  }, [meta.filters, facetedCounts])

  const visibleOptions = useMemo(() => {
    if (!optionSearch.trim()) return menuOptions
    const q = optionSearch.trim().toLowerCase()
    return menuOptions.filter((item) =>
      String(item.text ?? item.value)
        .toLowerCase()
        .includes(q),
    )
  }, [menuOptions, optionSearch])

  const isFiltered = useMemo(() => {
    if (currentFilterValue === undefined || currentFilterValue === null)
      return false
    if (Array.isArray(currentFilterValue)) {
      if (mode === 'numberRange' || mode === 'dateRange') {
        return (
          (currentFilterValue[0] !== undefined &&
            currentFilterValue[0] !== '') ||
          (currentFilterValue[1] !== undefined && currentFilterValue[1] !== '')
        )
      }
      return currentFilterValue.length > 0
    }
    if (typeof currentFilterValue === 'string') {
      return currentFilterValue.trim().length > 0
    }
    return true
  }, [currentFilterValue, mode])

  const handleConfirm = () => {
    if (mode === 'menu') {
      column.setFilterValue(
        selectedValues.length > 0 ? selectedValues : undefined,
      )
    } else if (mode === 'search') {
      column.setFilterValue(keyword.trim() ? keyword.trim() : undefined)
    } else if (mode === 'numberRange') {
      const parsedMin = minVal.trim() !== '' ? Number(minVal) : undefined
      const parsedMax = maxVal.trim() !== '' ? Number(maxVal) : undefined
      if (parsedMin === undefined && parsedMax === undefined) {
        column.setFilterValue(undefined)
      } else {
        column.setFilterValue([parsedMin, parsedMax])
      }
    } else if (mode === 'dateRange') {
      let start = minVal.trim() || undefined
      let end = maxVal.trim() || undefined
      // 日期输入统一为 YYYY-MM-DD，可直接按字符串纠正倒置区间
      if (start && end && start > end) [start, end] = [end, start]
      if (start === undefined && end === undefined) {
        column.setFilterValue(undefined)
      } else {
        column.setFilterValue([start, end])
      }
    }
    setOpen(false)
  }

  const handleReset = () => {
    setSelectedValues([])
    setKeyword('')
    setMinVal('')
    setMaxVal('')
    setOptionSearch('')
    column.setFilterValue(undefined)
    setOpen(false)
  }

  const toggleValue = (val: unknown) => {
    if (!filterMultiple) {
      setSelectedValues((prev) => (prev[0] === val ? [] : [val]))
      return
    }
    setSelectedValues((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val],
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
            }}
            title={tableLocale.filterThisColumn}
            className={cn(
              'tanstack-table-header-icon-button relative',
              isFiltered && 'tanstack-table-header-icon-active',
            )}
          />
        }
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
          data-icon="table-filter"
        >
          <path d="M2 3.5h12v1.25L9.5 9.2v3.25l-3 1.55V9.2L2 4.75V3.5Z" />
        </svg>
        {isFiltered && (
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary ring-1 ring-card" />
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-60 gap-0 p-0 shadow-xl text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-3 py-2 flex items-center justify-between bg-muted/40">
          <span className="text-xs font-medium text-foreground truncate">
            {tableLocale.filterTitle(meta.titleText)}
          </span>
          {mode === 'menu' && filterMultiple && menuOptions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (selectedValues.length === menuOptions.length) {
                  setSelectedValues([])
                } else {
                  setSelectedValues(menuOptions.map((f) => f.value))
                }
              }}
              className="text-[11px] text-primary hover:underline"
            >
              {selectedValues.length === menuOptions.length
                ? tableLocale.deselectAll
                : tableLocale.selectAll}
            </button>
          )}
        </div>

        {/* MENU MODE */}
        {mode === 'menu' && (
          <div className="p-2">
            {meta.filterSearch && (
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={optionSearch}
                  onChange={(e) => setOptionSearch(e.target.value)}
                  placeholder={tableLocale.searchFilterOptions}
                  className="h-7 pl-7 text-xs rounded-none"
                />
              </div>
            )}
            <div
              role="listbox"
              aria-label={tableLocale.filterOptionsLabel(meta.titleText)}
              aria-multiselectable={filterMultiple}
              className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5"
            >
              {visibleOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  {tableLocale.noMatchingFilters}
                </div>
              ) : (
                visibleOptions.map((item) => {
                  const checked = selectedValues.includes(item.value)
                  const count = facetedCounts?.get(item.value)
                  return (
                    <div
                      key={String(item.value)}
                      role="option"
                      aria-selected={checked}
                      tabIndex={0}
                      onClick={() => toggleValue(item.value)}
                      onKeyDown={(event) => {
                        if (
                          event.target === event.currentTarget &&
                          (event.key === 'Enter' || event.key === ' ')
                        ) {
                          event.preventDefault()
                          toggleValue(item.value)
                        }
                      }}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-xs transition-colors hover:bg-accent',
                        checked && 'bg-primary/[0.07] text-primary font-medium',
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {filterMultiple ? (
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleValue(item.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            className={cn(
                              'flex h-3.5 w-3.5 items-center justify-center rounded-full border',
                              checked
                                ? 'border-primary bg-primary text-white'
                                : 'border-slate-300 dark:border-slate-600',
                            )}
                          >
                            {checked && (
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            )}
                          </span>
                        )}
                        <span className="truncate">{item.text}</span>
                      </span>
                      {count !== undefined && (
                        <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] tabular-nums text-muted-foreground">
                          {count}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* KEYWORD SEARCH MODE */}
        {mode === 'search' && (
          <div className="p-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm()
                }}
                placeholder={tableLocale.searchColumnPlaceholder(
                  meta.titleText,
                )}
                className="pl-8 text-xs rounded-none"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {tableLocale.fuzzyMatchHint}
            </p>
          </div>
        )}

        {/* DATE RANGE MODE */}
        {mode === 'dateRange' && (
          <div className="p-3">
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={minVal}
                onChange={(e) => setMinVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm()
                }}
                aria-label={tableLocale.startDate}
                title={tableLocale.startDate}
                className="tanstack-table-input"
              />
              <span className="text-xs text-muted-foreground">~</span>
              <input
                type="date"
                value={maxVal}
                onChange={(e) => setMaxVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm()
                }}
                aria-label={tableLocale.endDate}
                title={tableLocale.endDate}
                className="tanstack-table-input"
              />
            </div>
          </div>
        )}

        {/* NUMBER RANGE MODE */}
        {mode === 'numberRange' && (
          <div className="p-3 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={minVal}
                onChange={(e) => setMinVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm()
                }}
                placeholder={tableLocale.minValue}
                className="tanstack-table-input"
              />
              <span className="text-xs text-muted-foreground">~</span>
              <input
                type="number"
                value={maxVal}
                onChange={(e) => setMaxVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm()
                }}
                placeholder={tableLocale.maxValue}
                className="tanstack-table-input"
              />
            </div>
            {meta.unit && (
              <p className="text-[11px] text-muted-foreground">
                {tableLocale.unitHint(meta.unit)}
              </p>
            )}
          </div>
        )}

        {/* AntD Footer: Reset & Confirm */}
        <div className="flex items-center justify-between border-t bg-muted/25 px-2.5 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground rounded-none"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            {tableLocale.reset}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            className="h-6 px-3 text-xs rounded-none"
          >
            {tableLocale.applyFilter}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
