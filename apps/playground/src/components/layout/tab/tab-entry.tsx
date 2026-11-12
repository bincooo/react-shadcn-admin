import { useTranslation } from 'react-i18next'
import { ChevronDown, Pin, RotateCw, X } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@repo/ui/components/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { Button } from '@repo/ui/components/button'
import { cn } from '@/lib/utils'
import type { TabItem } from '@/store/app'
import type { BatchCommand, TabActions, TabCommand } from './tab-commands'

/** 单个页签：标签本体 + 右键命令菜单 */
export function TabEntry({
  tab,
  active,
  commands,
  batchCommands,
  onActivate,
  onClose,
}: {
  tab: TabItem
  active: boolean
  commands: TabCommand[]
  batchCommands: BatchCommand[]
  onActivate: (tab: TabItem) => void
  onClose: (key: string) => void
}) {
  const { t } = useTranslation()

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          role="tab"
          aria-selected={active}
          data-tab-active={active}
          tabIndex={0}
          onClick={() => onActivate(tab)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') onActivate(tab)
          }}
          onAuxClick={(event) => {
            if (event.button === 1 && !tab.affix) onClose(tab.key)
          }}
          className={cn(
            'group/tab relative flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] transition-colors outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring/50',
            active
              ? 'border-primary/25 bg-primary/10 font-medium text-primary'
              : 'border-border/80 bg-card text-muted-foreground hover:border-primary/25 hover:bg-muted hover:text-foreground dark:border-input/60 dark:bg-input/20',
          )}
        >
          {tab.affix && <Pin className="size-2.5 opacity-60" />}
          <span className="max-w-35 truncate">{t(tab.title)}</span>
          {!tab.affix && (
            <button
              type="button"
              aria-label={t('tabs.close')}
              onClick={(event) => {
                event.stopPropagation()
                onClose(tab.key)
              }}
              className={cn(
                'grid size-3.5 place-items-center rounded-sm opacity-60 transition-colors hover:bg-foreground/10 hover:opacity-100',
                active && 'opacity-70',
              )}
            >
              <X className="size-2.5" />
            </button>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-36">
        <ContextMenuGroup>
          {commands.map(({ key, icon: Icon, label, run, disabled }) => (
            <ContextMenuItem key={key} disabled={disabled} onClick={run}>
              <Icon />
              {label}
            </ContextMenuItem>
          ))}
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          {batchCommands.map(({ key, label, run }) => (
            <ContextMenuItem key={key} onClick={run}>
              {label}
            </ContextMenuItem>
          ))}
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/** 右侧批量操作下拉：刷新当前页签 / 关闭全部 / 关闭左右侧 */
export function TabActionsMenu({
  activeKey,
  actions,
  batchCommands,
}: {
  activeKey: string
  actions: TabActions
  batchCommands: BatchCommand[]
}) {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground"
            aria-label={t('tabs.actions')}
          />
        }
      >
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => actions.refresh(activeKey)}>
            <RotateCw />
            {t('tabs.refresh')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={actions.closeAll}>
            <X />
            {t('tabs.closeAll')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {batchCommands.map(({ key, label, run }) => (
            <DropdownMenuItem key={key} onClick={run}>
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
