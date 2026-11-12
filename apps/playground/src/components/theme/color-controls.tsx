import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hexToHsl, hslToHex, normalizeHex, readableOn } from '@/lib/color'
import { PRESET_COLORS } from '@/config/theme'
/** 预设色块行：点选即生效，当前色用对勾标记（不依赖焦点态） */
export function ColorSwatches({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="grid grid-cols-6 gap-2.5">
      {PRESET_COLORS.map((color) => {
        const active = color.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={color}
            aria-pressed={active}
            className={cn(
              'relative grid aspect-square place-items-center rounded-full transition-transform duration-150 outline-none',
              'hover:scale-108 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              active && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
            )}
            style={{ backgroundColor: color }}
          >
            {active && (
              <CheckIcon
                className="size-3.5"
                strokeWidth={3}
                style={{ color: readableOn(color) }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

/** 竖直色相滑条：拖动或点击选择颜色 */
function HueSlider({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const { h, s, l } = hexToHsl(value)

  // 指针按下后由元素自身捕获事件，无需 window 级监听与额外 ref 同步
  const pickFromPointer = (clientY: number) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
    onChange(
      hslToHex({
        h: ratio * 360,
        s: Math.max(s, 55),
        l: Math.min(Math.max(l, 45), 62),
      }),
    )
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={t('theme.hue')}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(h)}
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        pickFromPointer(e.clientY)
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        e.preventDefault()
        pickFromPointer(e.clientY)
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          onChange(hslToHex({ h: h + 4, s: Math.max(s, 55), l }))
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          onChange(hslToHex({ h: h - 4, s: Math.max(s, 55), l }))
        }
      }}
      className="relative h-18.5 w-2.75 shrink-0 cursor-pointer touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
      style={{
        background:
          'linear-gradient(to bottom, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)',
      }}
    >
      <span
        className="pointer-events-none absolute left-1/2 size-3.75 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
        style={{ top: `${(h / 360) * 100}%`, backgroundColor: value }}
      />
    </div>
  )
}

/** 自定义 HEX 输入：失焦或回车时归一化，非法输入回退到当前值 */
export function CustomColorField({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  const { t } = useTranslation()
  // draft 为 null 时输入框跟随外部 value，无需用 effect 同步 props → state
  const [draftState, setDraft] = useState<string | null>(null)
  const [invalidState, setInvalid] = useState(false)
  const shown = draftState ?? value

  const commit = (raw: string) => {
    const normalized = normalizeHex(raw)
    if (!normalized) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setDraft(null)
    onChange(normalized)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors',
        invalidState ? 'border-danger' : 'border-border/70',
      )}
    >
      <label className="relative grid size-8.5 shrink-0 cursor-pointer place-items-center rounded-md border border-border/70">
        <span
          className="absolute inset-0.75 rounded-lg"
          style={{ backgroundColor: value }}
        />
        <CheckIcon
          className="relative size-3.5"
          strokeWidth={3}
          style={{ color: readableOn(value) }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => commit(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={t('theme.customColor')}
        />
      </label>

      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-foreground">
          {t('theme.customColor')}
        </p>
        <p className="text-[10.5px] text-muted-foreground">
          {t('theme.customColorHint')}
        </p>
        <input
          value={shown}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(shown)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(shown)
          }}
          spellCheck={false}
          aria-invalid={invalidState}
          className={cn(
            'mt-1 w-full bg-transparent font-mono text-[11.5px] tracking-wide outline-none',
            invalidState ? 'text-danger' : 'text-foreground/70',
          )}
        />
      </div>

      <HueSlider value={value} onChange={onChange} />
    </div>
  )
}
