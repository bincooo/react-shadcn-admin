import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/common/toaster'
import { TableLocaleProvider } from '@repo/table'
import { queryClient } from '@/lib/query-client'
import { useAppTableLocale } from '@/lib/table-locale'
import { AppRoutes } from '@/router'

/** 顶层错误兜底：渲染期异常时不整页白屏 */
function AppErrorFallback() {
  const { t } = useTranslation()
  return (
    <div className="grid h-dvh place-items-center bg-background">
      <p className="text-sm text-muted-foreground">{t('app.error')}</p>
    </div>
  )
}

export default function App() {
  const tableLocale = useAppTableLocale()

  return (
    <ErrorBoundary fallback={<AppErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <TableLocaleProvider value={tableLocale}>
          <AppRoutes />
        </TableLocaleProvider>
        {/* 全局提示：toast() 需要挂载 Toaster 才会渲染 */}
        <Toaster position="top-center" />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
