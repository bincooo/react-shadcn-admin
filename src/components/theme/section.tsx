import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionProps {
  icon: LucideIcon
  title: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

/**
 * 主题面板的区块：圆角图标徽标 + 标题 + 下划线强调。
 */
export function Section({
  icon: Icon,
  title,
  children,
  className,
  action,
}: SectionProps) {
  return (
    <section className={cn('flex flex-col gap-3.5', className)}>
      <header className="flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-3.5" />
        </span>
        <h3 className="relative text-[13px] font-semibold tracking-wide text-foreground">
          {title}
          <span className="absolute -bottom-2 left-0 h-0.75 w-8 rounded-full bg-primary/70" />
        </h3>
        {action ? <div className="ml-auto">{action}</div> : null}
      </header>
      <div className="pt-1">{children}</div>
    </section>
  )
}
