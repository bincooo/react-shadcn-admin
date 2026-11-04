import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * 计算要渲染的页码序列：首尾页 + 当前页前后各一页，中间空缺用 `'gap'` 折叠成省略号。
 * 这样总页数再多，页码按钮数量也固定在 7 个左右。
 */
function getPageItems(page: number, totalPages: number): (number | 'gap')[] {
  const pageItems: (number | 'gap')[] = []
  for (let pageNo = 1; pageNo <= totalPages; pageNo++) {
    const nearCurrent = Math.abs(pageNo - page) <= 1
    if (pageNo === 1 || pageNo === totalPages || nearCurrent) {
      pageItems.push(pageNo)
    } else if (pageItems.at(-1) !== 'gap') {
      // 只在连续空缺出现时插入一个省略号，避免出现「… …」
      pageItems.push('gap')
    }
  }
  return pageItems
}

export interface PaginationProps {
  /** 当前页码（从 1 开始），受控 */
  page: number
  /** 总页数（至少为 1） */
  totalPages: number
  /** 翻页回调；组件不负责「改筛选后回到第一页」这类页面级规则 */
  onPageChange: (page: number) => void
  /** 传入则渲染左侧「每页条数」选择器，切换时回调新条数 */
  pageSize?: number
  /** 每页条数的候选项，需与 `pageSize` 搭配使用 */
  pageSizeOptions?: number[]
  /** 每页条数变化回调 */
  onPageSizeChange?: (pageSize: number) => void
  /** 自定义容器类名（例如去掉顶部分隔线） */
  className?: string
}

/**
 * 通用分页条：左侧「第 x / y 页」+ 每页条数选择，右侧页码导航。
 *
 * 纯受控组件：页码与条数状态都由调用方持有，这里只负责展示与回传，
 * 不感知任何业务（筛选、排序、请求）。列表页把它渲染在表格卡片底部，
 * 页码与条数直接映射到表格的 `pagination` 状态。
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions = [],
  onPageSizeChange,
  className,
}: PaginationProps) {
  const { t } = useTranslation()
  const hasSizeSelect = pageSize !== undefined && onPageSizeChange !== undefined

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-4 py-3',
        className,
      )}
    >
      <div className="flex items-center gap-3 text-[12px] whitespace-nowrap text-muted-foreground">
        <span>{t('page.pageOf', { page, total: totalPages })}</span>
        {hasSizeSelect && (
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger size="sm" aria-label={t('page.pageSizeLabel')}>
              <SelectValue>
                {t('page.pageSize', { size: pageSize })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {pageSizeOptions.map((sizeOption) => (
                  <SelectItem key={sizeOption} value={String(sizeOption)}>
                    {t('page.pageSize', { size: sizeOption })}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>

      <nav className="flex items-center gap-1" aria-label="pagination">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('common.prev')}
        </Button>

        {getPageItems(page, totalPages).map((pageItem, index) =>
          pageItem === 'gap' ? (
            <span
              key={`gap-${index}`}
              className="px-1 text-[12px] text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={pageItem}
              variant={pageItem === page ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onPageChange(pageItem)}
              // 当前页已是高亮态，再点击没有意义，直接禁用指针事件
              className={cn(
                'min-w-8',
                pageItem === page && 'pointer-events-none',
              )}
            >
              {pageItem}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('common.next')}
        </Button>
      </nav>
    </div>
  )
}
