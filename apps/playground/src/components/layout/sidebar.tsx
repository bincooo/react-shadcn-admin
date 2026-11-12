import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/navigation/logo'
import { UserAvatar } from '@/components/common/user-avatar'
import { useSidebarMenusSync } from '@/components/layout/use-menus-sync'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { CollapseHandle } from './collapse-handle'
import { MenuItems } from './menu/menu-group'

/** 一级菜单的完整列表（收起时仅图标 + 浮层） */
export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const { menus } = useSidebarMenusSync()

  return (
    <nav className="flex flex-col gap-0.5" data-slot="sidebar-nav">
      <MenuItems items={menus} collapsed={collapsed} />
    </nav>
  )
}

function SidebarUser({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="border-t border-sidebar-border p-3">
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-1 py-1',
          collapsed && 'justify-center',
        )}
      >
        <UserAvatar name={user?.name ?? 'A'} avatar={user?.avatar} />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium">
              {user?.name ?? t('menu.profile')}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/90">
              {user?.role ?? '—'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/** 左侧完整菜单栏（纵向 / 经典 / 混合） */
export function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      data-slot="app-sidebar"
      data-variant="primary"
      className={cn(
        'group/sidebar relative hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex',
        'h-full',
        collapsed ? 'w-16' : 'w-(--sidebar-width)',
      )}
    >
      <CollapseHandle collapsed={collapsed} />
      <div
        className={cn(
          'flex h-(--header-height) shrink-0 items-center border-b border-sidebar-border',
          collapsed ? 'justify-center px-0' : 'px-3',
        )}
      >
        <Logo collapsed={collapsed} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <SidebarNav collapsed={collapsed} />
      </div>
      <SidebarUser collapsed={collapsed} />
    </aside>
  )
}
