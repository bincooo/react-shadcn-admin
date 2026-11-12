import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { LetterText, Text } from 'lucide-react'
import { Logo } from '@/components/navigation/logo'
import { ThemePanel } from '@/components/theme/theme-panel'
import { Button } from '@repo/ui/components/button'
import { Spinner } from '@repo/ui/components/spinner'
import { TooltipProvider } from '@repo/ui/components/tooltip'
import { useSidebarRailSync } from '@/components/layout/use-menus-sync'
import { useRouteTabSync } from '@/components/layout/use-route-tab-sync'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import type { LayoutStyle } from '@/config/theme'
import { Footer } from './footer'
import { Breadcrumb } from './breadcrumb'
import { Header } from './header'
import { LockScreen } from './lock-screen'
import { RouteSearchDialog } from './route-search'
import { OutletWithKeepAlive } from './outlet-with-keep-alive'
import { TopMenus } from './menu/top-menus'
import type { MenuNode } from './menu/menu-model'
import { PrimaryMenus, SecondaryMenus } from './sidebar-menus'
import { Sidebar } from './sidebar'
import { TabsBar } from './tab/tabs-bar'
import { Watermark } from './watermark'

type SidebarKind = 'none' | 'full' | 'secondary' | 'split'
type LayoutFlags = {
  topHeader: boolean
  topMenus: boolean
  rail: boolean
  sidebar: SidebarKind
}

/** 六种布局骨架的开关组合，集中描述便于阅读与扩展。 */
const LAYOUT_FLAGS: Record<LayoutStyle, LayoutFlags> = {
  vertical: { topHeader: false, topMenus: false, rail: false, sidebar: 'full' },
  classic: { topHeader: true, topMenus: false, rail: false, sidebar: 'full' },
  mixed: { topHeader: true, topMenus: true, rail: false, sidebar: 'secondary' },
  horizontal: {
    topHeader: false,
    topMenus: true,
    rail: false,
    sidebar: 'none',
  },
  split: { topHeader: false, topMenus: true, rail: true, sidebar: 'split' },
  double: {
    topHeader: false,
    topMenus: false,
    rail: true,
    sidebar: 'secondary',
  },
}

/**
 * 第二栏菜单：分栏布局取选中分组的下一级；
 * 双栏布局下有子级取子级，叶子节点展示自身。
 */
function resolveSecondItems(
  flags: LayoutFlags,
  selectedItem: MenuNode | undefined,
): MenuNode[] | undefined {
  if (!flags.rail) return undefined
  if (flags.sidebar === 'split') return selectedItem?.children
  if (selectedItem?.children?.length) return selectedItem.children
  return selectedItem ? [selectedItem] : undefined
}

/** 双栏 / 分栏的第一栏：图标导航 + 分组切换 + 标题显隐按钮 */
function RailSidebar({
  items,
  activeKey,
  onSelectGroup,
  withLabel,
  onToggleCollapsed,
}: {
  items?: MenuNode[]
  activeKey?: string
  onSelectGroup: (key: string) => void
  withLabel: boolean
  onToggleCollapsed: () => void
}) {
  const { t } = useTranslation()

  return (
    <aside
      className={cn(
        'group/sidebar relative hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex',
        withLabel ? 'w-19' : 'w-16',
      )}
    >
      <div className="flex h-(--header-height) shrink-0 items-center justify-center border-b border-sidebar-border">
        <Logo collapsed />
      </div>
      <PrimaryMenus
        items={items}
        activeKey={activeKey}
        onSelectGroup={onSelectGroup}
        withLabel={withLabel}
        footer={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={onToggleCollapsed}
            aria-label={
              withLabel ? t('header.collapseLabel') : t('header.expandLabel')
            }
          >
            {withLabel ? <Text /> : <LetterText />}
          </Button>
        }
      />
    </aside>
  )
}

/** 页签 + 内容区 + 页脚：两种骨架共用 */
function PageBody({
  showTabs,
  userName,
}: {
  showTabs: boolean
  userName?: string
}) {
  return (
    <>
      {showTabs && <TabsBar />}
      <div
        id="app-container"
        data-slot="app-main"
        className="flex min-h-0 flex-1 flex-col overflow-auto bg-muted/30 p-(--page-pad)"
      >
        <Watermark fallbackText={userName} />
        <div className="flex min-h-0 flex-1 flex-col">
          <Suspense
            fallback={
              <div className="grid h-full place-items-center text-muted-foreground">
                <Spinner className="size-6" />
              </div>
            }
          >
            <OutletWithKeepAlive />
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  )
}

/** Authenticated shell: selects a layout skeleton and composes shared navigation and page content. */
export function AdminLayout() {
  const collapsed = useAppStore((s) => s.collapsed)
  const toggleCollapsed = useAppStore((s) => s.toggleCollapsed)
  const secondCollapsed = useAppStore((s) => s.secondCollapsed)
  const toggleSecondCollapsed = useAppStore((s) => s.toggleSecondCollapsed)
  const showTabs = useThemeStore((s) => s.showTabs)
  const showBreadcrumb = useThemeStore((s) => s.showBreadcrumb)
  const layoutStyle = useThemeStore((s) => s.layoutStyle)
  const user = useAuthStore((s) => s.user)

  useRouteTabSync()

  const flags = LAYOUT_FLAGS[layoutStyle] ?? LAYOUT_FLAGS.vertical
  // 双栏 / 分栏第一栏的分组选中态：目录节点只切换第二栏，不导航
  const { railItems, selectedItem, selectRailItem } = useSidebarRailSync(
    flags.sidebar === 'split',
  )

  // 双栏 / 分栏第一栏是否显示图标下方标题（底部按钮控制显隐）
  const railLabels = flags.rail && !collapsed

  // 分栏布局根菜单没有子菜单时整栏隐藏
  const showRail =
    flags.rail &&
    (flags.sidebar === 'split' ? (railItems?.length ?? 0) > 0 : true)

  // 双栏 / 分栏第二栏展示选中分组的下一级；双栏下叶子节点展示自身
  const secondItems = resolveSecondItems(flags, selectedItem)

  const showSecondSidebar =
    flags.sidebar === 'secondary' ||
    (flags.sidebar === 'split' && (secondItems?.length ?? 0) > 0)

  const topMenusSlot = flags.topMenus ? (
    <TopMenus
      flyout={layoutStyle === 'horizontal'}
      className="ml-3 hidden flex-1 lg:flex"
    />
  ) : undefined

  // 面包屑与顶部菜单共用标题区：顶部菜单已占位时不再叠面包屑
  const titleSlot =
    showBreadcrumb && !flags.topMenus ? <Breadcrumb /> : undefined

  return (
    // Tooltip 只在后台外壳里使用：挂在布局内，登录页无需下载 tooltip/floating-ui
    <TooltipProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        {flags.topHeader ? (
          // 顶栏横跨整页（经典 / 混合），侧边栏从顶栏下方开始
          <div className="flex min-w-0 flex-1 flex-col">
            <Header beforeTitle={titleSlot} leading={topMenusSlot} />
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {flags.sidebar === 'full' && <Sidebar collapsed={collapsed} />}
              {flags.sidebar === 'secondary' && (
                <SecondaryMenus collapsed={collapsed} />
              )}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <PageBody showTabs={showTabs} userName={user?.name} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {showRail && (
              <RailSidebar
                items={railItems}
                activeKey={selectedItem?.key}
                onSelectGroup={selectRailItem}
                withLabel={railLabels}
                onToggleCollapsed={toggleCollapsed}
              />
            )}
            {flags.sidebar === 'full' && <Sidebar collapsed={collapsed} />}
            {showSecondSidebar && (
              <SecondaryMenus
                header="app"
                collapsed={secondCollapsed}
                items={secondItems}
                onToggleCollapsed={toggleSecondCollapsed}
              />
            )}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <Header beforeTitle={titleSlot} leading={topMenusSlot} />
              <PageBody showTabs={showTabs} userName={user?.name} />
            </div>
          </>
        )}

        <RouteSearchDialog />
        <ThemePanel />
        <LockScreen />
      </div>
    </TooltipProvider>
  )
}
