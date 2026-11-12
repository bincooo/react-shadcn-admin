import { useState } from 'react'
import {
  AlertTriangleIcon,
  LayersIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { Button } from '@repo/ui/components/button'
import type { DetailTableDefinition, TableDefinition } from '@/types'
import { Badge, Field, TextInput } from '@/components/ui'
import { ColumnEditor } from '@/components/column-editor'
import {
  createDetailTable,
  normalizeTableName,
  sanitizeEntityName,
  toPascal,
} from '@/lib/defaults'

/** 收集重复出现的名称（出现两次及以上）。 */
function collectDuplicates(names: string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const name of names) {
    if (seen.has(name)) duplicates.add(name)
    seen.add(name)
  }
  return duplicates
}

function validationMessage(
  detail: DetailTableDefinition,
  draft: TableDefinition,
  duplicateTableNames: Set<string>,
  duplicateEntityNames: Set<string>,
) {
  const duplicateTable =
    draft.name === detail.name || duplicateTableNames.has(detail.name)
  const duplicateEntity =
    draft.entityName === detail.entityName ||
    duplicateEntityNames.has(detail.entityName)
  if (duplicateTable) {
    return `明细表名与主表或其他明细重复：${detail.name}`
  }
  if (duplicateEntity) {
    return `实体名与主表或其他明细重复：${detail.entityName}`
  }
  if (!detail.name || !detail.entityName) {
    return '请填写合法的明细表名与实体名'
  }
  return null
}

function DetailCard({
  detail,
  index,
  draft,
  expanded,
  duplicateTableNames,
  duplicateEntityNames,
  onToggle,
  onUpdate,
  onRemove,
}: {
  detail: DetailTableDefinition
  index: number
  draft: TableDefinition
  expanded: boolean
  duplicateTableNames: Set<string>
  duplicateEntityNames: Set<string>
  onToggle: (collapsed: boolean) => void
  onUpdate: (id: string, patch: Partial<DetailTableDefinition>) => void
  onRemove: (id: string) => void
}) {
  const invalidMessage = validationMessage(
    detail,
    draft,
    duplicateTableNames,
    duplicateEntityNames,
  )

  return (
    <div data-detail-card={detail.id} className="border bg-background/40">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-2.5 py-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">
            {index + 1}
          </span>
          <h3 className="truncate text-[12px] font-semibold">
            {detail.displayName || detail.entityName || '未命名明细表'}
          </h3>
          <Badge>{detail.columns.length} 列</Badge>
          <Badge tone="muted">{detail.name || '待填写表名'}</Badge>
          <Badge tone="muted">{detail.entityName || '待填写实体'}</Badge>
          <span className="text-[9px] text-muted-foreground">
            继承模块 {draft.module} / {draft.basePackage}
          </span>
        </div>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`删除明细表 ${detail.displayName || index + 1}`}
          title="删除明细表"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(detail.id)}
        >
          <Trash2Icon />
        </Button>
      </header>

      <div className="space-y-2 p-2">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="显示名称">
            <TextInput
              value={detail.displayName}
              onChange={(event) =>
                onUpdate(detail.id, { displayName: event.target.value })
              }
              placeholder={`${draft.displayName}明细`}
              className="h-7"
            />
          </Field>
          <Field label="数据库表名" hint="小写蛇形">
            <TextInput
              mono
              value={detail.name}
              onChange={(event) => {
                const name = normalizeTableName(event.target.value)
                const patch: Partial<DetailTableDefinition> = { name }
                if (
                  !detail.entityName ||
                  detail.entityName === toPascal(detail.name)
                ) {
                  patch.entityName = toPascal(name)
                }
                onUpdate(detail.id, patch)
              }}
              placeholder={`${draft.name}_item`}
              className="h-7"
            />
          </Field>
          <Field label="实体类名" hint="PascalCase">
            <TextInput
              mono
              value={detail.entityName}
              onChange={(event) =>
                onUpdate(detail.id, {
                  entityName: sanitizeEntityName(event.target.value),
                })
              }
              placeholder={`${draft.entityName}Item`}
              className="h-7"
            />
          </Field>
          <Field label="表注释">
            <TextInput
              value={detail.comment}
              onChange={(event) =>
                onUpdate(detail.id, { comment: event.target.value })
              }
              placeholder={`${draft.displayName}明细表`}
              className="h-7"
            />
          </Field>
        </div>

        {invalidMessage ? (
          <p className="flex items-center gap-1 text-[10px] text-destructive">
            <AlertTriangleIcon className="size-3" />
            {invalidMessage}
          </p>
        ) : null}

        <ColumnEditor
          embedded
          collapsed={!expanded}
          onCollapsedChange={onToggle}
          draft={{ ...draft, columns: detail.columns }}
          onColumnsChange={(columns) => onUpdate(detail.id, { columns })}
        />
      </div>
    </div>
  )
}

export function DetailTablesEditor({
  draft,
  onChange,
}: {
  draft: TableDefinition
  onChange: (details: DetailTableDefinition[]) => void
}) {
  const details = draft.detailTables ?? []
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const duplicateTableNames = collectDuplicates(details.map((d) => d.name))
  const duplicateEntityNames = collectDuplicates(
    details.map((d) => d.entityName),
  )

  const addDetail = () => {
    const detail = createDetailTable(draft, details)
    onChange([...details, detail])
    setExpandedId(detail.id)
  }

  const updateDetail = (id: string, patch: Partial<DetailTableDefinition>) => {
    onChange(
      details.map((detail) =>
        detail.id === id ? { ...detail, ...patch } : detail,
      ),
    )
  }

  const removeDetail = (id: string) => {
    const detail = details.find((item) => item.id === id)
    if (!detail) return
    if (
      !window.confirm(
        `确定删除明细表「${detail.displayName || detail.entityName}」吗？尚未保存前只影响当前草稿。`,
      )
    ) {
      return
    }
    onChange(details.filter((item) => item.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold">明细表字段设计</h2>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            一个主表可配置多个明细表；生成时按同模块的独立实体输出，默认带主表关联字段。
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Badge tone={details.length > 0 ? 'primary' : 'muted'}>
            {details.length} 个明细表
          </Badge>
          <Button size="xs" variant="outline" onClick={addDetail}>
            <PlusIcon data-icon="inline-start" />
            添加明细表
          </Button>
        </div>
      </div>
      {details.length === 0 ? (
        <button
          type="button"
          onClick={addDetail}
          className="flex w-full flex-col items-center gap-1 border border-dashed border-border px-3 py-5 text-[10px] text-muted-foreground transition-colors hover:bg-muted/40"
        >
          <LayersIcon className="size-5" />
          <span>暂无明细表，点击添加第一个明细表</span>
        </button>
      ) : (
        <div className="space-y-2.5">
          {details.map((detail, index) => (
            <DetailCard
              key={detail.id}
              detail={detail}
              index={index}
              draft={draft}
              expanded={expandedId === detail.id}
              duplicateTableNames={duplicateTableNames}
              duplicateEntityNames={duplicateEntityNames}
              onToggle={(collapsed) =>
                setExpandedId(collapsed ? null : detail.id)
              }
              onUpdate={updateDetail}
              onRemove={removeDetail}
            />
          ))}
        </div>
      )}
    </div>
  )
}
