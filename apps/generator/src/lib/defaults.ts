import {
  AUDIT_COLUMN_NAMES,
  QUERYABLE_COLUMN_TYPES,
} from '../../core/constants.mjs'
import { ensureAuditColumns as ensureAuditColumnsCore } from '../../core/audit.mjs'
import { createDefaultDefinition } from '../../core/definition.mjs'
import {
  entityToRoute,
  toCamel,
  toPascal,
  toSnake,
} from '../../core/naming.mjs'
import type {
  ColumnDefinition,
  ColumnType,
  DetailTableDefinition,
  TableDefinition,
} from '@/types'
import { columnTypeMeta } from '@/lib/catalog'

export { AUDIT_COLUMN_NAMES, entityToRoute, toCamel, toPascal, toSnake }

/** 小写蛇形表名：空格 / 连字符统一转下划线 */
export function normalizeTableName(raw: string): string {
  return raw.toLowerCase().replace(/[-\s]+/g, '_')
}

/** PascalCase 实体名：只保留字母数字，并首字母大写 */
export function sanitizeEntityName(raw: string): string {
  const sanitized = raw.replace(/[^A-Za-z0-9]/g, '')
  return sanitized ? sanitized.charAt(0).toUpperCase() + sanitized.slice(1) : ''
}

export function isQueryableType(type: ColumnType): boolean {
  return QUERYABLE_COLUMN_TYPES.includes(type)
}

function nextId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `col_${Date.now()}_${Math.random()}`
  )
}

export function createColumn(
  index: number,
  type: ColumnType = 'string',
  overrides: Partial<ColumnDefinition> = {},
): ColumnDefinition {
  const meta = columnTypeMeta(type)
  const name = overrides.name ?? `field_${index + 1}`
  return {
    id: nextId(),
    name,
    javaName: overrides.javaName ?? toCamel(name),
    label: overrides.label ?? name,
    type,
    length: overrides.length ?? meta.defaultLength,
    precision: overrides.precision ?? meta.defaultPrecision,
    scale: overrides.scale ?? meta.defaultScale,
    nullable: overrides.nullable ?? true,
    primaryKey: overrides.primaryKey ?? false,
    unique: overrides.unique ?? false,
    autoIncrement: overrides.autoIncrement ?? false,
    queryable: overrides.queryable ?? isQueryableType(type),
    jsonString: overrides.jsonString ?? false,
    enumValues:
      overrides.enumValues ?? (type === 'enum' ? ['ENABLED', 'DISABLED'] : []),
    enumDescriptions:
      overrides.enumDescriptions ??
      (type === 'enum' ? { ENABLED: '启用', DISABLED: '禁用' } : {}),
    comment: overrides.comment ?? '',
    defaultValue: overrides.defaultValue ?? '',
  }
}

export function applyColumnType(
  column: ColumnDefinition,
  type: ColumnType,
): ColumnDefinition {
  const meta = columnTypeMeta(type)
  return {
    ...column,
    type,
    length: meta.defaultLength,
    precision: meta.defaultPrecision,
    scale: meta.defaultScale,
    queryable: isQueryableType(type) ? column.queryable : false,
    enumValues:
      type === 'enum' && column.enumValues.length === 0
        ? ['ENABLED', 'DISABLED']
        : column.enumValues,
    enumDescriptions:
      type === 'enum' && column.enumValues.length === 0
        ? { ENABLED: '启用', DISABLED: '禁用' }
        : column.enumDescriptions,
    primaryKey: type === 'long' ? column.primaryKey : false,
  }
}

/** 补齐审计字段；保留用户已填的 comment / label（生成侧则完全接管）。 */
export function ensureAuditColumns(
  columns: ColumnDefinition[],
  enabled: boolean,
  includeCreatedDept = true,
): ColumnDefinition[] {
  return ensureAuditColumnsCore(columns, enabled, {
    includeCreatedDept,
    resetAll: false,
  }) as ColumnDefinition[]
}

export function createDetailTable(
  draft: TableDefinition,
  details: DetailTableDefinition[],
): DetailTableDefinition {
  const usedTableNames = new Set([
    draft.name,
    ...details.map((item) => item.name),
  ])
  const usedEntityNames = new Set([
    draft.entityName,
    ...details.map((item) => item.entityName),
  ])

  let index = 1
  let name = `${draft.name}_item`
  let entityName = `${draft.entityName}Item`
  while (usedTableNames.has(name) || usedEntityNames.has(entityName)) {
    index += 1
    name = `${draft.name}_item_${index}`
    entityName = `${draft.entityName}Item${index}`
  }

  const mainEntity = toSnake(draft.entityName || draft.name)
  const foreignKey = `${mainEntity}_id`
  // 只保留结构字段（主键 + 主表关联），业务字段由使用方按实际明细语义添加，
  // 避免默认带出与具体主表强耦合的字段（如数量 / 单价 / 备注）。
  const columns: ColumnDefinition[] = [
    createColumn(0, 'long', {
      name: 'id',
      javaName: 'id',
      label: '主键',
      nullable: false,
      primaryKey: true,
      queryable: false,
      comment: '主键 ID（雪花算法）',
    }),
    createColumn(1, 'long', {
      name: foreignKey,
      javaName: toCamel(foreignKey),
      label: '主表ID',
      nullable: false,
      queryable: true,
      comment: '主表ID',
    }),
  ]

  const now = new Date().toISOString()
  return {
    id: nextId(),
    name,
    entityName,
    displayName: `${draft.displayName}明细${index > 1 ? ` ${index}` : ''}`,
    comment: `${draft.displayName}明细表`,
    columns: ensureAuditColumns(columns, draft.options.audit, false),
    createdAt: now,
    updatedAt: now,
  }
}

export function createDraft(): TableDefinition {
  return createDefaultDefinition() as TableDefinition
}
