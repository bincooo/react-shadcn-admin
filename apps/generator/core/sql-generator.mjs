/**
 * 多数据库 DDL 生成：core 只推导每列的 SQL 类型、默认值、约束与索引数据，
 * 方言语序 / 分隔符 / 注释语法全部由 templates/backend/sql/*.ftl 决定。
 */
import { DIALECTS } from './constants.mjs'
import { columnLabel } from './java-utils.mjs'
import { renderTemplate } from './tokenizer/index.mjs'

const DIALECT_LABELS = Object.fromEntries(
  DIALECTS.map((dialect) => [dialect.key, dialect.label]),
)

/** 各方言的标识符引用规则 */
const QUOTES = {
  mysql: (name) => `\`${name}\``,
  postgres: (name) => `"${name}"`,
  sqlserver: (name) => `[${name}]`,
  oracle: (name) => `"${name.toUpperCase()}"`,
}

/** 列类型 → 各方言 DDL 类型 */
const COLUMN_TYPES = {
  string: {
    mysql: 'VARCHAR',
    postgres: 'VARCHAR',
    sqlserver: 'NVARCHAR',
    oracle: 'VARCHAR2',
  },
  enum: {
    mysql: 'VARCHAR',
    postgres: 'VARCHAR',
    sqlserver: 'NVARCHAR',
    oracle: 'VARCHAR2',
  },
  text: {
    mysql: 'TEXT',
    postgres: 'TEXT',
    sqlserver: 'NVARCHAR(MAX)',
    oracle: 'CLOB',
  },
  integer: {
    mysql: 'INT',
    postgres: 'INTEGER',
    sqlserver: 'INT',
    oracle: 'NUMBER(10)',
  },
  long: {
    mysql: 'BIGINT',
    postgres: 'BIGINT',
    sqlserver: 'BIGINT',
    oracle: 'NUMBER(19)',
  },
  decimal: {
    mysql: 'DECIMAL',
    postgres: 'NUMERIC',
    sqlserver: 'DECIMAL',
    oracle: 'NUMBER',
  },
  boolean: {
    mysql: 'TINYINT(1)',
    postgres: 'BOOLEAN',
    sqlserver: 'BIT',
    oracle: 'NUMBER(1)',
  },
  date: { mysql: 'DATE', postgres: 'DATE', sqlserver: 'DATE', oracle: 'DATE' },
  datetime: {
    mysql: 'DATETIME(3)',
    postgres: 'TIMESTAMP',
    sqlserver: 'DATETIME2',
    oracle: 'TIMESTAMP',
  },
  json: {
    mysql: 'JSON',
    postgres: 'JSONB',
    sqlserver: 'NVARCHAR(MAX)',
    oracle: 'CLOB',
  },
  uuid: {
    mysql: 'CHAR(36)',
    postgres: 'UUID',
    sqlserver: 'UNIQUEIDENTIFIER',
    oracle: 'VARCHAR2(36)',
  },
}

function escapeSql(value) {
  return String(value ?? '').replace(/'/g, "''")
}

/** 带长度/精度的类型需要参数，其余直接取常量 */
function sqlType(column, dialect) {
  const names = COLUMN_TYPES[column.type]
  if (!names) return 'VARCHAR(255)'
  const base = names[dialect]
  if (column.type === 'string' || column.type === 'enum') {
    return `${base}(${column.length || 64})`
  }
  if (column.type === 'decimal') {
    return `${base}(${column.precision || 18},${column.scale ?? 2})`
  }
  return base
}

/** 默认值表达式；空串表示不生成 DEFAULT */
function defaultSql(column, dialect) {
  const value = column.defaultValue
  if (!value || column.autoIncrement) return ''
  // TEXT / CLOB / JSON 类型在部分数据库里不接受普通字面量默认值，统一不生成。
  if (column.type === 'text' || column.type === 'json') return ''
  const lower = value.toLowerCase()
  if (CURRENT_TIME_KEYWORDS.has(lower)) return value
  if (column.type === 'boolean') {
    const truthy = ['true', '1', 'yes', 'y', '是'].includes(lower)
    if (dialect === 'postgres') return truthy ? 'TRUE' : 'FALSE'
    return truthy ? '1' : '0'
  }
  if (NUMERIC_TYPES.has(column.type)) return value
  return `'${escapeSql(value)}'`
}

/** 列注释；枚举附带取值说明 */
function columnComment(column) {
  const base = columnLabel(column)
  if (column.type === 'enum' && column.enumValues.length > 0) {
    const values = column.enumValues.map((value) => {
      const description = column.enumDescriptions?.[value]
      return description ? `${value}: ${description}` : value
    })
    return `${base}（枚举: ${values.join(', ')}）`
  }
  return base
}

function tableComment(definition) {
  return definition.comment || definition.displayName || definition.name
}

/** 每列的方言无关数据；模板负责语序与分隔符 */
function columnModel(column, dialect, quote) {
  return {
    name: quote(column.name),
    rawName: column.name,
    type: sqlType(column, dialect),
    notNull: !column.nullable,
    defaultExpr: defaultSql(column, dialect),
    autoIncrement: column.autoIncrement && column.primaryKey,
    comment: escapeSql(columnComment(column)),
    isPk: column.primaryKey,
  }
}

/** 主键与唯一约束 */
function constraints(definition, quote) {
  const list = []
  const pk = definition.columns.find((column) => column.primaryKey)
  if (pk) {
    list.push({
      name: quote(`pk_${definition.name}`),
      kind: 'PRIMARY KEY',
      column: quote(pk.name),
    })
  }
  for (const column of definition.columns) {
    if (!column.unique || column.primaryKey) continue
    list.push({
      name: quote(`uk_${definition.name}_${column.name}`),
      kind: 'UNIQUE',
      column: quote(column.name),
    })
  }
  return list
}

/** 可查询列的普通索引 */
function indexes(definition, quote) {
  return definition.columns
    .filter(
      (column) => column.queryable && !column.unique && !column.primaryKey,
    )
    .map((column) => ({
      name: quote(`idx_${definition.name}_${column.name}`),
      rawName: `idx_${definition.name}_${column.name}`,
      table: quote(definition.name),
      column: quote(column.name),
    }))
}

function buildModel(definition, dialect, generatedAt) {
  const quote = QUOTES[dialect]
  return {
    definition,
    dialect,
    dialectLabel: DIALECT_LABELS[dialect],
    generatedAt,
    tableName: quote(definition.name),
    tableNameRaw: definition.name,
    tableComment: escapeSql(tableComment(definition)),
    columns: definition.columns.map((column) =>
      columnModel(column, dialect, quote),
    ),
    constraints: constraints(definition, quote),
    indexes: indexes(definition, quote),
  }
}

const SQL_TEMPLATES = {
  mysql: 'backend/sql/mysql.ftl',
  postgres: 'backend/sql/postgres.ftl',
  sqlserver: 'backend/sql/sqlserver.ftl',
  oracle: 'backend/sql/oracle.ftl',
}

const CURRENT_TIME_KEYWORDS = new Set(['current_timestamp', 'now()', 'sysdate'])
const NUMERIC_TYPES = new Set(['integer', 'long', 'decimal'])

export function generateSql(
  definition,
  dialect,
  generatedAt = new Date().toISOString(),
) {
  const template = SQL_TEMPLATES[dialect]
  if (!template) throw new Error(`不支持的 SQL 方言: ${dialect}`)
  return renderTemplate(template, buildModel(definition, dialect, generatedAt))
}
