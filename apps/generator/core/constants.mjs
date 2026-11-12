/**
 * 生成器共享常量：前后端（Vite 中间件、CLI、React 页面）共同引用的类型目录。
 * 本文件保持纯 ESM，不依赖 node:fs / node:path，可安全打包进浏览器。
 */

export const DIALECTS = [
  { key: 'mysql', label: 'MySQL' },
  { key: 'postgres', label: 'PostgreSQL' },
  { key: 'sqlserver', label: 'SQL Server' },
  { key: 'oracle', label: 'Oracle' },
]

export const COLUMN_TYPES = [
  {
    key: 'string',
    label: '字符串 VARCHAR',
    javaType: 'String',
    kind: 'string',
    defaultLength: 64,
  },
  {
    key: 'text',
    label: '长文本 TEXT',
    javaType: 'String',
    kind: 'text',
  },
  {
    key: 'integer',
    label: '整数 INT',
    javaType: 'Integer',
    kind: 'integer',
  },
  {
    key: 'long',
    label: '长整数 BIGINT',
    javaType: 'Long',
    kind: 'long',
  },
  {
    key: 'decimal',
    label: '小数 DECIMAL',
    javaType: 'BigDecimal',
    kind: 'decimal',
    defaultPrecision: 18,
    defaultScale: 2,
  },
  {
    key: 'boolean',
    label: '布尔 BOOLEAN',
    javaType: 'Boolean',
    kind: 'boolean',
  },
  {
    key: 'date',
    label: '日期 DATE',
    javaType: 'LocalDate',
    kind: 'date',
  },
  {
    key: 'datetime',
    label: '时间 TIMESTAMP',
    javaType: 'Instant',
    kind: 'datetime',
  },
  {
    key: 'enum',
    label: '枚举 ENUM',
    javaType: 'String',
    kind: 'enum',
    defaultLength: 32,
  },
  {
    key: 'json',
    label: 'JSON',
    javaType: 'String',
    kind: 'json',
  },
  {
    key: 'uuid',
    label: 'UUID',
    javaType: 'String',
    kind: 'uuid',
    defaultLength: 36,
  },
]

export const COLUMN_TYPE_KEYS = COLUMN_TYPES.map((item) => item.key)

/** 默认参与关键字搜索 / 可建立查询索引的列类型 */
export const QUERYABLE_COLUMN_TYPES = ['string', 'text', 'enum', 'uuid']

export const DIALECT_KEYS = DIALECTS.map((item) => item.key)

export const DEFAULT_OPTIONS = {
  dialects: [...DIALECT_KEYS],
  generateSql: true,
  generateFrontend: true,
  security: true,
  permissionPrefix: '',
  outputMode: 'zip',
  outputDirectory: '../../../ddd-springboot',
  frontendDirectory: '../playground/src/pages',
  audit: true,
}

export const AUDIT_COLUMN_DEFS = [
  {
    name: 'created_dept',
    label: '创建部门',
    type: 'string',
    length: 128,
    nullable: true,
  },
  { name: 'created_at', label: '创建时间', type: 'datetime', nullable: false },
  {
    name: 'created_by',
    label: '创建人',
    type: 'string',
    length: 64,
    nullable: true,
  },
  { name: 'updated_at', label: '更新时间', type: 'datetime', nullable: false },
  {
    name: 'updated_by',
    label: '更新人',
    type: 'string',
    length: 64,
    nullable: true,
  },
]

export const AUDIT_COLUMN_NAMES = AUDIT_COLUMN_DEFS.map((def) => def.name)

export const TABLE_NAME_PATTERN = /^[a-z][a-z0-9_]*$/
export const ENTITY_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/
export const MODULE_NAME_PATTERN = /^[a-z][a-zA-Z0-9]*$/
export const PACKAGE_NAME_PATTERN =
  /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/
export const JAVA_IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/** Java 关键字：作为列名/字段名时需要避让 */
export const JAVA_RESERVED_WORDS = new Set([
  'abstract',
  'assert',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extends',
  'final',
  'finally',
  'float',
  'for',
  'goto',
  'if',
  'implements',
  'import',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'strictfp',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'void',
  'volatile',
  'while',
  'record',
  'sealed',
  'permits',
  'yield',
  'var',
])

export const SHARED_DEPENDENCIES = [
  'com.example.ddd.domain.shared.AggregateRoot',
  'com.example.ddd.domain.shared.DomainEvent',
  'com.example.ddd.domain.shared.DomainException',
  'com.example.ddd.domain.shared.NotFoundException',
  'com.example.ddd.domain.shared.PageQuery',
  'com.example.ddd.domain.shared.PageResult',
  'com.example.ddd.domain.shared.SnowflakeIdGenerator',
  'com.example.ddd.application.shared.PageDTO',
  'com.example.ddd.application.shared.Loaders',
  'com.example.ddd.application.shared.DomainEventPublisher',
  'com.example.ddd.infrastructure.persistence.support.PageResults',
]
