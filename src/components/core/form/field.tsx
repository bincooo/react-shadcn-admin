import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * 查询字段：标题在上、控件在下；固定宽度，随宽度流式换行不拉伸。
 * 系统管理各列表页的查询工具栏共用，保证筛选区风格一致；
 * htmlFor 用于把标题关联到控件，生成可访问名。
 */
export function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex w-64 flex-col gap-1.5', className)}>
      <Label
        htmlFor={htmlFor}
        className="text-[13px] font-normal text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  )
}
