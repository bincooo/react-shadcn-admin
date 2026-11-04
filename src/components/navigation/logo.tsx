/**
 * 品牌标识：纯内联 SVG，跟随主色变量，不依赖外部图片资源。
 *
 * `navigation/` 放的是「点击后改变你在应用中的位置」的组件；目前只有品牌标识
 * （点击回首页），后续若有面包屑、返回按钮等也归这里。
 */
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Box } from 'lucide-react'
import { cn } from '@/lib/utils'
/** 品牌标识：纯内联 SVG，跟随主色变量，不依赖外部图片资源 */
export function Logo({ collapsed }: { collapsed?: boolean }) {
  const { t } = useTranslation()
  return (
    <Link
      to="/dashboard"
      aria-label={t('app.name')}
      className={cn(
        'group flex min-w-0 items-center gap-2.5 rounded-md text-sidebar-foreground outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        // 收起时仅剩图标，去掉内边距以便在窄栏中精确居中
        collapsed ? 'justify-center px-0' : 'px-1',
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-colors group-hover:bg-primary/90">
        <Box className="size-5" strokeWidth={2} />
      </span>

      {!collapsed && (
        <span className="flex min-w-0 flex-col leading-none">
          {/* 名称与版本号同一行，版本号作为弱化的角标跟在后面 */}
          <span className="flex items-baseline gap-1.5">
            <span className="truncate text-[15px] font-semibold tracking-tight">
              {t('app.name')}
            </span>
            <span className="shrink-0 text-[10px] font-normal tracking-wide text-sidebar-foreground/45 tabular-nums">
              {t('app.version')}
            </span>
          </span>
          <span className="mt-1 truncate text-[10.5px] font-normal text-sidebar-foreground/55">
            {t('app.slogan')}
          </span>
        </span>
      )}
    </Link>
  )
}
