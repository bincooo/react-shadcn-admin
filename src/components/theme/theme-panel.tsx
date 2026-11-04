import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  RotateCcw,
  SwatchBook,
  PanelLeft,
  SlidersHorizontal,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore } from '@/store/app'
import { useThemeStore } from '@/store/theme'
import { HEADER_BTN } from './modules/panel-styles'
import { AppearanceTab } from './modules/appearance-tab'
import { InterfaceTab } from './modules/interface-tab'
import { ExtensionTab } from './modules/extension-tab'

/** 三个 Tab 内容区共用的内边距 */
const TAB_BODY = 'px-4 pt-5 pb-8'

/** 面板的三个标签页：触发器与内容区都由这里派生 */
const TABS = [
  {
    value: 'appearance',
    label: 'theme.tabAppearance',
    icon: SwatchBook,
    Panel: AppearanceTab,
  },
  {
    value: 'interface',
    label: 'theme.tabInterface',
    icon: PanelLeft,
    Panel: InterfaceTab,
  },
  {
    value: 'extension',
    label: 'theme.tabExtension',
    icon: SlidersHorizontal,
    Panel: ExtensionTab,
  },
] as const
/**
 * 主题配置面板：三个页签（外观 / 界面 / 扩展）共用同一个 store。
 * 面板只在打开时挂载，关闭即卸载，因此各页签无需自行处理重置。
 */
export function ThemePanel() {
  const { t } = useTranslation()
  const open = useAppStore((s) => s.themePanelOpen)
  const setOpen = useAppStore((s) => s.setThemePanelOpen)
  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 overflow-hidden p-0 transition-[max-width] duration-300 sm:max-w-100"
        // 抽屉打开时默认聚焦第一个可聚焦元素（「恢复默认」按钮），它带 Tooltip，
        // 聚焦即弹提示，第一次按 Esc 只会关掉 Tooltip。这里直接聚焦关闭按钮。
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          closeRef.current?.focus()
        }}
      >
        <SheetHeader className="flex flex-row items-center gap-2 border-b border-border/70 px-4 py-3">
          <SheetTitle className="text-[15px] font-semibold">
            {t('theme.title')}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t('theme.customizeHint')}
          </SheetDescription>
          <div className="ml-auto flex items-center gap-1">
            <ResetAllButton />
            <Button
              ref={closeRef}
              variant="ghost"
              size="icon-sm"
              className={HEADER_BTN}
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
            >
              <X />
            </Button>
          </div>
        </SheetHeader>

        <ThemeTabs />
      </SheetContent>
    </Sheet>
  )
}

function ResetAllButton() {
  const { t } = useTranslation()
  const resetAll = useThemeStore((s) => s.resetAll)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={HEADER_BTN}
          onClick={resetAll}
          aria-label={t('theme.reset')}
        >
          <RotateCcw />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('theme.reset')}</TooltipContent>
    </Tooltip>
  )
}

function ThemeTabs() {
  const { t } = useTranslation()
  return (
    <Tabs defaultValue="appearance" className="min-h-0 flex-1 gap-0">
      <div className="px-4 pt-3">
        <TabsList className="w-full">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5">
              <Icon data-icon="inline-start" />
              {t(label)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {TABS.map(({ value, Panel }) => (
          <TabsContent key={value} value={value} className={TAB_BODY}>
            <Panel />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}
