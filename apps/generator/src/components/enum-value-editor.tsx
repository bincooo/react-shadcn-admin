import { useEffect, useRef, useState } from 'react'
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import { TextInput } from '@/components/ui'
import { cn } from '@repo/ui/lib/utils'

interface EnumPreset {
  value: string
  description: string
}

const PRESET_GROUPS: { label: string; items: EnumPreset[] }[] = [
  {
    label: '启用状态',
    items: [
      { value: 'ENABLED', description: '启用' },
      { value: 'DISABLED', description: '禁用' },
      { value: 'ACTIVE', description: '活跃' },
      { value: 'INACTIVE', description: '停用' },
    ],
  },
  {
    label: '订单/流程',
    items: [
      { value: 'CREATED', description: '已创建' },
      { value: 'PAID', description: '已支付' },
      { value: 'SHIPPED', description: '已发货' },
      { value: 'COMPLETED', description: '已完成' },
      { value: 'CANCELLED', description: '已取消' },
    ],
  },
  {
    label: '审批/发布',
    items: [
      { value: 'DRAFT', description: '草稿' },
      { value: 'PENDING', description: '待处理' },
      { value: 'APPROVED', description: '已通过' },
      { value: 'REJECTED', description: '已拒绝' },
      { value: 'PUBLISHED', description: '已发布' },
      { value: 'ARCHIVED', description: '已归档' },
    ],
  },
  {
    label: '是否',
    items: [
      { value: 'YES', description: '是' },
      { value: 'NO', description: '否' },
    ],
  },
]

function normalizeEnumCode(value: string) {
  return value.trim().toUpperCase()
}

function isValidEnumCode(value: string) {
  return /^[A-Z_$][A-Z0-9_$]*$/.test(value)
}

const IDENTIFIER_ERROR =
  '枚举值需为合法 Java 标识符（字母/数字/下划线，且不能以数字开头）'

/** 校验枚举值；返回空字符串表示通过。 */
function enumCodeError(value: string, values: string[]) {
  if (!value) return '枚举值不能为空'
  if (!isValidEnumCode(value)) return IDENTIFIER_ERROR
  if (values.includes(value)) return `枚举值已存在：${value}`
  return ''
}

function EnumRow({
  value,
  description,
  values,
  index,
  disabled,
  onRename,
  onChangeDescription,
  onRemove,
}: {
  value: string
  description: string
  values: string[]
  index: number
  disabled?: boolean
  onRename: (oldValue: string, newValue: string) => void
  onChangeDescription: (value: string, description: string) => void
  onRemove: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  const skipBlurCommit = useRef(false)

  useEffect(() => {
    setDraft(value)
    setError('')
  }, [value])

  const commit = () => {
    const next = normalizeEnumCode(draft)
    const error = enumCodeError(next, next === value ? [] : values)
    if (error) {
      setError(error)
      return false
    }
    setError('')
    if (next !== value) onRename(value, next)
    return true
  }

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <div className="flex items-center gap-1.5 px-1.5 py-1">
        <span className="w-3 shrink-0 text-right font-mono text-[9px] text-muted-foreground">
          {index + 1}
        </span>
        <TextInput
          mono
          value={draft}
          aria-label={`枚举值 ${index + 1}`}
          title="点击修改枚举值，回车确认，Esc 还原"
          onChange={(event) => {
            setDraft(event.target.value.toUpperCase())
            setError('')
          }}
          onBlur={() => {
            if (skipBlurCommit.current) {
              skipBlurCommit.current = false
              return
            }
            if (!commit()) setDraft(value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            }
            if (event.key === 'Escape') {
              skipBlurCommit.current = true
              setDraft(value)
              setError('')
              event.currentTarget.blur()
            }
          }}
          className={cn(
            'h-6 w-32 shrink-0 border-transparent bg-transparent px-1 font-mono text-[11px] font-medium hover:border-input',
            error && 'border-destructive text-destructive',
          )}
          disabled={disabled}
        />
        <TextInput
          value={description}
          onChange={(event) => onChangeDescription(value, event.target.value)}
          placeholder="文本说明，例如：已创建"
          className="h-7 flex-1 text-[11px]"
          disabled={disabled}
        />
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`删除枚举值 ${value}`}
          title="删除枚举值"
          className="text-muted-foreground hover:text-destructive"
          disabled={disabled}
          onClick={() => onRemove(value)}
        >
          <Trash2Icon />
        </Button>
      </div>
      {error ? (
        <p className="px-1.5 pb-1 text-[9px] text-destructive">{error}</p>
      ) : null}
    </div>
  )
}

function PresetGrid({
  values,
  onAdd,
}: {
  values: string[]
  onAdd: (value: string, description: string) => void
}) {
  return (
    <div className="max-h-56 overflow-y-auto p-1.5">
      {PRESET_GROUPS.map((group) => (
        <div key={group.label} className="mb-1.5 last:mb-0">
          <p className="px-1 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
            {group.label}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {group.items.map((preset) => {
              const added = values.includes(preset.value)
              return (
                <button
                  key={preset.value}
                  type="button"
                  disabled={added}
                  onClick={() => onAdd(preset.value, preset.description)}
                  className={cn(
                    'flex items-center justify-between gap-1 border border-border px-1.5 py-1 text-left text-[10px] transition-colors',
                    added
                      ? 'cursor-default border-primary/30 bg-primary/5 text-muted-foreground'
                      : 'hover:bg-muted',
                  )}
                >
                  <span className="truncate font-mono">{preset.value}</span>
                  <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
                    <span className="truncate">{preset.description}</span>
                    {added ? (
                      <CheckIcon className="size-3 shrink-0 text-primary" />
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function CustomValueRow({
  value,
  description,
  onValueChange,
  onDescriptionChange,
  onSubmit,
}: {
  value: string
  description: string
  onValueChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="border-t border-border p-1.5">
      <p className="mb-1 px-1 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
        自定义
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <TextInput
          mono
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit()
          }}
          placeholder="VALUE"
          className="h-7 w-28 text-[11px]"
        />
        <TextInput
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit()
          }}
          placeholder="文本说明"
          className="h-7 min-w-28 flex-1 text-[11px]"
        />
        <Button size="xs" onClick={onSubmit}>
          添加
        </Button>
      </div>
    </div>
  )
}

export function EnumValueEditor({
  values,
  descriptions,
  onChange,
  disabled,
}: {
  values: string[]
  descriptions: Record<string, string>
  onChange: (values: string[], descriptions: Record<string, string>) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [error, setError] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const addValue = (rawValue: string, description: string) => {
    const value = normalizeEnumCode(rawValue)
    const error = enumCodeError(value, values)
    if (error) {
      setError(error)
      return
    }
    onChange([...values, value], {
      ...descriptions,
      [value]: description.trim(),
    })
    setError('')
  }

  const addCustom = () => {
    addValue(customValue, customDescription)
    if (isValidEnumCode(normalizeEnumCode(customValue))) {
      setCustomValue('')
      setCustomDescription('')
    }
  }

  const removeValue = (value: string) => {
    const nextDescriptions = { ...descriptions }
    delete nextDescriptions[value]
    onChange(
      values.filter((item) => item !== value),
      nextDescriptions,
    )
  }

  const changeDescription = (value: string, description: string) => {
    onChange(values, { ...descriptions, [value]: description })
  }

  const renameValue = (oldValue: string, newValue: string) => {
    const nextDescriptions = { ...descriptions }
    const description = nextDescriptions[oldValue]
    delete nextDescriptions[oldValue]
    if (description) nextDescriptions[newValue] = description
    onChange(
      values.map((item) => (item === oldValue ? newValue : item)),
      nextDescriptions,
    )
  }

  return (
    <div ref={rootRef} className="space-y-1.5">
      {values.length === 0 ? (
        <p className="border border-dashed border-border px-2 py-3 text-[10px] text-muted-foreground">
          尚未添加枚举值，点击下方「添加枚举值」选择常用值或自定义。
        </p>
      ) : (
        <div className="border border-border">
          {values.map((value, index) => (
            <EnumRow
              key={index}
              value={value}
              description={descriptions[value] ?? ''}
              values={values}
              index={index}
              disabled={disabled}
              onRename={renameValue}
              onChangeDescription={changeDescription}
              onRemove={removeValue}
            />
          ))}
        </div>
      )}

      <div className="relative">
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={disabled}
          aria-expanded={open}
          onClick={() => {
            setError('')
            setOpen((previous) => !previous)
          }}
        >
          <PlusIcon data-icon="inline-start" />
          添加枚举值
          <ChevronDownIcon
            className={cn('transition-transform', open && 'rotate-180')}
          />
        </Button>

        {open ? (
          <div className="absolute top-full left-0 z-30 mt-1 w-[min(460px,calc(100vw-3rem))] border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
              <span className="text-[11px] font-medium">常用枚举值</span>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="关闭"
                onClick={() => setOpen(false)}
              >
                <XIcon />
              </Button>
            </div>

            <PresetGrid values={values} onAdd={addValue} />

            <CustomValueRow
              value={customValue}
              description={customDescription}
              onValueChange={setCustomValue}
              onDescriptionChange={setCustomDescription}
              onSubmit={addCustom}
            />

            {error ? (
              <p className="border-t border-border px-2 py-1 text-[10px] text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
