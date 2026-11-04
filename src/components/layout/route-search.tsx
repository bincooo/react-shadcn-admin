import { useTranslation } from 'react-i18next'
import { ArrowRight, CornerDownLeft, Search, SearchX } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app'
import { useRouteSearchSync } from './use-route-search-sync'
import type { RouteSearchEntry } from './route-search-index'

/** 底部快捷键提示的键帽样式 */
const KBD =
  'inline-flex min-h-5 min-w-5 items-center justify-center rounded border border-border bg-background px-1 font-mono text-[10px] font-medium text-muted-foreground shadow-xs'

function SearchResultRow({
  entry,
  index,
  active,
  listId,
  onHover,
  onSelect,
}: {
  entry: RouteSearchEntry
  index: number
  active: boolean
  listId: string
  onHover: () => void
  onSelect: () => void
}) {
  return (
    <button
      id={`${listId}-${index}`}
      data-index={index}
      type="button"
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-3 rounded-sm px-3 py-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        active ? 'bg-primary/8 text-foreground' : 'hover:bg-muted/60',
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors',
          active && 'bg-primary/10 text-primary',
        )}
      >
        <entry.route.icon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">
          {entry.label}
        </span>
        {entry.group && (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {entry.group}
          </span>
        )}
      </span>
      {active && <ArrowRight className="size-4 shrink-0 text-primary" />}
    </button>
  )
}

function SearchEmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <SearchX className="size-5" />
      </div>
      <p className="text-[13px] font-medium">{t('header.searchEmpty')}</p>
      <p className="text-xs text-muted-foreground">
        {t('header.searchEmptyHint')}
      </p>
    </div>
  )
}

function SearchFooter() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t bg-muted/30 px-5 py-3 text-[11px] text-muted-foreground sm:px-6">
      <span className="flex items-center gap-1.5">
        <kbd className={KBD}>↑</kbd>
        <kbd className={KBD}>↓</kbd>
        {t('header.switch')}
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className={KBD}>
          <CornerDownLeft className="size-3" />
        </kbd>
        {t('header.open')}
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className={KBD}>esc</kbd>
        {t('common.close')}
      </span>
    </div>
  )
}

/** 全局页面搜索：支持标题中文、英文翻译及全拼/首字母匹配。 */
export function RouteSearchDialog() {
  const { t } = useTranslation()
  const open = useAppStore((s) => s.searchOpen)
  const setOpen = useAppStore((s) => s.setSearchOpen)
  const {
    listId,
    listRef,
    queryState,
    results,
    activeIndex,
    setActiveIndex,
    updateQuery,
    handleOpenChange,
    moveActive,
    select,
  } = useRouteSearchSync(open, setOpen)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[min(18%,8rem)] max-h-[calc(100dvh-2rem)] translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-lg"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t('common.search')}</DialogTitle>
          <DialogDescription>{t('header.searchPlaceholder')}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 border-b px-5 sm:px-6">
          <Search className="size-5 shrink-0 text-primary" />
          <input
            autoFocus
            role="combobox"
            aria-label={t('common.search')}
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
            }
            aria-autocomplete="list"
            value={queryState}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                moveActive(1)
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                moveActive(-1)
              } else if (event.key === 'Enter') {
                event.preventDefault()
                select(activeIndex)
              }
            }}
            placeholder={t('header.searchPlaceholder')}
            className="h-17 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <DialogClose asChild>
            <button
              type="button"
              aria-label={t('common.close')}
              className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              ESC
            </button>
          </DialogClose>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-2 sm:px-6">
            <span className="text-xs font-semibold text-muted-foreground">
              {queryState.trim() ? t('header.searchResults') : t('header.menu')}
            </span>
            <span className="text-xs text-muted-foreground/70">
              {t('header.searchCount', { count: results.length })}
            </span>
          </div>
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={t('header.searchResults')}
            className="max-h-[min(20rem,calc(100dvh-16rem))] min-h-0 overflow-y-auto px-2 pb-3 sm:px-3"
          >
            {results.length === 0 ? (
              <SearchEmptyState />
            ) : (
              results.map((entry, index) => {
                const active = index === activeIndex
                return (
                  <SearchResultRow
                    key={entry.route.path}
                    entry={entry}
                    index={index}
                    active={active}
                    listId={listId}
                    onHover={() => setActiveIndex(index)}
                    onSelect={() => select(index)}
                  />
                )
              })
            )}
          </div>
        </div>

        <SearchFooter />
      </DialogContent>
    </Dialog>
  )
}
