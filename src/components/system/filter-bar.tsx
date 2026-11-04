import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * 列表页查询工具栏：字段在左流式换行，重置/查询按钮锚在最后一行右端。
 * 各页面只在 children 中提供自己的字段。
 */
export function FilterBar({
  children,
  onReset,
  onSearch,
  extra,
}: {
  children: ReactNode
  onReset: () => void
  onSearch: () => void
  /** 查询按钮后的额外操作，如展开/收起筛选项 */
  extra?: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <Card role="search" aria-label={t('common.search')}>
      <CardContent className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {children}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onReset}>
            {t('common.reset')}
          </Button>
          <Button onClick={onSearch}>{t('common.search')}</Button>
          {extra}
        </div>
      </CardContent>
    </Card>
  )
}
