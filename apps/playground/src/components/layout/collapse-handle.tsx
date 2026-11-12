import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app'

/** 边框收起/展开手柄：吸附在栏右边框上的半椭圆凸起，悬停栏时浮现 */
export function CollapseHandle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  /** 缺省切换全局 collapsed（完整侧边栏 / 混合二级栏），双栏 / 分栏第二栏传 toggleSecondCollapsed */
  onToggle?: () => void
}) {
  const toggleCollapsed = useAppStore((s) => s.toggleCollapsed)
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onToggle ?? toggleCollapsed}
      aria-label={collapsed ? t('header.expandMenu') : t('header.collapseMenu')}
      title={collapsed ? t('header.expandMenu') : t('header.collapseMenu')}
      className={cn(
        'group absolute top-1/2 left-full z-10 h-22 w-3.5 -translate-y-1/2 cursor-pointer text-sidebar-foreground outline-none',
        'opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 focus-visible:opacity-100',
      )}
    >
      <svg
        width="14"
        height="88"
        viewBox="0 0 14 88"
        fill="none"
        aria-hidden
        className="absolute inset-0"
      >
        <path
          d="M 0 0 L 0 10
            C 0 17, 13.5 22, 13.5 29
            L 13.5 59
            C 13.5 66, 0 71, 0 78
            L 0 88 Z"
          className="fill-sidebar stroke-sidebar-border"
        />
      </svg>
      <ChevronLeft
        className={cn(
          'absolute top-1/2 left-1.75 size-4 -translate-x-1/2 -translate-y-1/2 transition-colors duration-200 group-hover:text-primary',
          'text-sidebar-foreground/60',
          collapsed && 'rotate-180',
        )}
      />
    </button>
  )
}
