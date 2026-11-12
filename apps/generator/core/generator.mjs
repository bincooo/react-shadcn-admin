/**
 * 代码生成编排：把上下文交给各层模板，产出相对后端工程根目录的「路径 → 内容」映射。
 * 同一份映射同时服务 ZIP 下载、磁盘写入与页面预览。
 */
import { SHARED_DEPENDENCIES } from './constants.mjs'
import { buildContext } from './context.mjs'
import { generateFrontendFiles } from './frontend.mjs'
import { renderTemplate } from './tokenizer/index.mjs'
import { generateApplicationFiles } from './java/application.mjs'
import { generateDomainFiles } from './java/domain.mjs'
import { generateInfrastructureFiles } from './java/infrastructure.mjs'
import { packageToPath } from './naming.mjs'
import { generateSql } from './sql-generator.mjs'

const LAYER_MODULES = {
  domain: 'ddd-domain',
  application: 'ddd-application',
  infrastructure: 'ddd-infrastructure',
  interfaces: 'ddd-interfaces',
}

function sharedDependencies(base) {
  return SHARED_DEPENDENCIES.map((fqn) => fqn.replace('com.example.ddd', base))
}

function layerOf(pkg, basePackage) {
  if (!pkg.startsWith(`${basePackage}.`)) return undefined
  return pkg.slice(basePackage.length + 1).split('.')[0]
}

function javaPath(ctx, entry) {
  const module = LAYER_MODULES[layerOf(entry.pkg, ctx.base)] || 'ddd-domain'
  return `${module}/src/main/java/${packageToPath(entry.pkg)}/${entry.file}`
}

function addFile(files, path, content) {
  if (files[path] != null) {
    throw new Error(`生成文件路径冲突: ${path}`)
  }
  files[path] = content
}

const RESOURCE_BASE = 'ddd-infrastructure/src/main/resources'

function frontendPaths(files) {
  return Object.keys(files).filter((path) => path.startsWith('frontend/'))
}

/** SQL 产物相对后端工程根目录的路径 */
function sqlFilePath(definition, dialect) {
  return `${RESOURCE_BASE}/db/generated/${dialect}/${definition.name}.sql`
}

/** 生成器产物自带的说明文档（文本结构见 templates/report/readme.md.ftl） */
function buildReadme(ctx, files, generatedAt, details = []) {
  const { definition, entity, entityId, pkgs, route } = ctx
  const sqlFiles = definition.options.generateSql
    ? definition.options.dialects.map((dialect) =>
        sqlFilePath(definition, dialect),
      )
    : []
  return renderTemplate('report/readme.md.ftl', {
    displayName: definition.displayName,
    tableName: definition.name,
    entity,
    entityId,
    module: definition.module,
    basePackage: definition.basePackage,
    route,
    generatedAt,
    details,
    files: Object.keys(files),
    sqlFiles,
    frontendFiles: frontendPaths(files),
    sharedDependencies: sharedDependencies(ctx.base),
    domainModelPackage: pkgs.domainModel,
    resourceBase: RESOURCE_BASE,
  })
}

function generateTableFiles(input, normalizeContext = {}) {
  const ctx = buildContext(input, normalizeContext)
  const { definition } = ctx
  const entries = [
    ...generateDomainFiles(ctx),
    ...generateApplicationFiles(ctx),
    ...generateInfrastructureFiles(ctx),
  ]

  const files = {}

  for (const entry of entries) {
    addFile(files, javaPath(ctx, entry), entry.content)
  }

  const sqlFiles = {}
  if (definition.options.generateSql) {
    for (const dialect of definition.options.dialects) {
      const path = sqlFilePath(definition, dialect)
      addFile(files, path, generateSql(definition, dialect))
      sqlFiles[dialect] = path
    }
  }

  if (definition.options.generateFrontend) {
    for (const entry of generateFrontendFiles(ctx)) {
      addFile(files, entry.path, entry.content)
    }
  }

  return { ctx, files, sqlFiles }
}

function buildManifest(ctx, files, sqlFiles, generatedAt, details) {
  return {
    generator: 'react-admin/apps/generator',
    generatedAt,
    table: ctx.definition.name,
    entity: ctx.entity,
    entityId: ctx.entityId,
    module: ctx.module,
    basePackage: ctx.base,
    route: ctx.route,
    dialects: ctx.definition.options.dialects,
    fileCount: Object.keys(files).length,
    files: Object.keys(files).sort(),
    sql: sqlFiles,
    frontend: {
      enabled: ctx.definition.options.generateFrontend,
      files: frontendPaths(files).sort(),
    },
    details,
    sharedDependencies: sharedDependencies(ctx.base),
  }
}

export function generateFiles(input) {
  const main = generateTableFiles(input)
  const { definition } = main.ctx
  const generatedAt = new Date().toISOString()
  const files = { ...main.files }
  const details = []

  for (const detail of definition.detailTables) {
    const detailInput = {
      ...definition,
      id: detail.id,
      name: detail.name,
      entityName: detail.entityName,
      displayName: detail.displayName,
      comment: detail.comment,
      columns: detail.columns,
      detailTables: [],
    }
    const generated = generateTableFiles(detailInput, { isDetail: true })
    for (const [path, content] of Object.entries(generated.files)) {
      addFile(files, path, content)
    }
    details.push({
      table: generated.ctx.definition.name,
      entity: generated.ctx.entity,
      displayName: generated.ctx.definition.displayName,
      columns: generated.ctx.definition.columns.length,
      fileCount: Object.keys(generated.files).length,
    })
  }

  const docDir = `generator/${main.ctx.entity}`
  files[`${docDir}/README.md`] = buildReadme(
    main.ctx,
    files,
    generatedAt,
    details,
  )
  const manifest = buildManifest(
    main.ctx,
    files,
    main.sqlFiles,
    generatedAt,
    details,
  )
  files[`${docDir}/manifest.json`] = `${JSON.stringify(manifest, null, 2)}\n`

  const sortedFiles = Object.fromEntries(
    Object.entries(files).sort(([left], [right]) => left.localeCompare(right)),
  )

  return {
    definition,
    summary: {
      table: definition.name,
      entity: main.ctx.entity,
      entityId: main.ctx.entityId,
      displayName: definition.displayName,
      module: main.ctx.module,
      basePackage: main.ctx.base,
      route: main.ctx.route,
      dialects: definition.options.dialects,
      outputMode: definition.options.outputMode,
      outputDirectory: definition.options.outputDirectory,
      frontendDirectory: definition.options.frontendDirectory,
      columns: definition.columns.length,
      editableColumns: main.ctx.editableColumns.length,
      uniqueColumns: main.ctx.uniqueColumns.length,
      detailCount: details.length,
      details,
      fileCount: Object.keys(sortedFiles).length,
      generatedAt,
    },
    files: sortedFiles,
  }
}
