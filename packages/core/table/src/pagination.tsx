import { useState } from 'react'
import type { Table } from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ellipsis,
} from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { cn } from '@repo/ui/lib/utils'
import { useTableLocale } from './locale'
import type { TanStackPaginationConfig } from './types'

interface TablePaginationProps<TData> {
  table: Table<TData>
  config: TanStackPaginationConfig
  totalRows: number
}

export function TablePagination<TData>({
  table,
  config,
  totalRows,
}: TablePaginationProps<TData>) {
  const tableLocale = useTableLocale()
  const [jumpInput, setJumpInput] = useState('')
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = Math.max(1, table.getPageCount())
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min(totalRows, (pageIndex + 1) * pageSize)
  const pageSizeOptions = config.pageSizeOptions || [50, 100, 500, 1000]

  // Generate AntD-style page number buttons with smart ellipsis
  const pageNumbers: (number | 'ellipsis-left' | 'ellipsis-right')[] = []
  if (pageCount <= 7) {
    for (let i = 0; i < pageCount; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(0)
    if (pageIndex > 2) pageNumbers.push('ellipsis-left')
    const rangeStart = Math.max(1, pageIndex - 1)
    const rangeEnd = Math.min(pageCount - 2, pageIndex + 1)
    for (let i = rangeStart; i <= rangeEnd; i++) pageNumbers.push(i)
    if (pageIndex < pageCount - 3) pageNumbers.push('ellipsis-right')
    pageNumbers.push(pageCount - 1)
  }

  const handleJump = () => {
    const parsed = Number(jumpInput)
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= pageCount) {
      table.setPageIndex(parsed - 1)
    }
    setJumpInput('')
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 border-t bg-card/60 text-xs">
      <div className="text-muted-foreground tabular-nums">
        {config.showTotal ? (
          config.showTotal(totalRows, [start, end])
        ) : (
          <span>{tableLocale.total(start, end, totalRows)}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          title={tableLocale.previousPage}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {pageNumbers.map((item, idx) => {
          if (item === 'ellipsis-left' || item === 'ellipsis-right') {
            const isLeft = item === 'ellipsis-left'
            return (
              <button
                key={`${item}-${idx}`}
                type="button"
                title={
                  isLeft
                    ? tableLocale.jumpBackward(5)
                    : tableLocale.jumpForward(5)
                }
                onClick={() =>
                  table.setPageIndex(
                    isLeft
                      ? Math.max(0, pageIndex - 5)
                      : Math.min(pageCount - 1, pageIndex + 5),
                  )
                }
                className="group inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
              >
                <Ellipsis className="group-hover:hidden h-3.5 w-3.5" />
                {isLeft ? (
                  <ChevronsLeft className="hidden group-hover:block h-3.5 w-3.5" />
                ) : (
                  <ChevronsRight className="hidden group-hover:block h-3.5 w-3.5" />
                )}
              </button>
            )
          }

          const active = item === pageIndex
          return (
            <button
              key={item}
              type="button"
              onClick={() => table.setPageIndex(item)}
              className={cn(
                'inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-medium tabular-nums transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-transparent hover:border-border hover:bg-accent text-foreground/85',
              )}
            >
              {item + 1}
            </button>
          )
        })}

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          title={tableLocale.nextPage}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        {config.showSizeChanger !== false && (
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              if (v !== null) table.setPageSize(Number(v))
            }}
          >
            <SelectTrigger size="sm" className="w-24.5 ml-1 text-xs">
              <SelectValue>
                {(val: string | null) =>
                  tableLocale.pageSize(Number(val ?? pageSize))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {tableLocale.pageSize(size)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {config.showQuickJumper !== false && pageCount > 1 && (
          <div className="flex items-center gap-1.5 ml-1 text-muted-foreground">
            <span>{tableLocale.jumpTo}</span>
            <Input
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJump()
              }}
              placeholder={String(pageIndex + 1)}
              className="h-7 w-12 px-1.5 text-center tabular-nums"
            />
            <span>{tableLocale.pageSuffix}</span>
          </div>
        )}
      </div>
    </div>
  )
}
