import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { findRouteEntry } from '@/router/modules'
/** 顶栏面包屑：路径来自当前路由的 handle 元数据，末级不可点击 */
export function Breadcrumb() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const breadcrumbKeys = findRouteEntry(pathname)?.breadcrumbKeys ?? []

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm">
      {breadcrumbKeys.length === 0 ? (
        <span className="font-medium text-muted-foreground">404</span>
      ) : (
        breadcrumbKeys.map((key, index) => (
          <span
            key={`${key}-${index}`}
            className="flex min-w-0 items-center gap-1.5"
          >
            {index > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
            )}
            <span
              className={
                index === breadcrumbKeys.length - 1
                  ? 'truncate font-medium text-foreground'
                  : 'truncate text-muted-foreground'
              }
            >
              {t(key)}
            </span>
          </span>
        ))
      )}
    </nav>
  )
}
