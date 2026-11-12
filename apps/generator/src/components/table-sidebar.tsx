import { useMemo, useState } from 'react'
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DatabaseIcon,
  FileJson2Icon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import type { TableSummary } from '@/types'
import { TextInput } from '@/components/ui'
import { cn } from '@repo/ui/lib/utils'

/** 侧栏每页展示的表定义数量 */
const PAGE_SIZE = 20

export function TableSidebar({
  tables,
  errors,
  selectedName,
  query,
  loading,
  onQueryChange,
  onSelect,
  onNew,
}: {
  tables: TableSummary[]
  errors: { name: string; error: string }[]
  selectedName: string | null
  query: string
  loading: boolean
  onQueryChange: (value: string) => void
  onSelect: (table: TableSummary) => void
  onNew: () => void
}) {
  const normalized = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!normalized) return tables
    return tables.filter(
      (table) =>
        table.name.includes(normalized) ||
        table.entityName.toLowerCase().includes(normalized) ||
        table.displayName.toLowerCase().includes(normalized),
    )
  }, [tables, normalized])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  // 页码与筛选条件绑定：筛选变化时自然回到第一页，数据量缩小时夹回有效范围
  const [pagination, setPagination] = useState({ query: normalized, page: 1 })
  const currentPage = Math.min(
    pagination.query === normalized ? pagination.page : 1,
    totalPages,
  )
  const setPage = (next: number) =>
    setPagination({
      query: normalized,
      page: Math.min(Math.max(1, next), totalPages),
    })

  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <aside className="flex max-h-44 w-full shrink-0 flex-col border-b border-border bg-card/60 md:max-h-none md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-1.5 px-2 pt-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <DatabaseIcon className="size-3" />
          表定义
          <span className="bg-muted px-1 py-0 text-[10px]">
            {tables.length}
          </span>
        </div>
        <Button size="xs" variant="outline" onClick={onNew}>
          <PlusIcon data-icon="inline-start" />
          新建
        </Button>
      </div>

      <div className="relative px-2 py-1.5">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-3 -translate-y-1/2 text-muted-foreground" />
        <TextInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="搜索表名 / 实体"
          className="h-7 pl-6 text-[11px]"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {loading ? (
          <p className="px-2 py-3 text-[11px] text-muted-foreground">加载中…</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-3 text-[11px] text-muted-foreground">
            {tables.length === 0
              ? '暂无表定义，点击「新建」开始设计。'
              : '没有匹配的表。'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {visible.map((table) => {
              const active = table.name === selectedName
              return (
                <li key={table.name}>
                  <button
                    type="button"
                    onClick={() => onSelect(table)}
                    className={cn(
                      'w-full border px-2 py-1.5 text-left transition-colors',
                      active
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-transparent hover:bg-muted/70',
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate text-[12px] font-medium">
                        {table.displayName}
                      </span>
                      <span className="shrink-0 bg-muted px-1 py-0 font-mono text-[9px] text-muted-foreground">
                        {table.entityName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                      <span className="truncate">{table.name}</span>
                      <span className="shrink-0">{table.columns} 列</span>
                      {table.details > 0 ? (
                        <span className="shrink-0">{table.details} 明细</span>
                      ) : null}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {errors.length > 0 ? (
          <div className="mt-2 border border-amber-500/30 bg-amber-500/5 p-1.5">
            <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangleIcon className="size-3" />
              读取异常
            </div>
            {errors.map((error) => (
              <p
                key={error.name}
                className="mt-0.5 text-[10px] text-muted-foreground"
              >
                <span className="font-mono">{error.name}</span>：{error.error}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-1 border-t border-border px-1.5 py-1 text-[10px] text-muted-foreground">
          <span className="tabular-nums">{filtered.length} 条</span>
          <div className="flex items-center gap-0.5">
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="上一页"
              title="上一页"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-9 text-center tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="下一页"
              title="下一页"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="hidden border-t border-border px-2 py-1.5 text-[10px] text-muted-foreground md:block">
        <div className="flex items-center gap-1">
          <FileJson2Icon className="size-3" />
          持久化到 data/[table].jsonl
        </div>
      </div>
    </aside>
  )
}
