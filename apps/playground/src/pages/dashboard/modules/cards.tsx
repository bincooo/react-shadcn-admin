import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import CountUp from 'react-countup'
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingCart,
  Wallet,
  Activity,
} from 'lucide-react'
import { Card, CardContent } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'
import { Separator } from '@repo/ui/components/separator'
import { UserAvatar } from '@/components/common/user-avatar'
import type { DashboardData, StatItem } from './data'
import { cn } from '@/lib/utils'

/** 统计卡的图标与配色由前端按 key 映射（接口只给数值与文案 key） */
const STAT_ICONS = {
  revenue: Wallet,
  users: Users,
  orders: ShoppingCart,
  active: Activity,
} as const

export function StatCard({ stat }: { stat: StatItem }) {
  const { t } = useTranslation()
  const Icon = STAT_ICONS[stat.key as keyof typeof STAT_ICONS]
  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex items-start justify-between px-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] text-muted-foreground">
            {t(stat.label)}
          </span>
          <span className="text-[24px] leading-none font-semibold tracking-tight tabular-nums">
            <CountUp
              end={stat.value}
              decimals={stat.suffix === '%' ? 1 : 0}
              prefix={stat.prefix ?? ''}
              suffix={stat.suffix ?? ''}
              separator=","
              duration={1.2}
            />
          </span>
          <span
            className={cn(
              'flex items-center gap-1 text-[11.5px] font-medium',
              stat.up ? 'text-success' : 'text-danger',
            )}
          >
            {stat.up ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(stat.delta)}%
            <span className="font-normal text-muted-foreground">
              {t('page.vsLastWeek')}
            </span>
          </span>
        </div>
        <span
          className={cn(
            'grid size-9 place-items-center rounded-xl',
            stat.tone === 'primary'
              ? 'bg-primary/10 text-primary'
              : stat.tone === 'success'
                ? 'bg-success/10 text-success'
                : stat.tone === 'warning'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-info/10 text-info',
          )}
        >
          {Icon ? <Icon className="size-4" /> : null}
        </span>
      </CardContent>
    </Card>
  )
}

export function RecentOrders({
  orders,
}: {
  orders: DashboardData['recentOrders']
}) {
  const { t } = useTranslation()
  return (
    <>
      {orders.map((order, i) => (
        <div key={order.name}>
          {i > 0 && <Separator className="my-1.5" />}
          <div className="flex items-center gap-3 py-1">
            <UserAvatar name={order.name} />
            <span className="min-w-0 flex-1 truncate text-[13px]">
              {order.name}
            </span>
            <span className="text-[13px] font-medium tabular-nums">
              ¥{order.amount.toLocaleString()}
            </span>
            <Badge
              variant={order.variant === 'secondary' ? 'outline' : 'secondary'}
              className={cn(
                'min-w-14 justify-center text-[11px]',
                order.variant === 'success'
                  ? 'bg-success/10 text-success'
                  : order.variant === 'warning'
                    ? 'bg-warning/10 text-warning'
                    : '',
              )}
            >
              {t(order.statusKey)}
            </Badge>
          </div>
        </div>
      ))}
    </>
  )
}

export function QuickLinks({ links }: { links: DashboardData['quickLinks'] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <>
      {links.map((entry) => (
        <button
          key={entry.path}
          type="button"
          onClick={() => navigate(entry.path)}
          className="flex h-16 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-[12.5px] transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          {t(entry.label)}
        </button>
      ))}
    </>
  )
}
