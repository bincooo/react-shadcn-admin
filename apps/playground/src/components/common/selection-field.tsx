import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** 弹窗列表的校验区域：无效时高亮整张表，并关联字段错误说明。 */
export function SelectionField({
  label,
  error,
  errorId,
  children,
}: {
  label: string
  error?: string
  errorId: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <fieldset
        aria-label={label}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'm-0 min-w-0 rounded-xl border-0 p-0',
          error &&
            'ring-3 ring-destructive/20 outline-1 outline-destructive dark:ring-destructive/40 dark:outline-destructive/50',
        )}
      >
        {children}
      </fieldset>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
