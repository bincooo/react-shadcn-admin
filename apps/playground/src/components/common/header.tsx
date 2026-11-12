/**
 * 页面内的通用页头：标题 + 描述 + 右侧操作区。
 *
 * 与 `common/` 里的其它成员一样，这里放的是「任何功能域都可能用到、
 * 但不属于某个具体业务」的展示组件：页头、分页条、卡片分区、详情行、
 * 整页加载占位、用户头像。判断标准是「换一个业务域还成立」。
 *
 * 注意与应用外壳的 `layout/header.tsx` 区分：那个是固定在顶部的全局栏
 * （面包屑、主题、语言、用户菜单），这个只是页面内容区的第一行。
 */
import type { ReactNode } from 'react'
import { Spinner } from '@repo/ui/components/spinner'
import { cn } from '@/lib/utils'

/** 整页加载占位：懒加载 chunk 期间显示，保持背景色避免白屏 */
export function FullPageLoader() {
  return (
    <div className="grid h-dvh place-items-center bg-background text-muted-foreground">
      <Spinner className="size-6" />
    </div>
  )
}

interface HeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

/** 页面内容区的页头：标题在左，操作区在右，窄屏自动换行。 */
export function Header({
  title,
  description,
  actions,
  className,
}: HeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-3',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-[19px] leading-tight font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
