import { FolderDownIcon, PackageIcon, type LucideIcon } from 'lucide-react'
import type {
  AppConfig,
  Dialect,
  GeneratorOptions,
  OutputMode,
  TableDefinition,
} from '@/types'
import { Badge, Field, Section, TextInput, Toggle } from '@/components/ui'
import { DIALECTS } from '@/lib/catalog'
import { cn } from '@repo/ui/lib/utils'

function resolvePath(base: string, value: string) {
  if (value.startsWith('/')) return value
  const stack: string[] = []
  for (const part of `${base}/${value}`.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') {
      stack.pop()
    } else {
      stack.push(part)
    }
  }
  return `/${stack.join('/')}`
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 border border-border px-2 py-1.5">
      <div>
        <p className="text-[12px] font-medium">{title}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
      <Toggle label={title} checked={checked} onChange={onChange} />
    </div>
  )
}

function PathField({
  label,
  value,
  resolved,
  placeholder,
  onChange,
  onReset,
}: {
  label: string
  value: string
  resolved: string
  placeholder: string
  onChange: (value: string) => void
  onReset?: () => void
}) {
  return (
    <>
      <Field
        label={label}
        hint={value.startsWith('/') ? '绝对路径' : '相对生成器目录'}
      >
        <TextInput
          mono
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </Field>
      <div className="bg-muted/50 px-2 py-1.5 text-[10px] text-muted-foreground">
        解析为：
        <span className="break-all font-mono">{resolved}</span>
        {onReset ? (
          <button
            type="button"
            className="ml-2 text-primary hover:underline"
            onClick={onReset}
          >
            恢复默认
          </button>
        ) : null}
      </div>
    </>
  )
}

function OutputModeCard({
  value,
  title,
  description,
  icon: Icon,
  active,
  onSelect,
}: {
  value: OutputMode
  title: string
  description: string
  icon: LucideIcon
  active: boolean
  onSelect: (value: OutputMode) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'rounded-xl border p-2.5 text-left transition-colors',
        active
          ? 'border-primary/50 bg-primary/5'
          : 'border-border hover:bg-muted/50',
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-[12px] font-medium">{title}</span>
        {active ? <Badge tone="primary">当前</Badge> : null}
      </div>
      <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </button>
  )
}

const OUTPUT_MODES = [
  {
    value: 'zip',
    title: 'ZIP 下载',
    description: '浏览器下载打包文件，解压到工程根目录。',
    icon: PackageIcon,
  },
  {
    value: 'disk',
    title: '写入工程',
    description: '按下方目录直接写文件，返回 created / updated。',
    icon: FolderDownIcon,
  },
] as const satisfies readonly {
  value: OutputMode
  title: string
  description: string
  icon: LucideIcon
}[]

function DialectToggles({
  selected,
  disabled,
  onToggle,
}: {
  selected: Dialect[]
  disabled: boolean
  onToggle: (dialect: Dialect, checked: boolean) => void
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-1.5',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      {DIALECTS.map((dialect) => (
        <label
          key={dialect.key}
          className="flex items-center gap-1.5 border border-border px-2 py-1.5 text-[10px]"
        >
          <input
            type="checkbox"
            className="size-3 accent-primary"
            checked={selected.includes(dialect.key)}
            onChange={(event) => onToggle(dialect.key, event.target.checked)}
          />
          {dialect.label}
        </label>
      ))}
    </div>
  )
}

export function GenerationForm({
  draft,
  config,
  onOptionsChange,
}: {
  draft: TableDefinition
  config: AppConfig | null
  onOptionsChange: (patch: Partial<GeneratorOptions>) => void
}) {
  const options = draft.options
  const resolvedDirectory =
    config && !options.outputDirectory.startsWith('/')
      ? resolvePath(config.appRoot, options.outputDirectory)
      : options.outputDirectory
  const resolvedFrontendDirectory =
    config && !options.frontendDirectory.startsWith('/')
      ? resolvePath(config.appRoot, options.frontendDirectory)
      : options.frontendDirectory

  const toggleDialect = (dialect: Dialect, checked: boolean) => {
    const next = checked
      ? [...new Set([...options.dialects, dialect])]
      : options.dialects.filter((item) => item !== dialect)
    onOptionsChange({ dialects: next })
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Section
        title="输出方式"
        description="ZIP 适合交付与审阅；磁盘写入适合直接进后端工程编译。"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {OUTPUT_MODES.map((item) => (
            <OutputModeCard
              key={item.value}
              value={item.value}
              title={item.title}
              description={item.description}
              icon={item.icon}
              active={options.outputMode === item.value}
              onSelect={(value) => onOptionsChange({ outputMode: value })}
            />
          ))}
        </div>

        <div className="mt-3 grid gap-2.5">
          <PathField
            label="后端工程目录"
            value={options.outputDirectory}
            resolved={resolvedDirectory}
            placeholder="../../../ddd-springboot"
            onChange={(value) => onOptionsChange({ outputDirectory: value })}
            onReset={
              config
                ? () =>
                    onOptionsChange({
                      outputDirectory: config.outputDirectory,
                    })
                : undefined
            }
          />

          <PathField
            label="前端工程目录"
            value={options.frontendDirectory}
            resolved={resolvedFrontendDirectory}
            placeholder="../playground/src/pages"
            onChange={(value) => onOptionsChange({ frontendDirectory: value })}
            onReset={
              config
                ? () =>
                    onOptionsChange({
                      frontendDirectory: config.frontendDirectory,
                    })
                : undefined
            }
          />
        </div>
      </Section>

      <Section
        title="生成内容"
        description="关闭某项只会跳过对应模板；SQL 方言可多选。"
      >
        <div className="space-y-2.5">
          <ToggleRow
            title="生成建表 SQL"
            description="输出到 db/generated/<dialect>/ 目录"
            checked={options.generateSql}
            onChange={(value) => onOptionsChange({ generateSql: value })}
          />

          <DialectToggles
            selected={options.dialects}
            disabled={!options.generateSql}
            onToggle={toggleDialect}
          />
          {options.dialects.length === 0 ? (
            <p className="text-[10px] text-destructive">
              至少选择一种方言，否则保存时校验失败。
            </p>
          ) : null}

          <ToggleRow
            title="前端 CRUD 页面"
            description="输出到 frontend/：类型、API、列表、新增/编辑表单"
            checked={options.generateFrontend}
            onChange={(value) => onOptionsChange({ generateFrontend: value })}
          />

          <ToggleRow
            title="Spring Security 注解"
            description="生成 @PreAuthorize，权限前缀见下"
            checked={options.security}
            onChange={(value) => onOptionsChange({ security: value })}
          />
          {options.security ? (
            <Field
              label="权限前缀"
              hint="实际权限 = 前缀:query/create/update/delete"
            >
              <TextInput
                mono
                value={options.permissionPrefix}
                onChange={(event) =>
                  onOptionsChange({ permissionPrefix: event.target.value })
                }
                placeholder={`system:${draft.module}`}
              />
            </Field>
          ) : null}

          <ToggleRow
            title="审计字段"
            description="自动补齐创建部门/创建人/时间/更新人；创建信息仅参与创建，更新人仅参与更新"
            checked={options.audit}
            onChange={(value) => onOptionsChange({ audit: value })}
          />

          <div className="border border-dashed border-border px-2 py-1.5 text-[10px] text-muted-foreground">
            依赖目标工程已有的共享基座（PageQuery / PageResult / PageDTO /
            Loaders / DomainEventPublisher / PageResults
            等），生成器不会重复覆盖。
          </div>
        </div>
      </Section>
    </div>
  )
}
