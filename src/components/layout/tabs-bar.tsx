import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { useTabActions } from '@/components/layout/use-tab-actions'
import { useTabScrollSync } from './use-tab-scroll'
import { buildBatchCommands, buildTabCommands } from './tab-commands'
import { TabActionsMenu, TabEntry, TOOL_BTN } from './tab-entry'

/** 页签滚动按钮：不可滚动时置灰 */
function ScrollButton({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: -1 | 1
  disabled: boolean
  onClick: () => void
  label: string
}) {
  const Icon = direction === -1 ? ChevronLeft : ChevronRight
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className={`${TOOL_BTN} disabled:opacity-35`}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      <Icon />
    </Button>
  )
}

/** 多页签栏：页签数据来自路由同步，滚动与关闭行为由 tab-commands 决定 */
export function TabsBar() {
  const { t } = useTranslation()
  const actions = useTabActions()
  const { tabsState, activeKeyState, activate, close, refresh } = actions
  const {
    scrollRef,
    canScrollLeftState,
    canScrollRightState,
    updateScrollState,
    scrollBy,
  } = useTabScrollSync(activeKeyState, tabsState.length)

  return (
    <div
      data-slot="tabs-bar"
      className="flex h-10 shrink-0 items-center gap-1 border-b bg-background px-2"
    >
      <ScrollButton
        direction={-1}
        disabled={!canScrollLeftState}
        onClick={() => scrollBy(-1)}
        label={t('tabs.scrollLeft')}
      />

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="scrollbar-none min-w-0 flex-1 overflow-x-auto"
      >
        {/* w-max 让内容撑满自身宽度，横向溢出时才能滚动 */}
        <div className="flex w-max items-center gap-1">
          {tabsState.map((tab) => (
            <TabEntry
              key={tab.key}
              tab={tab}
              active={tab.key === activeKeyState}
              commands={buildTabCommands(t, tab, actions)}
              batchCommands={buildBatchCommands(t, tab.key, actions)}
              onActivate={activate}
              onClose={close}
            />
          ))}
        </div>
      </div>

      <ScrollButton
        direction={1}
        disabled={!canScrollRightState}
        onClick={() => scrollBy(1)}
        label={t('tabs.scrollRight')}
      />

      {/* 刷新当前页签 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className={TOOL_BTN}
            onClick={() => refresh(activeKeyState)}
            aria-label={t('tabs.refresh')}
          >
            <RotateCw />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('tabs.refresh')}</TooltipContent>
      </Tooltip>

      <TabActionsMenu
        activeKey={activeKeyState}
        actions={actions}
        batchCommands={buildBatchCommands(t, activeKeyState, actions)}
      />
    </div>
  )
}
