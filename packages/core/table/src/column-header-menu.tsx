import type { Column } from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUp,
  EllipsisVertical,
  EyeOff,
  PinOff,
  RotateCcw,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { cn } from '@repo/ui/lib/utils'
import { useTableLocale } from './locale'
import type { TanStackColumnMeta } from './types'

interface ColumnHeaderMenuProps<TData> {
  column: Column<TData, unknown>
}

/**
 * AG-Grid-style vertical-ellipsis (⋮) column menu shown on every leaf header.
 * Provides sorting, left/right pinning and column hiding.
 */
export function ColumnHeaderMenu<TData>({
  column,
}: ColumnHeaderMenuProps<TData>) {
  const tableLocale = useTableLocale()
  const meta = (column.columnDef.meta || {}) as TanStackColumnMeta
  const pinned = column.getIsPinned()
  const sorted = column.getIsSorted()
  const canSort = column.getCanSort()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={tableLocale.columnMenuLabel(
              meta.titleText || column.id,
            )}
            title={tableLocale.columnMenuTitle}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'tanstack-table-col-menu-trigger tanstack-table-header-icon-button',
              'data-[popup-open]:bg-black/[0.07] dark:data-[popup-open]:bg-white/[0.1]',
            )}
          />
        }
      >
        <EllipsisVertical className="h-3.5 w-3.5" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 text-xs">
        {canSort && (
          <>
            <DropdownMenuItem
              onClick={() => column.toggleSorting(false)}
              className={cn(sorted === 'asc' && 'font-semibold text-primary')}
            >
              <ArrowUp className="h-3.5 w-3.5" />
              {tableLocale.sortAscending}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => column.toggleSorting(true)}
              className={cn(sorted === 'desc' && 'font-semibold text-primary')}
            >
              <ArrowDown className="h-3.5 w-3.5" />
              {tableLocale.sortDescending}
            </DropdownMenuItem>
            {sorted && (
              <DropdownMenuItem onClick={() => column.clearSorting()}>
                <RotateCcw className="h-3.5 w-3.5" />
                {tableLocale.clearSorting}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          disabled={!column.getCanPin()}
          onClick={() => column.pin(pinned === 'left' ? false : 'left')}
          className={cn(pinned === 'left' && 'font-semibold text-primary')}
        >
          <ArrowLeftToLine className="h-3.5 w-3.5" />
          {pinned === 'left' ? tableLocale.unpinLeft : tableLocale.pinLeft}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!column.getCanPin()}
          onClick={() => column.pin(pinned === 'right' ? false : 'right')}
          className={cn(pinned === 'right' && 'font-semibold text-primary')}
        >
          <ArrowRightToLine className="h-3.5 w-3.5" />
          {pinned === 'right' ? tableLocale.unpinRight : tableLocale.pinRight}
        </DropdownMenuItem>
        {pinned && (
          <DropdownMenuItem onClick={() => column.pin(false)}>
            <PinOff className="h-3.5 w-3.5" />
            {tableLocale.unpin}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!column.getCanHide()}
          onClick={() => column.toggleVisibility(false)}
        >
          <EyeOff className="h-3.5 w-3.5" />
          {tableLocale.hideColumn}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
