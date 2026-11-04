import { useTranslation } from 'react-i18next'
import { Settings2, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { ColumnConfigSnapshot } from './column-config'
import { GridTableConfig } from './grid-table-config'

/** 弹层内的一行开关：整行可点，文字与复选框共用点击区域 */
const POPOVER_ROW_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[0.8rem] transition-colors hover:bg-muted/60'

interface GridTablePropertiesPopoverProps {
  showBorderToggle: boolean
  borderMode: 'row' | 'grid'
  onBorderModeChange: (mode: 'row' | 'grid') => void
  selectionEnabled: boolean
  selectVisible: boolean
  onSelectVisibleChange: (visible: boolean) => void
}

/** 工具栏「属性」弹层：边框模式与多选列开关。 */
export function GridTablePropertiesPopover({
  showBorderToggle,
  borderMode,
  onBorderModeChange,
  selectionEnabled,
  selectVisible,
  onSelectVisibleChange,
}: GridTablePropertiesPopoverProps) {
  const { t } = useTranslation()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings2 data-icon="inline-start" />
          {t('table.properties')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        {showBorderToggle && (
          <label className={POPOVER_ROW_CLASS}>
            <Checkbox
              checked={borderMode === 'grid'}
              onCheckedChange={(checked) =>
                onBorderModeChange(checked ? 'grid' : 'row')
              }
            />
            {t('table.border')}
          </label>
        )}
        {selectionEnabled && (
          <label className={POPOVER_ROW_CLASS}>
            <Checkbox
              checked={selectVisible}
              onCheckedChange={(checked) =>
                onSelectVisibleChange(checked === true)
              }
            />
            {t('table.select')}
          </label>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface GridTableColumnConfigPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  snapshot: ColumnConfigSnapshot
  defaults: ColumnConfigSnapshot
  leafLabels: Record<string, string>
  groupLabels: Record<string, string>
  onApply: (next: ColumnConfigSnapshot) => void
}

/** 工具栏「配置」弹层：仅在打开时挂载列配置面板，关闭后草稿状态随之丢弃。 */
export function GridTableColumnConfigPopover({
  open,
  onOpenChange,
  snapshot,
  defaults,
  leafLabels,
  groupLabels,
  onApply,
}: GridTableColumnConfigPopoverProps) {
  const { t } = useTranslation()

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <SlidersHorizontal data-icon="inline-start" />
          {t('table.configure')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        {open && (
          <GridTableConfig
            initial={snapshot}
            defaults={defaults}
            leafLabels={leafLabels}
            groupLabels={groupLabels}
            onCancel={() => onOpenChange(false)}
            onApply={onApply}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
