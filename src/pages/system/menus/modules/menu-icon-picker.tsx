import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { iconNames } from 'lucide-react/dynamic'
import { Icon } from '@/components/common/icon'
import { Input } from '@/components/ui/input'
import { isIconName, toIconName } from '@/lib/icons/icon-name'

/**
 * 菜单图标选择器：输入即筛选，点选后立即预览真实渲染结果。
 *
 * 候选直接用 `lucide-react/dynamic` 的 `iconNames` —— 它就是 `DynamicIcon` 能加载
 * 的全部图标名，与渲染侧同源，因此「能选的」与「能显示的」不会跑偏。
 *
 * 不把上千个图标一次渲染成列表：每项都会实例化一个 `DynamicIcon`，滚动开销过大，
 * 因此限制渲染条数，靠输入缩小范围。
 */
const MAX_VISIBLE = 60

const ICON_NAME_SET = new Set<string>(iconNames)

export function MenuIconPicker({
  id,
  value,
  onChange,
}: {
  id: string
  /** 当前值：可能来自接口（PascalCase），也可能是用户输入 */
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const [openState, setOpen] = useState(false)

  const keyword = value.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!keyword) return iconNames.slice(0, MAX_VISIBLE)
    return iconNames
      .filter((name) => name.includes(keyword))
      .slice(0, MAX_VISIBLE)
  }, [keyword])

  const usable = isIconName(value)

  return (
    <div className="relative">
      <div className="relative">
        <Icon
          name={value}
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          className="pl-8"
          value={value}
          placeholder={t('system.menu.iconHint')}
          autoComplete="off"
          role="combobox"
          aria-expanded={openState}
          aria-controls={`${id}-options`}
          onFocus={() => setOpen(true)}
          // 失焦延迟关闭，否则点选选项时列表已先被卸载
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
          }}
        />
      </div>

      {openState && matches.length > 0 && (
        <ul
          id={`${id}-options`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {matches.map((name) => (
            <li key={name}>
              <button
                type="button"
                role="option"
                aria-selected={name === toIconName(value)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-accent aria-selected:bg-accent"
                // 用 mousedown 抢在 input 的 blur 之前，避免列表闪一下就消失
                onMouseDown={(event) => {
                  event.preventDefault()
                  onChange(name)
                  setOpen(false)
                }}
              >
                <Icon
                  name={name}
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="truncate">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {keyword && !usable && ICON_NAME_SET.has(toIconName(keyword)) && (
        <p className="mt-1 text-[12px] text-muted-foreground">
          {t('system.menu.iconFallbackHint')}
        </p>
      )}
    </div>
  )
}
