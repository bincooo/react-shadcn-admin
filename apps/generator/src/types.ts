export type Dialect = 'mysql' | 'postgres' | 'sqlserver' | 'oracle'

export type ColumnType =
  | 'string'
  | 'text'
  | 'integer'
  | 'long'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'json'
  | 'uuid'

export type OutputMode = 'zip' | 'disk'

export interface ColumnDefinition {
  id: string
  name: string
  javaName: string
  label: string
  type: ColumnType
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  autoIncrement: boolean
  queryable: boolean
  jsonString: boolean
  enumValues: string[]
  enumDescriptions: Record<string, string>
  comment: string
  defaultValue: string
}

export interface GeneratorOptions {
  dialects: Dialect[]
  generateSql: boolean
  generateFrontend: boolean
  security: boolean
  permissionPrefix: string
  outputMode: OutputMode
  outputDirectory: string
  frontendDirectory: string
  audit: boolean
}

export interface DetailTableDefinition {
  id: string
  name: string
  entityName: string
  displayName: string
  comment: string
  columns: ColumnDefinition[]
  createdAt?: string
  updatedAt?: string
}

export interface TableDefinition {
  id: string
  name: string
  entityName: string
  displayName: string
  comment: string
  module: string
  basePackage: string
  columns: ColumnDefinition[]
  detailTables: DetailTableDefinition[]
  options: GeneratorOptions
  createdAt: string
  updatedAt: string
}

export interface TableSummary {
  name: string
  entityName: string
  displayName: string
  module: string
  comment: string
  columns: number
  details: number
  updatedAt: string | null
  outputMode: OutputMode
  file: string
}

export interface TableListResult {
  tables: TableSummary[]
  errors: { name: string; error: string }[]
  dataDir: string
}

export interface GeneratedDetailSummary {
  table: string
  entity: string
  displayName: string
  columns: number
  fileCount: number
}

export interface GeneratedSummary {
  table: string
  entity: string
  entityId: string
  displayName: string
  module: string
  basePackage: string
  route: string
  dialects: Dialect[]
  outputMode: OutputMode
  outputDirectory: string
  frontendDirectory: string
  columns: number
  editableColumns: number
  uniqueColumns: number
  detailCount: number
  details: GeneratedDetailSummary[]
  fileCount: number
  generatedAt: string
}

export interface GenerateResult {
  definition: TableDefinition
  summary: GeneratedSummary
  files: Record<string, string>
}

export interface WrittenFile {
  path: string
  status: 'created' | 'updated'
  bytes: number
}

export interface WriteResult {
  targetDirectory: string
  frontendTargetDirectory: string | null
  count: number
  created: number
  updated: number
  files: WrittenFile[]
  frontendCount: number
  frontendCreated: number
  frontendUpdated: number
  frontendFiles: WrittenFile[]
  summary: GeneratedSummary
}

export interface AppConfig {
  appRoot: string
  dataDir: string
  outputDirectory: string
  resolvedOutputDirectory: string
  frontendDirectory: string
  resolvedFrontendDirectory: string
  dialects: { key: Dialect; label: string }[]
  columnTypes: {
    key: ColumnType
    label: string
    javaType: string
    kind: string
    defaultLength?: number
    defaultPrecision?: number
    defaultScale?: number
  }[]
}
