/** 把生成文件写入磁盘后端工程；路径均限制在目标目录内。 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { GeneratorError } from './errors.mjs'

function resolveDirectory(directory, baseDir, emptyMessage) {
  const raw = String(directory ?? '').trim()
  if (!raw) throw new GeneratorError(emptyMessage)
  return path.isAbsolute(raw) ? path.normalize(raw) : path.resolve(baseDir, raw)
}

export function resolveOutputDirectory(directory, baseDir) {
  return resolveDirectory(directory, baseDir, '未配置输出目录')
}

export function resolveFrontendDirectory(directory, baseDir) {
  return resolveDirectory(directory, baseDir, '未配置前端工程目录')
}

const FRONTEND_PREFIX = 'frontend/'

/** 按 frontend/ 前缀拆分后端与前端产物 */
export function splitGeneratedFiles(files) {
  const backend = {}
  const frontend = {}
  for (const [relativePath, content] of Object.entries(files)) {
    if (relativePath.startsWith(FRONTEND_PREFIX)) {
      frontend[relativePath.slice(FRONTEND_PREFIX.length)] = content
    } else {
      backend[relativePath] = content
    }
  }
  return { backend, frontend }
}

function assertInside(targetDir, absolutePath) {
  const relative = path.relative(targetDir, absolutePath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new GeneratorError(`生成路径越界: ${absolutePath}`)
  }
}

export async function writeFiles(files, targetDir) {
  const absoluteTarget = path.resolve(targetDir)
  await fs.mkdir(absoluteTarget, { recursive: true })
  const written = []

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.resolve(absoluteTarget, relativePath)
    assertInside(absoluteTarget, absolutePath)
    const existed = await fileExists(absolutePath)
    await fs.mkdir(path.dirname(absolutePath), { recursive: true })
    await fs.writeFile(absolutePath, content, 'utf8')
    written.push({
      path: relativePath,
      status: existed ? 'updated' : 'created',
      bytes: Buffer.byteLength(content, 'utf8'),
    })
  }

  return summarize(absoluteTarget, written)
}

async function fileExists(absolutePath) {
  return fs
    .access(absolutePath)
    .then(() => true)
    .catch(() => false)
}

/** 写入统计：总数 / 新建 / 更新 */
function summarize(targetDirectory, written) {
  return {
    targetDirectory,
    count: written.length,
    created: written.filter((item) => item.status === 'created').length,
    updated: written.filter((item) => item.status === 'updated').length,
    files: written,
  }
}

/**
 * 按产物前缀分别写入后端工程与前端工程。
 * frontend/ 下的路径会剥离前缀后写入 frontendDirectory。
 */
export async function writeGeneratedFiles(
  files,
  { outputDirectory, frontendDirectory },
) {
  const { backend, frontend } = splitGeneratedFiles(files)
  const backendResult = await writeFiles(backend, outputDirectory)
  const hasFrontend = Object.keys(frontend).length > 0
  const frontendResult = hasFrontend
    ? await writeFiles(frontend, frontendDirectory)
    : null

  return {
    targetDirectory: backendResult.targetDirectory,
    frontendTargetDirectory: frontendResult?.targetDirectory ?? null,
    count: backendResult.count + (frontendResult?.count ?? 0),
    created: backendResult.created + (frontendResult?.created ?? 0),
    updated: backendResult.updated + (frontendResult?.updated ?? 0),
    files: backendResult.files,
    frontendCount: frontendResult?.count ?? 0,
    frontendCreated: frontendResult?.created ?? 0,
    frontendUpdated: frontendResult?.updated ?? 0,
    frontendFiles: frontendResult?.files ?? [],
  }
}
