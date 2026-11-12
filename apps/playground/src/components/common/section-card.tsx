import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: ReactNode
  description?: ReactNode
  /** 卡头右侧的操作区（按钮 / 徽标等） */
  actions?: ReactNode
  contentClassName?: string
  className?: string
  children: ReactNode
}

/** 页面内标准卡片区块：标题 + 描述 + 内容 */
export function SectionCard({
  title,
  description,
  actions,
  contentClassName,
  className,
  children,
}: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader
        className={cn(actions && 'flex flex-row items-start justify-between')}
      >
        <div>
          <CardTitle className="text-[14px]">{title}</CardTitle>
          {description && (
            <CardDescription className="text-[13px]">
              {description}
            </CardDescription>
          )}
        </div>
        {actions}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}
