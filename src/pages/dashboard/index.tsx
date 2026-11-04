import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Chart } from '@/components/charts/chart'
import { SectionCard } from '@/components/common/section-card'
import { fetchDashboard } from '@/api/dashboard'
import { useResolvedMode } from '@/lib/theme/theme-runtime'
import { chartTheme, useThemeStore } from '@/store/theme'
import { buildSourceOption, buildTrafficOption } from './modules/chart-options'
import { QuickLinks, RecentOrders, StatCard } from './modules/dashboard-cards'

/** 月份序列 → 图表类目文案：中文带「月」，其他语言补零 */
function formatMonthLabels(months: number[], language: string): string[] {
  const useChinese = language.startsWith('zh')
  return months.map((month) =>
    useChinese ? `${month}月` : String(month).padStart(2, '0'),
  )
}

/** 工作台：指标卡 + 趋势图 + 来源环图 + 最近订单 + 快捷入口 */
export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  })
  const resolvedMode = useResolvedMode()
  const primaryColor = useThemeStore((s) => s.primaryColor)

  const stats = data?.stats ?? []
  const monthLabels = useMemo(
    () => formatMonthLabels(data?.traffic.months ?? [], i18n.language),
    [data?.traffic.months, i18n.language],
  )

  // chartTheme 按模式返回同一份对象，不需要再包 useMemo
  const theme = chartTheme(resolvedMode)

  const trafficOption = useMemo(
    () =>
      buildTrafficOption(
        data?.traffic ?? { months: [], visits: [], orders: [] },
        monthLabels,
        theme,
        primaryColor,
        { visits: t('page.visits'), orders: t('page.orderVolume') },
      ),
    [data?.traffic, monthLabels, theme, primaryColor, t],
  )

  const sourceOption = useMemo(
    () =>
      buildSourceOption(
        (data?.sources ?? []).map((source) => ({
          value: source.value,
          name: t(source.nameKey),
        })),
        theme,
        primaryColor,
      ),
    [data?.sources, theme, primaryColor, t],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          contentClassName="pl-1"
          title={t('page.trafficTrend')}
          description={t('page.trafficTrendDesc')}
          actions={<Badge variant="secondary">{t('page.thisYear')}</Badge>}
        >
          <Chart
            option={trafficOption}
            height={300}
            ariaLabel={t('page.trafficTrend')}
          />
        </SectionCard>

        <SectionCard
          title={t('page.trafficSource')}
          description={t('page.trafficSourceDesc')}
        >
          <Chart
            option={sourceOption}
            height={300}
            ariaLabel={t('page.trafficSource')}
          />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          contentClassName="flex flex-col gap-1"
          title={t('page.recentOrders')}
          description={t('page.recentOrdersDesc')}
          actions={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('common.actions')}
            >
              <MoreHorizontal />
            </Button>
          }
        >
          <RecentOrders orders={data?.recentOrders ?? []} />
        </SectionCard>

        <SectionCard
          contentClassName="grid grid-cols-2 gap-2"
          title={t('page.quickLinks')}
          description={t('page.quickLinksDesc')}
        >
          <QuickLinks links={data?.quickLinks ?? []} />
        </SectionCard>
      </div>
    </div>
  )
}
