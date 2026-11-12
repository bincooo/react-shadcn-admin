import { Textarea } from '@repo/ui/components/textarea'
import type { TableDefinition } from '@/types'
import { Badge, Field, Section, TextInput } from '@/components/ui'
import {
  entityToRoute,
  normalizeTableName,
  sanitizeEntityName,
  toCamel,
  toPascal,
  toSnake,
} from '@/lib/defaults'

function lowerFirst(value: string) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value
}

export function MetaForm({
  draft,
  onChange,
}: {
  draft: TableDefinition
  onChange: (patch: Partial<TableDefinition>) => void
}) {
  const route = entityToRoute(draft.entityName || 'table')
  const module = draft.module || toCamel(draft.entityName)

  const handleTableName = (raw: string) => {
    const name = normalizeTableName(raw)
    const oldEntity = draft.entityName
    const patch: Partial<TableDefinition> = { name }
    if (!oldEntity || oldEntity === toPascal(draft.name)) {
      patch.entityName = toPascal(name)
    }
    if (!draft.module || draft.module === lowerFirst(oldEntity)) {
      patch.module = lowerFirst(patch.entityName ?? oldEntity)
    }
    onChange(patch)
  }

  const handleEntityName = (raw: string) => {
    const entityName = sanitizeEntityName(raw)
    const patch: Partial<TableDefinition> = { entityName }
    if (!draft.module || draft.module === lowerFirst(draft.entityName)) {
      patch.module = lowerFirst(entityName)
    }
    onChange(patch)
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <Section
        title="基础信息"
        description="表名决定数据库物理表，实体名决定 Java 类名。"
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Field label="显示名称">
            <TextInput
              value={draft.displayName}
              onChange={(event) =>
                onChange({ displayName: event.target.value })
              }
              placeholder="订单"
            />
          </Field>
          <Field label="数据库表名" hint="小写蛇形">
            <TextInput
              mono
              value={draft.name}
              onChange={(event) => handleTableName(event.target.value)}
              placeholder="sys_order"
            />
          </Field>
          <Field label="实体类名" hint="PascalCase">
            <TextInput
              mono
              value={draft.entityName}
              onChange={(event) => handleEntityName(event.target.value)}
              placeholder="Order"
            />
          </Field>
          <Field label="模块名" hint="Java 包路径片段">
            <TextInput
              mono
              value={draft.module}
              onChange={(event) => onChange({ module: event.target.value })}
              placeholder="order"
            />
          </Field>
          <Field
            label="基础包名"
            hint="与目标后端工程一致"
            className="sm:col-span-2"
          >
            <TextInput
              mono
              value={draft.basePackage}
              onChange={(event) =>
                onChange({ basePackage: event.target.value })
              }
              placeholder="com.example.ddd"
            />
          </Field>
          <Field label="表注释" className="sm:col-span-2">
            <Textarea
              value={draft.comment}
              onChange={(event) => onChange({ comment: event.target.value })}
              placeholder="订单主表"
              className="min-h-14 md:text-[12px]"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="生成坐标"
        description="下列路径由表名与基础包实时推导，保存前可反复调整。"
      >
        <dl className="space-y-2 text-[10px]">
          {[
            ['REST 路由', `/api/${route}`],
            ['聚合包', `${draft.basePackage}.domain.${module}.model`],
            ['仓储端口', `${draft.basePackage}.domain.${module}.repository`],
            ['应用服务', `${draft.basePackage}.application.${module}.service`],
            [
              'REST 控制器',
              `${draft.basePackage}.interfaces.web.${module}.controller`,
            ],
          ].map(([label, value]) => (
            <div key={label} className="space-y-0.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-all bg-muted/60 px-1.5 py-1 font-mono text-[12px] leading-relaxed">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex flex-wrap gap-1">
          <Badge>{toSnake(draft.entityName || 'entity')}</Badge>
          <Badge tone="primary">{draft.columns.length} 个字段</Badge>
          {draft.columns.find((column) => column.primaryKey) ? (
            <Badge tone="success">雪花主键</Badge>
          ) : (
            <Badge tone="warning">缺少主键</Badge>
          )}
        </div>
      </Section>
    </div>
  )
}
