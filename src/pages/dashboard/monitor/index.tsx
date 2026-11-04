import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Cpu,
  Database,
  MemoryStick,
  Server,
  ShieldCheck,
  Wifi,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Chart } from '@/components/charts/chart'
import { SectionCard } from '@/components/common/section-card'
import { fetchMonitor } from '@/api/monitor'
import { cn } from '@/lib/utils'
import { useResolvedMode } from '@/lib/theme/theme-runtime'
import { chartTheme, useThemeStore } from '@/store/theme'
import {
  buildCpuOption,
  buildHealthOption,
  buildNetworkOption,
} from './modules/chart-options'

/** 概览卡图标按接口返回顺序映射 */
const SUMMARY_ICONS = [Server, Database, Cpu, MemoryStick]

/** 无数据时复用同一数组，避免每次渲染都产生新引用 */
const EMPTY_TIMES: string[] = []

/** 监控大盘：概览卡 + CPU / 网络 / 健康度图表 + 节点资源 */
export default function Monitor() {
  const { t } = useTranslation()
  const { data } = useQuery({ queryKey: ['monitor'], queryFn: fetchMonitor })
  const resolvedMode = useResolvedMode()
  const primaryColor = useThemeStore((s) => s.primaryColor)

  // chartTheme 按模式返回同一份对象，不需要再包 useMemo
  const theme = chartTheme(resolvedMode)
  const times = data?.times ?? EMPTY_TIMES
  const nodes = data?.nodes ?? []

  const cpuOption = useMemo(
    () => buildCpuOption(times, data?.cpu ?? [], theme, primaryColor),
    [times, data?.cpu, theme, primaryColor],
  )

  const networkOption = useMemo(
    () =>
      buildNetworkOption(
        times,
        data?.network ?? { inbound: [], outbound: [] },
        theme,
        { inbound: t('page.inbound'), outbound: t('page.outbound') },
      ),
    [times, data?.network, theme, t],
  )

  const healthOption = useMemo(
    () => buildHealthOption(data?.health ?? 0, resolvedMode, primaryColor),
    [data?.health, resolvedMode, primaryColor],
  )

  const summary = (data?.summary ?? []).map((item, i) => ({
    ...item,
    icon: SUMMARY_ICONS[i] ?? Server,
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label} className="py-4">
            <CardContent className="flex items-center gap-3 px-4">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="size-4" />
              </span>
              <div>
                <p className="text-[11.5px] text-muted-foreground">
                  {t(item.label)}
                </p>
                <p className="text-[17px] font-semibold tabular-nums">
                  {item.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title={t('page.cpuUsage')}
          description={t('page.cpuUsageDesc')}
        >
          <Chart
            option={cpuOption}
            height={220}
            ariaLabel={t('page.cpuUsage')}
          />
        </SectionCard>
        <SectionCard
          title={t('page.network')}
          description={t('page.networkDesc')}
        >
          <Chart
            option={networkOption}
            height={220}
            ariaLabel={t('page.network')}
          />
        </SectionCard>
        <SectionCard
          title={t('page.health')}
          description={t('page.healthDesc')}
          actions={<ShieldCheck className="size-4 text-success" />}
        >
          <Chart
            option={healthOption}
            height={220}
            ariaLabel={t('page.health')}
          />
        </SectionCard>
      </div>

      <SectionCard
        contentClassName="grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3"
        title={t('page.nodeStatus')}
        description={t('page.nodeStatusDesc')}
      >
        {nodes.map((node) => (
          <div key={node.name} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Wifi className="size-3.5 text-muted-foreground" />
              <span className="font-mono text-[12px] font-medium">
                {node.name}
              </span>
              <span className="text-[10.5px] text-muted-foreground">
                {node.region}
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'ml-auto text-[10px]',
                  node.alerting
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success',
                )}
              >
                {node.alerting ? t('page.alerting') : t('page.running')}
              </Badge>
            </div>
            <ResourceProgress label="CPU" value={node.cpu} />
            <ResourceProgress label="MEM" value={node.mem} />
          </div>
        ))}
      </SectionCard>
    </div>
  )
}

function ResourceProgress({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}%</span>
      </div>
      <Progress
        value={value}
        aria-label={label}
        className={cn(
          'h-1',
          value > 85
            ? '[&_[data-slot=progress-indicator]]:bg-danger'
            : value > 70 && '[&_[data-slot=progress-indicator]]:bg-warning',
        )}
      />
    </div>
  )
}
