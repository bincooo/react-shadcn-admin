import { RotateCw, X, type LucideIcon } from 'lucide-react'
import type { TabItem } from '@/store/app'

type Translate = (key: string) => string

/** 页签动作中命令构建所需的部分 */
export interface TabActions {
  refresh: (path: string) => void
  close: (key: string) => void
  closeOthers: (key: string) => void
  closeSide: (key: string, side: 'left' | 'right') => void
  closeAll: () => void
}

export interface TabCommand {
  key: string
  icon: LucideIcon
  label: string
  run: () => void
  disabled?: boolean
}

export interface BatchCommand {
  key: string
  label: string
  run: () => void
}

/** 页签命令：右键菜单与右上角下拉共用同一份定义 */
export function buildTabCommands(
  t: Translate,
  tab: TabItem,
  actions: TabActions,
): TabCommand[] {
  return [
    {
      key: 'refresh',
      icon: RotateCw,
      label: t('tabs.refresh'),
      run: () => actions.refresh(tab.path),
    },
    {
      key: 'close',
      icon: X,
      label: t('tabs.close'),
      run: () => actions.close(tab.key),
      disabled: tab.affix,
    },
  ]
}

/** 批量关闭命令：作用于指定页签的左右两侧或除它之外的全部页签 */
export function buildBatchCommands(
  t: Translate,
  key: string,
  actions: TabActions,
): BatchCommand[] {
  return [
    {
      key: 'others',
      label: t('tabs.closeOthers'),
      run: () => actions.closeOthers(key),
    },
    {
      key: 'left',
      label: t('tabs.closeLeft'),
      run: () => actions.closeSide(key, 'left'),
    },
    {
      key: 'right',
      label: t('tabs.closeRight'),
      run: () => actions.closeSide(key, 'right'),
    },
  ]
}
