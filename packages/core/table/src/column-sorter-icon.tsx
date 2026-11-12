import type React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

interface ColumnSorterIconProps {
  direction: false | 'asc' | 'desc'
  sortIndex?: number
  multiSortCount?: number
  className?: string
}

/**
 * Dual stacked ChevronUp / ChevronDown sorter indicator using lucide-react
 * with multi-column sort priority badge when >1 columns are sorted.
 */
export const ColumnSorterIcon: React.FC<ColumnSorterIconProps> = ({
  direction,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 shrink-0 select-none ml-1',
        className,
      )}
    >
      <span className="inline-flex flex-col items-center justify-center -space-y-1.25">
        <ChevronUp
          strokeWidth={2}
          className={cn(
            'size-3 transition-colors',
            direction === 'asc' ? 'text-primary' : 'text-(--table-header-icon)',
          )}
        />
        <ChevronDown
          strokeWidth={2}
          className={cn(
            'size-3 transition-colors',
            direction === 'desc'
              ? 'text-primary'
              : 'text-(--table-header-icon)',
          )}
        />
      </span>
    </span>
  )
}
