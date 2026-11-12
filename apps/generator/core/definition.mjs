/**
 * 表定义归一化与校验。
 *
 * 页面、CLI、HTTP 中间件都先把输入收敛到同一份定义结构，再交给代码生成器。
 * JSONL 每一行保存一份完整快照；归一化保证历史数据也能被安全读取。
 */
import {
  COLUMN_TYPE_KEYS,
  COLUMN_TYPES,
  DEFAULT_OPTIONS,
  DIALECT_KEYS,
  ENTITY_NAME_PATTERN,
  JAVA_IDENTIFIER_PATTERN,
  MODULE_NAME_PATTERN,
  PACKAGE_NAME_PATTERN,
  QUERYABLE_COLUMN_TYPES,
  TABLE_NAME_PATTERN,
} from './constants.mjs'
import { ensureAuditColumns } from './audit.mjs'
import { GeneratorError } from './errors.mjs'
import { createId } from './ids.mjs'
import { toJavaIdentifier, toPascal, toSnake } from './naming.mjs'

const TYPE_META = new Map(COLUMN_TYPES.map((item) => [item.key, item]))
const OUTPUT_MODES = ['zip', 'disk']
const NUMERIC_TYPES = ['integer', 'long', 'decimal']

function text(value, fallback = '') {
  return value == null ? fallback : String(value).trim()
}

function boolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function int(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function normalizeEnumValues(value) {
  const list = Array.isArray(value)
    ? value
    : String(value ?? '').split(/[,|，\n]/)
  const values = []
  const descriptions = {}
  for (const item of list) {
    const isObject = item != null && typeof item === 'object'
    const candidate = text(
      isObject ? (item.value ?? item.name ?? item.code) : item,
    )
    if (!candidate) continue
    if (!JAVA_IDENTIFIER_PATTERN.test(candidate)) {
      throw new GeneratorError(`枚举值不是合法 Java 标识符: ${candidate}`)
    }
    if (!values.includes(candidate)) values.push(candidate)
    const description = isObject
      ? text(item.description ?? item.label ?? item.comment)
      : ''
    if (description && !descriptions[candidate]) {
      descriptions[candidate] = description
    }
  }
  return { values, descriptions }
}

function normalizeEnumDescriptions(raw, values, seed = {}) {
  const result = {}
  for (const value of values) {
    if (seed[value]) result[value] = seed[value]
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const value of values) {
      const description = text(raw[value])
      if (description) result[value] = description
    }
  }
  return result
}

function defaultLength(type) {
  return TYPE_META.get(type)?.defaultLength
}

function normalizeColumn(raw, index, issues) {
  const column = raw && typeof raw === 'object' ? { ...raw } : {}
  const name = text(column.name).toLowerCase()
  // 校验消息里的字段标识：优先列名，缺失时退回序号
  const fieldRef = name || index + 1
  if (!TABLE_NAME_PATTERN.test(name)) {
    issues.push(
      `第 ${index + 1} 个字段的列名非法（需小写蛇形）: ${name || '(空)'}`,
    )
  }
  const type = text(column.type, 'string')
  if (!COLUMN_TYPE_KEYS.includes(type)) {
    issues.push(`字段 ${fieldRef} 的类型不受支持: ${type}`)
  }
  const primaryKey = boolean(column.primaryKey)
  const nullable = primaryKey ? false : boolean(column.nullable, true)
  const enumMeta = normalizeEnumValues(column.enumValues)
  const enumValues = enumMeta.values
  const enumDescriptions = normalizeEnumDescriptions(
    column.enumDescriptions,
    enumValues,
    enumMeta.descriptions,
  )
  if (type === 'enum' && enumValues.length === 0) {
    issues.push(`枚举字段 ${fieldRef} 至少需要一个枚举值`)
  }

  let javaName = text(column.javaName)
  if (javaName && !JAVA_IDENTIFIER_PATTERN.test(javaName)) {
    issues.push(`字段 ${fieldRef} 的 Java 名非法: ${javaName}`)
    javaName = ''
  }
  if (!javaName) javaName = toJavaIdentifier(name || `field${index + 1}`)

  const hasLength = type === 'string' || type === 'enum' || type === 'uuid'
  const length = hasLength
    ? clamp(int(column.length, defaultLength(type)), 1, 4000)
    : undefined
  const precision =
    type === 'decimal' ? clamp(int(column.precision, 18), 1, 65) : undefined
  const scale =
    type === 'decimal'
      ? clamp(int(column.scale, 2), 0, precision - 1)
      : undefined

  const defaultValue = text(column.defaultValue)
  if (
    NUMERIC_TYPES.includes(type) &&
    defaultValue &&
    !/^-?\d+(\.\d+)?$/.test(defaultValue)
  ) {
    issues.push(`字段 ${fieldRef} 的默认值必须是数字: ${defaultValue}`)
  }
  if (
    type === 'boolean' &&
    defaultValue &&
    !['true', 'false', '1', '0'].includes(defaultValue.toLowerCase())
  ) {
    issues.push(
      `字段 ${fieldRef} 的布尔默认值只能是 true/false/1/0: ${defaultValue}`,
    )
  }

  return {
    id: text(column.id) || createId(),
    name,
    javaName,
    label: text(column.label) || text(column.comment) || name,
    type: COLUMN_TYPE_KEYS.includes(type) ? type : 'string',
    length,
    precision,
    scale,
    nullable,
    primaryKey,
    unique: boolean(column.unique) && !primaryKey,
    autoIncrement: boolean(column.autoIncrement) && primaryKey,
    queryable:
      column.queryable == null
        ? QUERYABLE_COLUMN_TYPES.includes(type)
        : boolean(column.queryable),
    jsonString: boolean(column.jsonString) && type === 'long',
    enumValues,
    enumDescriptions,
    comment: text(column.comment),
    defaultValue,
  }
}

function normalizeOptions(raw, module, issues) {
  const options = raw && typeof raw === 'object' ? { ...raw } : {}
  let dialects = Array.isArray(options.dialects)
    ? options.dialects
    : DEFAULT_OPTIONS.dialects
  dialects = dialects.filter((item) => DIALECT_KEYS.includes(item))
  if (dialects.length === 0) {
    issues.push('至少选择一种 SQL 方言')
    dialects = [...DIALECT_KEYS]
  }
  const outputMode = text(options.outputMode, DEFAULT_OPTIONS.outputMode)
  const validOutputMode = OUTPUT_MODES.includes(outputMode)
  if (!validOutputMode) {
    issues.push('输出方式只能是 zip 或 disk')
  }
  const permissionPrefix = text(options.permissionPrefix) || `system:${module}`
  const security = boolean(options.security, DEFAULT_OPTIONS.security)
  if (security && !/^[A-Za-z0-9_:-]+$/.test(permissionPrefix)) {
    issues.push(`权限前缀仅支持字母/数字/_/:-: ${permissionPrefix}`)
  }

  return {
    dialects,
    generateSql: boolean(options.generateSql, DEFAULT_OPTIONS.generateSql),
    generateFrontend: boolean(
      options.generateFrontend,
      DEFAULT_OPTIONS.generateFrontend,
    ),
    security,
    permissionPrefix,
    outputMode: validOutputMode ? outputMode : DEFAULT_OPTIONS.outputMode,
    outputDirectory:
      text(options.outputDirectory, DEFAULT_OPTIONS.outputDirectory) ||
      DEFAULT_OPTIONS.outputDirectory,
    frontendDirectory:
      text(options.frontendDirectory, DEFAULT_OPTIONS.frontendDirectory) ||
      DEFAULT_OPTIONS.frontendDirectory,
    audit: boolean(options.audit, DEFAULT_OPTIONS.audit),
  }
}

/**
 * 归一化表定义。幂等：对已保存定义再次调用不会改变结构。
 * 有错误时抛出 GeneratorError，issues 为逐条可读问题。
 */
export function normalizeDefinition(input, context = {}) {
  if (!input || typeof input !== 'object') {
    throw new GeneratorError('表定义必须是 JSON 对象')
  }

  const issues = []
  const definition = { ...input }

  let name = text(definition.name)
    .toLowerCase()
    .replace(/[-\s]+/g, '_')
  let entityName = text(definition.entityName)
  if (!name && entityName) name = toSnake(entityName)
  if (!entityName && name) entityName = toPascal(name)
  if (!TABLE_NAME_PATTERN.test(name)) {
    issues.push(`表名非法（需小写字母开头的蛇形命名）: ${name || '(空)'}`)
  }
  if (!ENTITY_NAME_PATTERN.test(entityName)) {
    issues.push(`实体名非法（需 PascalCase）: ${entityName || '(空)'}`)
  }

  let module = text(definition.module)
  if (!module)
    module = entityName
      ? entityName.charAt(0).toLowerCase() + entityName.slice(1)
      : ''
  if (!MODULE_NAME_PATTERN.test(module)) {
    issues.push(
      `模块名非法（需小写字母开头的 Java 标识符）: ${module || '(空)'}`,
    )
  }

  const basePackage =
    text(definition.basePackage, 'com.example.ddd') || 'com.example.ddd'
  if (!PACKAGE_NAME_PATTERN.test(basePackage)) {
    issues.push(`基础包名非法: ${basePackage}`)
  }

  const options = normalizeOptions(definition.options, module, issues)
  const rawColumns = Array.isArray(definition.columns) ? definition.columns : []
  if (rawColumns.length === 0) issues.push('至少需要一个字段')

  let columns = rawColumns.map((column, index) =>
    normalizeColumn(column, index, issues),
  )

  // 列名 / Java 名去重
  const names = new Set()
  const javaNames = new Set()
  for (const column of columns) {
    if (names.has(column.name)) issues.push(`列名重复: ${column.name}`)
    names.add(column.name)
    if (javaNames.has(column.javaName))
      issues.push(`Java 字段名重复: ${column.javaName}`)
    javaNames.add(column.javaName)
    if (['equals', 'hashCode', 'toString'].includes(column.javaName)) {
      issues.push(`Java 字段名与 Object 方法冲突: ${column.javaName}`)
    }
    if (column.javaName === 'id' && !column.primaryKey) {
      issues.push(
        `非主键字段不能命名为 id（会与聚合 id() 冲突）: ${column.name}`,
      )
    }
  }

  const primaryKeys = columns.filter((column) => column.primaryKey)
  if (primaryKeys.length !== 1) {
    issues.push(`必须且只能有一个主键字段（当前 ${primaryKeys.length} 个）`)
  } else if (primaryKeys[0].type !== 'long') {
    issues.push('DDD 聚合主键仅支持 BIGINT / long 类型')
  }

  // 审计字段：自动补齐，并统一排在所有业务字段之后。
  // 明细表不生成 created_dept（创建部门仅属于主表）。
  columns = ensureAuditColumns(columns, options.audit, {
    includeCreatedDept: context.isDetail !== true,
    resetAll: true,
  })

  // 明细表：与主表共享 module/basePackage/options，独立校验表名、实体与字段。
  const rawDetails = Array.isArray(definition.detailTables)
    ? definition.detailTables
    : []
  const detailTables = []
  for (let index = 0; index < rawDetails.length; index += 1) {
    const rawDetail = rawDetails[index]
    if (!rawDetail || typeof rawDetail !== 'object') {
      issues.push(`第 ${index + 1} 个明细表定义无效`)
      continue
    }
    try {
      const normalized = normalizeDefinition(
        { ...rawDetail, module, basePackage, options, detailTables: [] },
        { isDetail: true },
      )
      detailTables.push({
        id: normalized.id,
        name: normalized.name,
        entityName: normalized.entityName,
        displayName: normalized.displayName,
        comment: normalized.comment,
        columns: normalized.columns,
        createdAt: normalized.createdAt,
        updatedAt: normalized.updatedAt,
      })
    } catch (error) {
      if (!(error instanceof GeneratorError)) throw error
      issues.push(
        `明细表 ${text(rawDetail.name) || index + 1}：${error.message}${
          error.issues?.length ? `：${error.issues.join('；')}` : ''
        }`,
      )
    }
  }

  const usedTableNames = new Set([name])
  const usedEntityNames = new Set([entityName])
  for (const detail of detailTables) {
    if (usedTableNames.has(detail.name)) {
      issues.push(`明细表表名重复: ${detail.name}`)
    }
    usedTableNames.add(detail.name)
    if (usedEntityNames.has(detail.entityName)) {
      issues.push(`明细表实体名重复: ${detail.entityName}`)
    }
    usedEntityNames.add(detail.entityName)
  }

  // JavaDoc 中的用户文本不能包含注释结束符，否则会破坏生成的 Java 文件。
  const docTexts = [
    text(definition.displayName),
    text(definition.comment),
    ...columns.flatMap((column) => [
      column.comment,
      column.label,
      ...Object.values(column.enumDescriptions ?? {}),
    ]),
  ]
  if (docTexts.some((value) => value.includes('*/'))) {
    issues.push('注释/显示名称不能包含 */（会截断生成的 JavaDoc）')
  }

  if (issues.length > 0) {
    throw new GeneratorError('表定义校验未通过', issues)
  }

  const now = new Date().toISOString()
  return {
    id: text(definition.id) || createId(),
    name,
    entityName,
    displayName:
      text(definition.displayName) || text(definition.comment) || entityName,
    comment: text(definition.comment),
    module,
    basePackage,
    columns,
    detailTables,
    options,
    createdAt: text(definition.createdAt) || now,
    updatedAt: text(definition.updatedAt) || now,
  }
}

/** 新建表定义的默认值（页面“新建表”与示例数据共用）。 */
export function createDefaultDefinition(overrides = {}) {
  const definition = {
    name: 'sys_demo',
    entityName: 'Demo',
    displayName: '示例业务',
    module: 'demo',
    basePackage: 'com.example.ddd',
    comment: '示例业务表',
    columns: [
      {
        id: 'col_id',
        name: 'id',
        javaName: 'id',
        label: '主键',
        type: 'long',
        nullable: false,
        primaryKey: true,
        unique: false,
        autoIncrement: false,
        queryable: false,
        comment: '主键 ID（雪花算法）',
      },
      {
        id: 'col_code',
        name: 'code',
        javaName: 'code',
        label: '编码',
        type: 'string',
        length: 64,
        nullable: false,
        comment: '业务编码',
      },
      {
        id: 'col_name',
        name: 'name',
        javaName: 'name',
        label: '名称',
        type: 'string',
        length: 128,
        nullable: false,
        comment: '业务名称',
      },
      {
        id: 'col_status',
        name: 'status',
        javaName: 'status',
        label: '状态',
        type: 'enum',
        length: 32,
        nullable: false,
        enumValues: ['ENABLED', 'DISABLED'],
        queryable: true,
        comment: '启用状态',
      },
      {
        id: 'col_remark',
        name: 'remark',
        javaName: 'remark',
        label: '备注',
        type: 'string',
        length: 256,
        nullable: true,
        comment: '备注',
      },
      {
        id: 'col_created_at',
        name: 'created_at',
        javaName: 'createdAt',
        label: '创建时间',
        type: 'datetime',
        nullable: false,
        queryable: false,
        comment: '创建时间',
      },
      {
        id: 'col_updated_at',
        name: 'updated_at',
        javaName: 'updatedAt',
        label: '更新时间',
        type: 'datetime',
        nullable: false,
        queryable: false,
        comment: '更新时间',
      },
    ],
    detailTables: [],
    options: { ...DEFAULT_OPTIONS },
    ...overrides,
  }
  return normalizeDefinition(definition)
}
