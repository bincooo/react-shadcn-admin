import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { JUSTIFY_CLASS } from './grid-table-model'

const SORT_ICONS = {
  asc: ArrowUp,
  desc: ArrowDown,
  none: ArrowUpDown,
} as const

function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  const Icon = SORT_ICONS[direction || 'none']
  return (
    <Icon
      className={cn(
        'size-3.5 shrink-0',
        direction ? 'text-primary' : 'opacity-40',
      )}
    />
  )
}

interface GridTableHeaderCellProps {
  title: ReactNode
  /** 拖拽手柄的可访问名称使用列展示名 */
  label: string
  align: 'left' | 'center' | 'right'
  sortable: boolean
  resizable: boolean
  direction: 'asc' | 'desc' | false
  resizing: boolean
  onToggleSort: (event: ReactMouseEvent<HTMLButtonElement>) => void
  onStartResize: (event: ReactPointerEvent<HTMLSpanElement>) => void
  onResizeMove: (event: ReactPointerEvent<HTMLSpanElement>) => void
  onResizeEnd: () => void
  onResetWidth: () => void
}

/** 可排序 / 可调宽的列头：排序按钮与右侧拖拽手柄共用一个定位容器。 */
export function GridTableHeaderCell({
  title,
  label,
  align,
  sortable,
  resizable,
  direction,
  resizing,
  onToggleSort,
  onStartResize,
  onResizeMove,
  onResizeEnd,
  onResetWidth,
}: GridTableHeaderCellProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'group/head relative flex h-9 min-w-0 items-center gap-1.5',
        JUSTIFY_CLASS[align],
      )}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onToggleSort}
          className={cn(
            'flex w-full min-w-0 cursor-pointer items-center gap-1.5 transition-colors hover:text-foreground',
            JUSTIFY_CLASS[align],
            direction && 'text-foreground',
          )}
        >
          <span className="truncate">{title}</span>
          <SortIcon direction={direction} />
        </button>
      ) : (
        <span className="truncate">{title}</span>
      )}

      {resizable && (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label={t('table.resizeColumn', { label })}
          title={t('table.resizeHint')}
          onPointerDown={onStartResize}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
          onDoubleClick={onResetWidth}
          className="group/resize absolute inset-y-0 -right-3 flex w-2 cursor-col-resize touch-none items-center justify-end select-none"
        >
          {/* 命中区 8px，视觉线只在悬停表头时出现，拖拽时加粗并贯通表头高度 */}
          <span
            aria-hidden="true"
            className={cn(
              'rounded-full transition-all duration-150',
              resizing
                ? 'h-full w-0.5 bg-primary'
                : 'h-4 w-px bg-primary/40 opacity-0 group-hover/head:opacity-100 group-hover/resize:h-6',
            )}
          />
        </span>
      )}
    </div>
  )
}
