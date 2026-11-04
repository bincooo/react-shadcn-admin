import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/** 启用状态徽标：启用为绿色次要色，停用为描边 */
export function EnabledStatusBadge({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation()

  return (
    <Badge
      variant={enabled ? 'secondary' : 'outline'}
      className={cn('text-[11px]', enabled && 'bg-success/10 text-success')}
    >
      {enabled ? t('common.enabled') : t('common.disabled')}
    </Badge>
  )
}

const MENU_WIDTH_CLASS = {
  sm: 'w-24',
  md: 'w-28',
  lg: 'w-32',
} as const

/** 行操作下拉入口：各表格只提供菜单项，触发器与对齐方式共用 */
export function RowActionMenu({
  width = 'md',
  children,
}: {
  width?: keyof typeof MENU_WIDTH_CLASS
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={t('common.actions')}>
          <SlidersHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={MENU_WIDTH_CLASS[width]}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** 多选胶囊中的批量删除按钮：数量与禁用条件由调用方给出 */
export function BatchDeleteAction({
  count,
  onClick,
  disabled,
}: {
  count: number
  onClick: () => void
  disabled?: boolean
}) {
  const { t } = useTranslation()

  return (
    <Button
      variant="destructive"
      className="rounded-full"
      size="sm"
      disabled={disabled}
      onClick={onClick}
    >
      <Trash2 data-icon="inline-start" />
      {t('common.deleteMany', { count })}
    </Button>
  )
}
