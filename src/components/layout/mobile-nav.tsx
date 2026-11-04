import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/navigation/logo'
import { markDrawerNavigation } from '@/lib/router/page-transition'
import { SidebarNav } from './sidebar'

/**
 * 移动端抽屉导航：小屏下替代固定侧边栏。
 */
export function MobileNav() {
  const { t } = useTranslation()
  const [openState, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground lg:hidden"
        onClick={() => setOpen(true)}
        aria-label={t('header.openMenu')}
      >
        <Menu />
      </Button>
      <Sheet open={openState} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-66 gap-0 border-sidebar-border bg-sidebar p-0"
        >
          <SheetHeader className="border-b border-sidebar-border px-3 py-3">
            <SheetTitle className="sr-only">{t('header.menu')}</SheetTitle>
            <SheetDescription className="sr-only">
              {t('header.menu')}
            </SheetDescription>
            <Logo />
          </SheetHeader>
          {/* 关闭按钮跟随侧栏令牌：默认 ghost 按钮取全局 hover:bg-muted / ring-ring，
              暗色侧栏下会变成白底浅字；这里改用 sidebar-accent 与不透明焦点环 */}
          <SheetClose asChild>
            <button
              type="button"
              aria-label={t('header.closeMenu')}
              className="absolute top-3 right-3 inline-flex size-7 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </SheetClose>
          {/* 只有真正点到菜单项才收起抽屉：空白处 / 分组标题点击不关闭 */}
          <div
            className="min-h-0 flex-1 overflow-y-auto"
            onClick={(event) => {
              const link = (event.target as Element).closest('a[href]')
              if (link) {
                // 抽屉退场即转场，别让新页面再播一遍入场动画
                markDrawerNavigation(link.getAttribute('href') ?? '')
                setOpen(false)
              }
            }}
          >
            <SidebarNav collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
