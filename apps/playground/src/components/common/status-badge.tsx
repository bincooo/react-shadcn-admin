import { Badge } from '@repo/ui/components/badge'
import { cn } from '@/lib/utils'

/** 启用状态徽标：启用为绿色次要色，停用为描边 */
export function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge
      variant={enabled ? 'secondary' : 'outline'}
      className={cn('text-[11px]', enabled && 'bg-success/10 text-success')}
    >
      {enabled ? '启用' : '停用'}
    </Badge>
  )
}
