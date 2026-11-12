import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { Field, FieldLabel } from '@repo/ui/components/field'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { cn } from '@/lib/utils'

/** 列表搜索面板的启用状态筛选值：`all` 表示不过滤 */
export type SearchStatus = 'all' | 'enabled' | 'disabled'

const SEARCH_STATUSES: SearchStatus[] = ['all', 'enabled', 'disabled']

const SEARCH_STATUS_LABELS: Record<SearchStatus, string> = {
  all: '全部状态',
  enabled: '启用',
  disabled: '停用',
}

/**
 * 搜索面板中的单个字段容器：统一标签、间距与默认宽度。
 * 控件本身仍由调用方提供，便于文本框 / 下拉框 / 自定义控件复用。
 */
export function SearchPanelField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor: string
  children: ReactNode
  className?: string
}) {
  return (
    <Field className={cn('w-64 gap-1.5', className)}>
      <FieldLabel
        htmlFor={htmlFor}
        className="text-[13px] font-normal text-muted-foreground"
      >
        {label}
      </FieldLabel>
      {children}
    </Field>
  )
}

/**
 * 搜索文本框：统一「输入 → 回车提交」行为。
 *
 * - 有 `label` 时自动包一层 `SearchPanelField` 并关联标签；
 * - 无 `label` 时只渲染输入框，供弹窗里的紧凑工具栏使用；
 * - 中文输入法组词期间的 Enter 不会误触搜索。
 */
export function SearchTextField({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  onSearch,
  placeholder,
  className = 'w-full',
  autoComplete,
}: {
  id?: string
  label?: string
  ariaLabel?: string
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  placeholder?: string
  className?: string
  autoComplete?: string
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  const input = (
    <Input
      id={inputId}
      className={className}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      aria-label={label ? undefined : ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault()
          onSearch()
        }
      }}
    />
  )

  if (!label) return input
  return (
    <SearchPanelField label={label} htmlFor={inputId}>
      {input}
    </SearchPanelField>
  )
}

/** 搜索面板的启用状态下拉（全部 / 启用 / 停用） */
export function SearchStatusField({
  id,
  value,
  onChange,
}: {
  id: string
  value: SearchStatus
  onChange: (value: SearchStatus) => void
}) {
  return (
    <SearchPanelField label="状态" htmlFor={id}>
      <Select
        value={value}
        items={SEARCH_STATUSES.map((status) => ({
          value: status,
          label: SEARCH_STATUS_LABELS[status],
        }))}
        onValueChange={(next) => onChange(next as SearchStatus)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SEARCH_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {SEARCH_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SearchPanelField>
  )
}

/**
 * 列表页搜索面板。
 *
 * 字段在左流式换行，重置 / 搜索按钮固定在最后一行右端；`primary` 是收起时
 * 仍保留的主字段（通常是关键词），`children` 是可收起的高级筛选项。
 */
export function SearchPanel({
  primary,
  children,
  onReset,
  onSearch,
  collapsible = false,
  defaultCollapsed = false,
}: {
  /** 常驻主字段：`collapsible` 收起时仍显示 */
  primary?: ReactNode
  /** 可收起的高级筛选字段 */
  children?: ReactNode
  onReset: () => void
  onSearch: () => void
  /** 是否提供展开 / 收起能力 */
  collapsible?: boolean
  /** 初始是否处于收起状态（仅 `collapsible` 时生效） */
  defaultCollapsed?: boolean
}) {
  const [collapsedState, setCollapsedState] = useState(defaultCollapsed)
  const detailsId = useId()

  return (
    <Card role="search" aria-label="搜索">
      <CardContent className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {primary}
        {!collapsedState && (
          <div id={detailsId} className="contents">
            {children}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw data-icon="inline-start" />
            重置
          </Button>
          <Button onClick={onSearch}>
            <Search data-icon="inline-start" />
            搜索
          </Button>
          {collapsible && (
            <Button
              variant="ghost"
              className="text-primary"
              aria-expanded={!collapsedState}
              aria-controls={collapsedState ? undefined : detailsId}
              onClick={() => setCollapsedState((prev) => !prev)}
            >
              {collapsedState ? (
                <>
                  <ChevronDown data-icon="inline-start" />
                  展开
                </>
              ) : (
                <>
                  <ChevronUp data-icon="inline-start" />
                  收起
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
