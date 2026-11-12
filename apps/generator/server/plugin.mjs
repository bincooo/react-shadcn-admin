/**
 * Vite 开发 / 预览服务器的生成器 API。
 *
 * 页面只通过 HTTP 访问 data/[table].jsonl 与生成逻辑；同一套 core 也被
 * scripts/generate.mjs 直接复用，因此“页面生成”和“node 指令生成”结果一致。
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  COLUMN_TYPES,
  DEFAULT_OPTIONS,
  DIALECTS,
  GeneratorError,
  formatIssues,
  generateFiles,
  generateSql,
  listTables,
  normalizeDefinition,
  readLatest,
  resolveFrontendDirectory,
  resolveOutputDirectory,
  saveDefinition,
  deleteDefinition,
  createZip,
  writeGeneratedFiles,
} from '../core/index.mjs'

const APP_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const DATA_DIR = path.join(APP_ROOT, 'data')
const BODY_LIMIT = 4 * 1024 * 1024

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Length', Buffer.byteLength(body))
  res.end(body)
}

/** 可预期错误按语义映射状态码，其余一律视为内部错误 */
function errorStatus(error) {
  if (!(error instanceof GeneratorError)) return 500
  return error.message.includes('不存在') ? 404 : 400
}

function sendError(res, error) {
  sendJson(res, errorStatus(error), {
    error: error.message || '生成器内部错误',
    issues: error.issues ?? [],
    detail: formatIssues(error),
  })
}

async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > BODY_LIMIT) {
      req.destroy()
      throw new GeneratorError('请求体过大（上限 4MB）')
    }
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch (error) {
    throw new GeneratorError(`请求体不是合法 JSON: ${error.message}`)
  }
}

function sendZip(res, zip, filename) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  )
  res.setHeader('Content-Length', zip.length)
  res.setHeader('Cache-Control', 'no-store')
  res.end(zip)
}

function definitionFromBody(body, fallbackName) {
  if (body && typeof body === 'object' && body.definition)
    return body.definition
  if (body && typeof body === 'object' && body.name) return body
  throw new GeneratorError(
    fallbackName ? `请求体缺少表定义: ${fallbackName}` : '请求体缺少表定义',
  )
}

function zipName(generated) {
  const entity = generated.summary.entity || 'table'
  return `${entity}-ddd.zip`
}

/** 解析后端 / 前端两个写入根目录：请求体优先，其次表定义，最后默认值 */
function resolveWriteTargets(body, generated) {
  const directory =
    body.directory ||
    generated.definition.options.outputDirectory ||
    DEFAULT_OPTIONS.outputDirectory
  const frontendDirectory =
    body.frontendDirectory ||
    generated.definition.options.frontendDirectory ||
    DEFAULT_OPTIONS.frontendDirectory
  return {
    outputDirectory: resolveOutputDirectory(directory, APP_ROOT),
    frontendDirectory: resolveFrontendDirectory(frontendDirectory, APP_ROOT),
  }
}

function sendText(res, text) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(text)
}

/** 生成 ZIP 并作为附件下载 */
function sendGeneratedZip(res, generated) {
  sendZip(res, createZip(generated.files), zipName(generated))
}

/** 生成文件并写入后端 / 前端工程 */
async function writeGenerated(res, body, definition) {
  const generated = generateFiles(definition)
  const targets = resolveWriteTargets(body, generated)
  const result = await writeGeneratedFiles(generated.files, targets)
  sendJson(res, 200, { ...result, summary: generated.summary })
}

/** 读取已保存定义并归一化（详情 / SQL 需要完整的默认值） */
async function readNormalized(name) {
  return normalizeDefinition(await readLatest(DATA_DIR, name))
}

/** 读取请求体中的定义，直接生成（不落盘） */
async function generateFromRequest(ctx) {
  const body = await readBody(ctx.req)
  return generateFiles(definitionFromBody(body))
}

/** 读取已保存定义并生成 */
async function generateFromSaved(ctx) {
  return generateFiles(await readLatest(DATA_DIR, ctx.params.name))
}

/** 单表预览：把生成结果原样返回（files / preview 两个接口共用） */
async function sendSavedPreview(ctx) {
  sendJson(ctx.res, 200, await generateFromSaved(ctx))
}

function appInfo() {
  return {
    appRoot: APP_ROOT,
    dataDir: DATA_DIR,
    outputDirectory: DEFAULT_OPTIONS.outputDirectory,
    resolvedOutputDirectory: resolveOutputDirectory(
      DEFAULT_OPTIONS.outputDirectory,
      APP_ROOT,
    ),
    frontendDirectory: DEFAULT_OPTIONS.frontendDirectory,
    resolvedFrontendDirectory: resolveFrontendDirectory(
      DEFAULT_OPTIONS.frontendDirectory,
      APP_ROOT,
    ),
    dialects: DIALECTS,
    columnTypes: COLUMN_TYPES,
  }
}

/**
 * 路由表：`METHOD /api/path` → 处理函数。
 *
 * 路径段用 `:name` 表示参数，匹配结果放入 ctx.params。
 * 未匹配到任何路由时由 dispatch 统一回 404。
 */
const ROUTES = [
  [
    'GET',
    '/api/health',
    (ctx) =>
      sendJson(ctx.res, 200, {
        ok: true,
        appRoot: APP_ROOT,
        dataDir: DATA_DIR,
      }),
  ],

  ['GET', '/api/config', (ctx) => sendJson(ctx.res, 200, appInfo())],

  // 直接对请求体中的定义生成，不落盘
  [
    'POST',
    '/api/preview',
    async (ctx) => {
      sendJson(ctx.res, 200, await generateFromRequest(ctx))
    },
  ],
  [
    'POST',
    '/api/generate',
    async (ctx) => {
      sendGeneratedZip(ctx.res, await generateFromRequest(ctx))
    },
  ],
  [
    'POST',
    '/api/write',
    async (ctx) => {
      const body = await readBody(ctx.req)
      await writeGenerated(ctx.res, body, definitionFromBody(body))
    },
  ],

  // 表定义列表与新建
  [
    'GET',
    '/api/tables',
    async (ctx) => {
      const result = await listTables(DATA_DIR)
      sendJson(ctx.res, 200, { ...result, dataDir: DATA_DIR })
    },
  ],
  [
    'POST',
    '/api/tables',
    async (ctx) => {
      const body = await readBody(ctx.req)
      const saved = await saveDefinition(
        DATA_DIR,
        definitionFromBody(body),
        body.originalName,
      )
      sendJson(ctx.res, 201, { definition: saved })
    },
  ],

  // 单表定义
  [
    'GET',
    '/api/tables/:name',
    async (ctx) => {
      sendJson(ctx.res, 200, {
        definition: await readNormalized(ctx.params.name),
      })
    },
  ],
  ['PUT', '/api/tables/:name', saveTable],
  ['POST', '/api/tables/:name', saveTable],
  [
    'DELETE',
    '/api/tables/:name',
    async (ctx) => {
      const name = ctx.params.name
      await deleteDefinition(DATA_DIR, name)
      sendJson(ctx.res, 200, { ok: true, name })
    },
  ],

  // 单表生成系列
  ['GET', '/api/tables/:name/files', sendSavedPreview],
  ['POST', '/api/tables/:name/preview', sendSavedPreview],
  [
    'POST',
    '/api/tables/:name/generate',
    async (ctx) => {
      sendGeneratedZip(ctx.res, await generateFromSaved(ctx))
    },
  ],
  [
    'POST',
    '/api/tables/:name/write',
    async (ctx) => {
      const body = await readBody(ctx.req)
      const definition = await readLatest(DATA_DIR, ctx.params.name)
      await writeGenerated(ctx.res, body, definition)
    },
  ],
  [
    'GET',
    '/api/tables/:name/sql',
    async (ctx) => {
      const definition = await readNormalized(ctx.params.name)
      const dialect = ctx.url.searchParams.get('dialect') || 'mysql'
      sendText(ctx.res, generateSql(definition, dialect))
    },
  ],
]

/** PUT / POST /api/tables/:name：保存或重命名 */
async function saveTable(ctx) {
  const body = await readBody(ctx.req)
  const name = ctx.params.name
  const saved = await saveDefinition(
    DATA_DIR,
    definitionFromBody(body, name),
    body.originalName ?? name,
  )
  sendJson(ctx.res, 200, { definition: saved })
}

/** 路径段精确匹配，`:param` 段作为参数捕获 */
function matchRoute(method, pathname) {
  const parts = pathname.split('/').filter(Boolean)
  for (const [routeMethod, pattern, handler] of ROUTES) {
    if (routeMethod !== method) continue
    const patternParts = pattern.split('/').filter(Boolean)
    if (patternParts.length !== parts.length) continue
    const params = {}
    const matched = patternParts.every((expected, index) => {
      const value = decodeURIComponent(parts[index])
      if (expected.startsWith(':')) {
        params[expected.slice(1)] = value
        return true
      }
      return expected === value
    })
    if (matched) return { handler, params }
  }
  return null
}

async function dispatch(req, res, url) {
  const match = matchRoute(req.method ?? 'GET', url.pathname)
  if (!match) {
    sendJson(res, 404, { error: `未知接口: ${url.pathname}` })
    return
  }
  await match.handler({ req, res, url, params: match.params })
}

function createMiddleware() {
  return (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://generator.local')
    if (!url.pathname.startsWith('/api/')) return next()
    dispatch(req, res, url).catch((error) => {
      console.error('[generator-api]', error)
      if (!res.headersSent) sendError(res, error)
      else res.end()
    })
  }
}

function registerGeneratorApi(server) {
  server.middlewares.use(createMiddleware())
}

export function generatorApiPlugin() {
  return {
    name: 'generator-api',
    configureServer: registerGeneratorApi,
    configurePreviewServer: registerGeneratorApi,
  }
}

export { APP_ROOT, DATA_DIR }
