import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Maximize,
  Minimize,
  Languages,
  LogOut,
  UserRound,
  Palette,
  Sun,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/common/user-avatar'
import { useFullscreen } from '@/components/layout/use-fullscreen'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import { MODE_OPTIONS } from '@/config/theme'
import { changeLanguage, LANGUAGES } from '@/i18n'
import { MobileNav } from './mobile-nav'
import { IconBtn, ICON_BTN } from './icon-btn'

interface HeaderProps {
  /** 左侧插槽：Logo、顶部菜单等 */
  leading?: ReactNode
  /**
   * 标题区插槽：传入即渲染在动作按钮之前并占满剩余宽度（面包屑由此挂入）。
   * 是否显示交给布局决定，Header 不感知「面包屑」这个概念。
   */
  beforeTitle?: ReactNode
}

/** 明暗模式下拉：触发器图标跟随当前模式 */
function ThemeModeMenu() {
  const { t } = useTranslation()
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const ModeIcon =
    MODE_OPTIONS.find((option) => option.value === mode)?.icon ?? Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className={ICON_BTN}
          aria-label={t('theme.themeMode')}
        >
          <ModeIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuGroup>
          {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setMode(value)}
              className={cn(mode === value && 'text-primary')}
            >
              <Icon />
              {t(label)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LanguageMenu() {
  const { t, i18n } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className={ICON_BTN}
          aria-label={t('header.language')}
        >
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.value}
              onClick={() => void changeLanguage(lang.value)}
              className={cn(i18n.language === lang.value && 'text-primary')}
            >
              {lang.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu({ onOpenThemePanel }: { onOpenThemePanel: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const handleLogout = () => {
    logout()
    toast.success(t('header.logout'))
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-1 flex cursor-pointer items-center gap-2 rounded-full transition-opacity outline-none hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={t('menu.profile')}
        >
          <UserAvatar className="ml-1 size-9" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="text-[13px] font-medium">{user?.name ?? 'Admin'}</p>
            <p className="text-[11px] font-normal text-muted-foreground">
              {user?.email}
            </p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <UserRound />
            {t('menu.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenThemePanel}>
            <Palette />
            {t('theme.title')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          {t('header.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * 顶栏：左侧插槽（Logo / 顶部菜单）+ 标题区插槽 + 右侧动作按钮。
 * 面包屑等业务内容由布局通过插槽注入，Header 不感知具体内容。
 */
export function Header({ leading, beforeTitle }: HeaderProps) {
  const { t } = useTranslation()
  const setSearchOpen = useAppStore((s) => s.setSearchOpen)
  const themePanelOpen = useAppStore((s) => s.themePanelOpen)
  const setThemePanelOpen = useAppStore((s) => s.setThemePanelOpen)
  const { fullscreenState, toggle: toggleFullscreen } = useFullscreen()

  return (
    <header
      data-slot="app-header"
      className="flex shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur"
      style={{ height: 'var(--header-height)' }}
    >
      <MobileNav />
      {leading}

      {beforeTitle && <div className="min-w-0 flex-1">{beforeTitle}</div>}

      <div className="flex items-center gap-0.5">
        <IconBtn label={t('common.search')} onClick={() => setSearchOpen(true)}>
          <Search />
        </IconBtn>
        <IconBtn
          label={
            fullscreenState
              ? t('header.exitFullscreen')
              : t('header.fullscreen')
          }
          onClick={toggleFullscreen}
          className="hidden sm:inline-flex"
        >
          {fullscreenState ? <Minimize /> : <Maximize />}
        </IconBtn>

        <IconBtn
          label={t('theme.title')}
          onClick={() => setThemePanelOpen(!themePanelOpen)}
          className="hidden sm:inline-flex"
        >
          <Palette />
        </IconBtn>

        <ThemeModeMenu />
        <LanguageMenu />
        <UserMenu onOpenThemePanel={() => setThemePanelOpen(true)} />
      </div>
    </header>
  )
}
