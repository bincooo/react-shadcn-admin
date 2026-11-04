import { useTranslation } from 'react-i18next'
import { Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/store/theme'
import { DEFAULT_STATUS_COLORS } from '@/config/theme'
import { HEADER_BTN, PANEL_CARD } from './panel-styles'
/** 单个状态色行：色块 + HEX 输入 + 恢复默认；默认色只从 STATUS_COLORS 取 */
export function StatusColorRow({
  statusKey,
  label,
}: {
  statusKey: keyof typeof DEFAULT_STATUS_COLORS
  label: string
}) {
  const { t } = useTranslation()
  const color = useThemeStore((s) => s.statusColors[statusKey])
  const setStatusColor = useThemeStore((s) => s.setStatusColor)
  const changed =
    color.toLowerCase() !== DEFAULT_STATUS_COLORS[statusKey].toLowerCase()

  return (
    <div className={`flex items-center gap-3 ${PANEL_CARD}`}>
      <label
        className="relative grid size-6 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg border border-black/5 transition-transform hover:scale-105"
        style={{ backgroundColor: color }}
        title={label}
      >
        <Check
          className="pointer-events-none size-3.5 text-white"
          strokeWidth={3}
        />
        <input
          type="color"
          value={color}
          onChange={(e) =>
            setStatusColor(statusKey, e.target.value.toUpperCase())
          }
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={`${label} color`}
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-foreground">{label}</p>
        <p className="font-mono text-[10.5px] tracking-wide text-muted-foreground">
          {color.toUpperCase()}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={!changed}
        onClick={() =>
          setStatusColor(statusKey, DEFAULT_STATUS_COLORS[statusKey])
        }
        aria-label={t('theme.resetColor')}
        className={`size-6 ${HEADER_BTN}`}
      >
        <RotateCcw className="size-3" />
      </Button>
    </div>
  )
}
