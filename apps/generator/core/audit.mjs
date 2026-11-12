/**
 * 审计字段的统一维护逻辑：补齐、重置、排序。
 *
 * 生成侧（core/definition.mjs）与设计页（src/lib/defaults.ts）共用同一套规则，
 * 差异只有一处并显式暴露：生成侧完全接管审计字段（resetAll），
 * 设计页则保留用户已填的 comment / label 等展示信息。
 */
import { AUDIT_COLUMN_DEFS } from './constants.mjs'
import { createId } from './ids.mjs'
import { toCamel } from './naming.mjs'

/** 审计字段中由生成器/页面统一接管的字段 */
const STRUCTURAL_FIELDS = [
  'type',
  'length',
  'precision',
  'scale',
  'nullable',
  'primaryKey',
  'unique',
  'queryable',
  'javaName',
]

/** 按审计定义构造一个完整列 */
export function createAuditColumn(definition) {
  return {
    id: createId(),
    name: definition.name,
    javaName: toCamel(definition.name),
    label: definition.label,
    type: definition.type,
    length: definition.length,
    precision: undefined,
    scale: undefined,
    nullable: definition.nullable,
    primaryKey: false,
    unique: false,
    autoIncrement: false,
    queryable: false,
    jsonString: false,
    enumValues: [],
    enumDescriptions: {},
    comment: definition.label,
    defaultValue: '',
  }
}

function auditDefsFor(includeCreatedDept) {
  return includeCreatedDept
    ? AUDIT_COLUMN_DEFS
    : AUDIT_COLUMN_DEFS.filter((def) => def.name !== 'created_dept')
}

/**
 * 补齐审计字段并统一排到业务字段之后。
 *
 * @param columns 列定义
 * @param enabled 是否启用审计字段
 * @param options.includeCreatedDept 明细表为 false（不生成 created_dept）
 * @param options.resetAll true 时审计字段完全覆盖已有列（生成侧）；
 *                         false 时保留用户已填的 comment / label（设计页）
 */
export function ensureAuditColumns(
  columns,
  enabled,
  { includeCreatedDept = true, resetAll = false } = {},
) {
  const defs = auditDefsFor(includeCreatedDept)
  let result = columns.map((column) => ({ ...column }))

  if (!includeCreatedDept) {
    result = result.filter((column) => column.name !== 'created_dept')
  }
  if (!enabled) return result

  for (const def of defs) {
    const audit = createAuditColumn(def)
    const existing = result.find((column) => column.name === audit.name)
    if (!existing) {
      result.push(audit)
      continue
    }
    if (resetAll) {
      // 审计字段由生成器完全接管，外部传入的展示/类型配置一律忽略。
      Object.assign(existing, audit, { id: existing.id })
      continue
    }
    for (const key of STRUCTURAL_FIELDS) existing[key] = audit[key]
    if (!existing.comment) existing.comment = audit.comment
    if (!existing.label || existing.label === existing.name) {
      existing.label = audit.label
    }
  }

  const auditNames = new Set(defs.map((def) => def.name))
  const businessColumns = result.filter(
    (column) => !auditNames.has(column.name),
  )
  const auditColumns = defs
    .map((def) => result.find((column) => column.name === def.name))
    .filter(Boolean)
  return [...businessColumns, ...auditColumns]
}
