import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DetailRowProps {
  /** 左侧标题 */
  title: string
  /** 标题下方的补充说明 */
  description?: string
  /** 标题列宽度（详情页更宽，组件示例更窄） */
  labelWidth?: string
  className?: string
  children: ReactNode
}

/**
 * 左右分栏的详情行：左侧标题（可带描述），右侧内容。
 * 列宽通过 CSS 变量传入，避免为两种宽度各写一套网格类。
 */
export function DetailRow({
  title,
  description,
  labelWidth = '200px',
  className,
  children,
}: DetailRowProps) {
  return (
    <div
      className={cn(
        'grid gap-3 md:grid-cols-(--detail-label) md:items-start',
        className,
      )}
      style={{ '--detail-label': labelWidth } as CSSProperties}
    >
      <div>
        <p className="text-[13px] font-medium">{title}</p>
        {description && (
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
