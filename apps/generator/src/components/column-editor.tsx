import { useState } from 'react'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpNarrowWideIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleDashedIcon,
  FingerprintIcon,
  KeyRoundIcon,
  ListPlusIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import type { ColumnDefinition, ColumnType, TableDefinition } from '@/types'
import { Badge, Field, NativeSelect, Section, TextInput } from '@/components/ui'
import { COLUMN_TYPES, columnTypeMeta } from '@/lib/catalog'
import { EnumValueEditor } from '@/components/enum-value-editor'
import {
  AUDIT_COLUMN_NAMES,
  applyColumnType,
  createColumn,
  isQueryableType,
  toCamel,
} from '@/lib/defaults'
import { cn } from '@repo/ui/lib/utils'

function nextFieldName(columns: ColumnDefinition[]) {
  let index = columns.length + 1
  while (columns.some((column) => column.name === `field_${index}`)) {
    index += 1
  }
  return `field_${index}`
}

function typeTitle(isPk: boolean, audit: boolean) {
  if (isPk) return '主键固定为 BIGINT'
  if (audit) return '审计字段由生成器维护'
  return undefined
}

function findDuplicateNames(columns: ColumnDefinition[]) {
  const duplicateNames = new Set<string>()
  const seen = new Set<string>()
  for (const column of columns) {
    if (seen.has(column.name)) duplicateNames.add(column.name)
    seen.add(column.name)
  }
  return duplicateNames
}

/** 应用字段补丁，并按列名变化维护 Java 字段名、按主键状态收敛约束。 */
function patchColumn(
  column: ColumnDefinition,
  patch: Partial<ColumnDefinition>,
): ColumnDefinition {
  const next = { ...column, ...patch }
  if (patch.name != null) {
    const derived = toCamel(patch.name)
    if (
      !column.javaName ||
      column.javaName === toCamel(column.name) ||
      column.javaName === derived
    ) {
      next.javaName = derived
    }
  }
  if (next.primaryKey) {
    next.nullable = false
    next.unique = false
  }
  return next
}

/**
 * 交换字段位置；返回 null 表示当前移动不合法（越界或越过审计字段），
 * 调用方据此跳过更新。
 */
function moveColumn(
  columns: ColumnDefinition[],
  index: number,
  delta: number,
  auditEnabled: boolean,
  auditStartIndex: number,
): ColumnDefinition[] | null {
  const column = columns[index]
  if (!column) return null
  if (auditEnabled && AUDIT_COLUMN_NAMES.includes(column.name)) return null
  const targetIndex = index + delta
  if (targetIndex < 0 || targetIndex >= columns.length) return null
  // 业务字段最多移动到审计字段之前，不能越过审计字段。
  if (
    auditStartIndex >= 0 &&
    index < auditStartIndex &&
    targetIndex >= auditStartIndex
  ) {
    return null
  }
  const next = [...columns]
  const [item] = next.splice(index, 1)
  next.splice(targetIndex, 0, item)
  return next
}

function ConstraintChip({
  checked,
  onChange,
  label,
  hint,
  icon: Icon,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint: string
  icon: LucideIcon
  disabled?: boolean
}) {
  return (
    <label
      title={hint}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 border px-2 py-1 text-[11px] transition-colors select-none',
        checked
          ? 'border-primary/50 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-muted/60',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className={cn(
          'grid size-3.5 place-items-center border',
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background',
        )}
      >
        {checked ? <CheckIcon className="size-2.5" /> : null}
      </span>
      <Icon className="size-3" />
      {label}
    </label>
  )
}

function ColumnCard({
  column,
  index,
  columnCount,
  duplicate,
  auditEnabled,
  auditStartIndex,
  onUpdate,
  onChangeType,
  onSetPrimaryKey,
  onRemove,
  onMove,
}: {
  column: ColumnDefinition
  index: number
  columnCount: number
  duplicate: boolean
  auditEnabled: boolean
  auditStartIndex: number
  onUpdate: (id: string, patch: Partial<ColumnDefinition>) => void
  onChangeType: (id: string, type: ColumnType) => void
  onSetPrimaryKey: (id: string) => void
  onRemove: (id: string) => void
  onMove: (index: number, delta: number) => void
}) {
  const audit = auditEnabled && AUDIT_COLUMN_NAMES.includes(column.name)
  const isPk = column.primaryKey
  const typeMeta = columnTypeMeta(column.type)
  const update = (patch: Partial<ColumnDefinition>) =>
    onUpdate(column.id, patch)

  return (
    <div
      data-column-card={column.id}
      data-audit={audit || undefined}
      className={cn(
        'border border-l-[3px] bg-background/40 p-2 transition-colors',
        duplicate
          ? 'border-destructive/50 border-l-destructive'
          : audit
            ? 'border-border border-l-muted-foreground/50'
            : 'border-border border-l-primary/70',
        audit && 'bg-muted/30',
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-4 border h-6 shrink-0 text-center font- text-[12px] text-muted-foreground">
          {index + 1}
        </span>
        <TextInput
          value={column.name}
          onChange={(event) =>
            update({ name: event.target.value.toLowerCase() })
          }
          className="h-7 min-w-24 max-w-100 flex-1 basis-36 disabled:opacity-60"
          placeholder="column_name"
          disabled={audit}
          title={audit ? '审计字段由生成器维护，不可修改' : undefined}
        />
        <NativeSelect
          value={column.type}
          disabled={isPk || audit}
          title={typeTitle(isPk, audit)}
          onChange={(event) =>
            onChangeType(column.id, event.target.value as ColumnType)
          }
          className="h-7 w-36 shrink-0 disabled:opacity-60"
        >
          {COLUMN_TYPES.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label}
            </option>
          ))}
        </NativeSelect>
        <label
          className={cn(
            'inline-flex shrink-0 items-center gap-1 border border-border px-1.5 py-0.5 text-[10px] select-none',
            isPk && 'border-primary/50 bg-primary/10 text-primary',
          )}
        >
          <input
            type="radio"
            name="generator-primary-key"
            className="size-3 h-5 accent-primary"
            checked={isPk}
            disabled={audit}
            onChange={() => onSetPrimaryKey(column.id)}
          />
          <KeyRoundIcon className="size-3" />
          主键
        </label>
        {audit ? (
          <Badge>
            <LockIcon className="mr-0.5 size-2.5" />
            审计字段
          </Badge>
        ) : null}
        <div className="ml-auto flex items-center gap-0">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="上移"
            disabled={index === 0 || audit}
            title={audit ? '审计字段不可移动' : undefined}
            onClick={() => onMove(index, -1)}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="下移"
            disabled={
              index === columnCount - 1 ||
              audit ||
              (auditStartIndex >= 0 && index === auditStartIndex - 1)
            }
            title={audit ? '审计字段不可移动' : undefined}
            onClick={() => onMove(index, 1)}
          >
            <ArrowDownIcon />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="删除字段"
            className="text-muted-foreground hover:text-destructive"
            disabled={audit}
            title={audit ? '审计字段不可删除' : undefined}
            onClick={() => onRemove(column.id)}
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Field
          label="Java 字段名"
          hint={`${typeMeta.javaType}${column.type === 'enum' ? ` / ${column.enumValues.length} 个枚举值` : ''}`}
        >
          <TextInput
            value={column.javaName}
            onChange={(event) => update({ javaName: event.target.value })}
            className="h-7"
            disabled={isPk || audit}
          />
        </Field>

        {['string', 'enum', 'uuid'].includes(column.type) ? (
          <Field label="长度">
            <TextInput
              type="number"
              min={1}
              max={4000}
              value={column.length ?? ''}
              onChange={(event) =>
                update({ length: Number(event.target.value) || undefined })
              }
              className="h-7"
              disabled={audit}
            />
          </Field>
        ) : column.type === 'decimal' ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="精度">
              <TextInput
                type="number"
                min={1}
                value={column.precision ?? 18}
                onChange={(event) =>
                  update({ precision: Number(event.target.value) || 18 })
                }
                className="h-7"
                disabled={audit}
              />
            </Field>
            <Field label="小数位">
              <TextInput
                type="number"
                min={0}
                value={column.scale ?? 2}
                onChange={(event) =>
                  update({ scale: Number(event.target.value) || 0 })
                }
                className="h-7"
                disabled={audit}
              />
            </Field>
          </div>
        ) : null}

        <Field
          label="默认值"
          hint={['text', 'json'].includes(column.type) ? 'DDL 不输出' : '可选'}
        >
          <TextInput
            value={column.defaultValue}
            onChange={(event) => update({ defaultValue: event.target.value })}
            className="h-7"
            placeholder="可选"
            disabled={isPk || audit}
          />
        </Field>

        <Field label="注释">
          <TextInput
            value={column.comment}
            onChange={(event) => update({ comment: event.target.value })}
            className="h-7"
            placeholder="字段业务含义"
            disabled={audit}
          />
        </Field>

        <div className="sm:col-span-2 xl:col-span-4">
          <div className="flex items-center gap-1.5">
            <ConstraintChip
              label="可空"
              hint="允许为 NULL"
              icon={CircleDashedIcon}
              checked={column.nullable}
              disabled={isPk || audit}
              onChange={(value) => update({ nullable: value })}
            />
            <ConstraintChip
              label="唯一"
              hint="生成唯一约束"
              icon={FingerprintIcon}
              checked={column.unique}
              disabled={isPk || audit}
              onChange={(value) => update({ unique: value })}
            />
            <ConstraintChip
              label="索引/查询"
              hint="生成查询索引，并参与关键字搜索"
              icon={SearchIcon}
              checked={column.queryable}
              disabled={!isQueryableType(column.type) || isPk || audit}
              onChange={(value) => update({ queryable: value })}
            />
            {isPk ? (
              <ConstraintChip
                label="自增"
                hint="使用数据库自增主键"
                icon={ArrowUpNarrowWideIcon}
                checked={column.autoIncrement}
                onChange={(value) => update({ autoIncrement: value })}
              />
            ) : null}
          </div>
        </div>

        {column.type === 'enum' ? (
          <Field
            label="枚举值"
            hint="下拉选择或自定义，值需为合法 Java 标识符"
            className="sm:col-span-2 xl:col-span-4 w-120"
          >
            <EnumValueEditor
              values={column.enumValues}
              descriptions={column.enumDescriptions ?? {}}
              disabled={audit}
              onChange={(enumValues, enumDescriptions) =>
                update({ enumValues, enumDescriptions })
              }
            />
          </Field>
        ) : null}
      </div>

      {duplicate ? (
        <p className="mt-1 text-[10px] text-destructive">
          列名重复：{column.name}
        </p>
      ) : null}
      {column.name === 'id' && !isPk ? (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
          <ListPlusIcon className="size-3" />
          非主键字段不建议命名为 id，会与聚合的 id() 冲突。
        </p>
      ) : null}
    </div>
  )
}

export function ColumnEditor({
  draft,
  onColumnsChange,
  embedded = false,
  title = '主表字段设计',
  description = '主键固定为 BIGINT（雪花 ID）；审计字段由生成器维护。',
  collapsed: controlledCollapsed,
  onCollapsedChange,
  defaultCollapsed = false,
}: {
  draft: TableDefinition
  onColumnsChange: (columns: ColumnDefinition[]) => void
  embedded?: boolean
  title?: string
  description?: string
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  defaultCollapsed?: boolean
}) {
  const columns = draft.columns
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed)
  const collapsed = controlledCollapsed ?? internalCollapsed
  const updateCollapsed = (value: boolean) => {
    if (controlledCollapsed !== undefined) onCollapsedChange?.(value)
    else setInternalCollapsed(value)
  }
  const duplicateNames = findDuplicateNames(columns)
  const pkCount = columns.filter((column) => column.primaryKey).length
  const auditEnabled = draft.options.audit
  const auditStartIndex = auditEnabled
    ? columns.findIndex((column) => AUDIT_COLUMN_NAMES.includes(column.name))
    : -1

  const isAuditColumn = (column: ColumnDefinition) =>
    auditEnabled && AUDIT_COLUMN_NAMES.includes(column.name)

  const isLockedAudit = (id: string) => {
    const target = columns.find((column) => column.id === id)
    return Boolean(target && isAuditColumn(target))
  }

  const update = (id: string, patch: Partial<ColumnDefinition>) => {
    if (isLockedAudit(id)) return
    onColumnsChange(
      columns.map((column) =>
        column.id === id ? patchColumn(column, patch) : column,
      ),
    )
  }

  const changeType = (id: string, type: ColumnType) => {
    if (isLockedAudit(id)) return
    onColumnsChange(
      columns.map((column) =>
        column.id === id ? applyColumnType(column, type) : column,
      ),
    )
  }

  const setPrimaryKey = (id: string) => {
    if (isLockedAudit(id)) return
    onColumnsChange(
      columns.map((column) => {
        if (column.id === id) {
          return {
            ...column,
            primaryKey: true,
            nullable: false,
            unique: false,
            type: 'long' as ColumnType,
            length: undefined,
            precision: undefined,
            scale: undefined,
            queryable: false,
          }
        }
        return column.primaryKey
          ? { ...column, primaryKey: false, autoIncrement: false }
          : column
      }),
    )
  }

  const addColumn = () => {
    updateCollapsed(false)
    const name = nextFieldName(columns)
    const nextColumn = createColumn(columns.length, 'string', {
      name,
      javaName: toCamel(name),
      label: name,
    })
    // 审计字段固定在末尾，新字段插入到审计字段之前。
    const next = [...columns]
    if (auditStartIndex >= 0) next.splice(auditStartIndex, 0, nextColumn)
    else next.push(nextColumn)
    onColumnsChange(next)
  }

  const removeColumn = (id: string) => {
    if (isLockedAudit(id)) return
    onColumnsChange(columns.filter((column) => column.id !== id))
  }

  const move = (index: number, delta: number) => {
    const next = moveColumn(
      columns,
      index,
      delta,
      auditEnabled,
      auditStartIndex,
    )
    if (next) onColumnsChange(next)
  }

  const collapseLabel = collapsed ? '展开字段' : '收起字段'
  const collapseTitle = columns.length === 0 ? '暂无可收起字段' : collapseLabel

  const action = (
    <div className="flex items-center gap-1">
      <Badge tone={pkCount === 1 ? 'success' : 'warning'}>
        {pkCount === 1 ? '主键就绪' : `主键 ${pkCount} 个`}
      </Badge>
      <Button size="xs" variant="outline" onClick={addColumn}>
        <PlusIcon data-icon="inline-start" />
        添加字段
      </Button>
      <Button
        size="icon-xs"
        variant="outline"
        aria-expanded={!collapsed}
        aria-label={collapseLabel}
        title={collapseTitle}
        disabled={columns.length === 0}
        onClick={() => updateCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
      </Button>
    </div>
  )

  const body = (
    <>
      {collapsed ? (
        <button
          type="button"
          onClick={() => updateCollapsed(false)}
          className="flex w-full items-center justify-between border border-dashed border-border px-2 py-2 text-left text-[10px] text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <span>已收起 {columns.length} 个字段</span>
          <span className="inline-flex items-center gap-1">
            展开
            <ChevronDownIcon className="size-3" />
          </span>
        </button>
      ) : (
        <div className="space-y-2">
          {columns.map((column, index) => (
            <ColumnCard
              key={column.id}
              column={column}
              index={index}
              columnCount={columns.length}
              duplicate={duplicateNames.has(column.name)}
              auditEnabled={auditEnabled}
              auditStartIndex={auditStartIndex}
              onUpdate={update}
              onChangeType={changeType}
              onSetPrimaryKey={setPrimaryKey}
              onRemove={removeColumn}
              onMove={move}
            />
          ))}

          {columns.length === 0 ? (
            <div className="grid min-h-24 place-items-center border border-dashed border-border">
              <Button size="sm" variant="outline" onClick={addColumn}>
                <PlusIcon data-icon="inline-start" />
                添加第一个字段
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </>
  )

  if (embedded) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {action}
        </div>
        {body}
      </div>
    )
  }

  return (
    <Section title={title} description={description} action={action}>
      {body}
    </Section>
  )
}
