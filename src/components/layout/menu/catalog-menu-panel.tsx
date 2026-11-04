import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronRight, LayoutGrid, Search } from 'lucide-react'
import { Icon } from '@/components/common/icon'
import { cn } from '@/lib/utils'
import { containsMenuPath, type MenuNode } from './menu-model'
import { useCloseFloatingMenu } from './floating-menu-context'

interface MenuSection {
  titleKey: string
  items: MenuNode[]
}

function collectLeafItems(items: MenuNode[]): MenuNode[] {
  return items.flatMap((item) =>
    item.children?.length ? collectLeafItems(item.children) : [item],
  )
}

function buildSections(items: MenuNode[]): MenuSection[] {
  const directItems = items.filter((item) => !item.children?.length)
  const groups = items.filter((item) => item.children?.length)
  const sections = groups.map((group) => ({
    titleKey: group.label,
    items: collectLeafItems(group.children ?? []),
  }))

  if (directItems.length) {
    sections.unshift({ titleKey: 'menu.quickAccess', items: directItems })
  }

  return sections
}

/** Category rail + shortcut tiles for wide floating menus. */
export function CatalogMenuPanel({
  items,
  titleKey,
}: {
  items: MenuNode[]
  titleKey?: string
}) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [activeCategoryState, setActiveCategory] = useState('')
  const [searchState, setSearch] = useState('')

  const categories = items.filter((item) => item.children?.length)
  const activeCategory =
    categories.find((item) => item.key === activeCategoryState) ??
    categories.find((item) => containsMenuPath(item, pathname)) ??
    categories[0]
  const query = searchState.trim().toLocaleLowerCase()
  const searchResults = query
    ? collectLeafItems(items).filter((item) =>
        t(item.label).toLocaleLowerCase().includes(query),
      )
    : []
  const directItems = items.filter((item) => !item.children?.length)
  const sections = [
    ...(directItems.length
      ? [{ titleKey: 'menu.quickAccess', items: directItems }]
      : []),
    ...buildSections(activeCategory?.children ?? []),
  ].filter((section) => section.items.length)

  return (
    <div className="flex h-115 max-h-[calc(100dvh-8rem)] w-175 max-w-[calc(100vw-2rem)] overflow-hidden rounded-sm border border-border/70 bg-popover text-popover-foreground shadow-lg">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 items-center gap-2.5 border-b border-border/70 px-4 py-2.5">
          <LayoutGrid className="size-4 shrink-0 text-muted-foreground" />
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
            {t(titleKey ?? 'menu.panelTitle')}
          </h2>
          <label className="flex h-8 w-48 shrink-0 items-center gap-2 border-b border-input px-1.5 text-muted-foreground focus-within:border-primary">
            <Search className="size-4 shrink-0" />
            <input
              value={searchState}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('common.search')}
              aria-label={t('common.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        </header>

        <div className="flex min-h-0 flex-1">
          {categories.length > 0 && (
            <nav
              aria-label={t('menu.categories')}
              className="w-44 shrink-0 overflow-y-auto border-r border-border/70 bg-muted/15 p-2"
            >
              {categories.map((category) => {
                const active = category.key === activeCategory?.key
                return (
                  <button
                    key={category.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveCategory(category.key)}
                    className={cn(
                      'flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      active
                        ? 'bg-muted/60 font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    <Icon name={category.icon} className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {t(category.label)}
                    </span>
                    <ChevronRight className="size-3.5 shrink-0 opacity-45" />
                  </button>
                )
              })}
            </nav>
          )}

          <div className="min-w-0 flex-1 overflow-y-auto p-4">
            {query ? (
              searchResults.length ? (
                <MenuTileGrid items={searchResults} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {t('menu.noResults')}
                </p>
              )
            ) : (
              <div className="flex flex-col gap-5">
                {sections.map((section, index) => (
                  <MenuTileSection
                    key={`${section.titleKey}-${index}`}
                    titleKey={section.titleKey}
                    items={section.items}
                  />
                ))}
                {!sections.length && (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    {t('common.empty')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuTileSection({
  titleKey,
  items,
}: {
  titleKey: string
  items: MenuNode[]
}) {
  const { t } = useTranslation()

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground">
        {t(titleKey)}
      </h3>
      <MenuTileGrid items={items} />
    </section>
  )
}

function MenuTileGrid({ items }: { items: MenuNode[] }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const closeFloatingMenu = useCloseFloatingMenu()

  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
      {items.map((item) => {
        const active = pathname === item.path
        return (
          <NavLink
            key={item.key}
            to={item.path}
            end
            onClick={(event) => {
              closeFloatingMenu()
              if (active) event.preventDefault()
            }}
            className={cn(
              'group flex min-h-9 items-center gap-2.5 rounded-sm px-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring/50',
              active ? 'bg-primary/5' : 'hover:bg-muted/60',
            )}
          >
            <Icon
              name={item.icon}
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-colors',
                active && 'text-primary',
              )}
              strokeWidth={1.75}
            />
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-[13px] text-foreground/85',
                active && 'font-medium text-primary',
              )}
            >
              {t(item.label)}
            </span>
          </NavLink>
        )
      })}
    </div>
  )
}
