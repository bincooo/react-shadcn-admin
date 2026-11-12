/**
 * JSONL 表定义存储：data/[table].jsonl，每行一份完整快照。
 * 页面保存时追加新版本，加载时取最后一行；删除表即删除整个文件。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { TABLE_NAME_PATTERN } from './constants.mjs'
import { normalizeDefinition } from './definition.mjs'
import { GeneratorError } from './errors.mjs'

let writeQueue = Promise.resolve()

function serialize(task) {
  const run = writeQueue.then(task, task)
  writeQueue = run.catch(() => {})
  return run
}

const JSONL_SUFFIX = '.jsonl'

export function assertTableName(name) {
  if (!TABLE_NAME_PATTERN.test(String(name ?? ''))) {
    throw new GeneratorError(`非法表名: ${name}`)
  }
}

export function tableFilePath(dataDir, name) {
  assertTableName(name)
  return path.join(dataDir, `${name}${JSONL_SUFFIX}`)
}

export async function ensureDataDir(dataDir) {
  await fs.mkdir(dataDir, { recursive: true })
}

export function parseJsonl(text, source = 'jsonl') {
  const snapshots = []
  const lines = text.split(/\r?\n/)
  let firstError = null
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (!line) continue
    try {
      snapshots.push(JSON.parse(line))
    } catch (error) {
      firstError = { line: index + 1, error }
      break
    }
  }
  if (firstError) {
    // 容错：有些编辑器会把 jsonl 整体格式化成多行 JSON（甚至把多份快照
    // 依次排开），此时按「连续 JSON 值」扫描，而不是要求一行一份。
    try {
      const values = splitJsonValues(text)
      if (values.length > 0) return values
      const value = JSON.parse(text)
      return Array.isArray(value) ? value : [value]
    } catch {
      throw new GeneratorError(
        `${source} 第 ${firstError.line} 行不是合法 JSON: ${firstError.error.message}`,
      )
    }
  }
  return snapshots
}

/** 扫描文本中连续出现的顶层 JSON 值（对象/数组），容忍任意空白。 */
function splitJsonValues(text) {
  const values = []
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{' || char === '[') {
      if (depth === 0) start = index
      depth += 1
      continue
    }
    if (char === '}' || char === ']') {
      depth -= 1
      if (depth === 0 && start >= 0) {
        values.push(JSON.parse(text.slice(start, index + 1)))
        start = -1
      }
      continue
    }
    if (depth === 0 && !/\s/.test(char)) {
      throw new SyntaxError(`Unexpected character at ${index}`)
    }
  }
  if (depth !== 0 || inString) throw new SyntaxError('Unterminated JSON value')
  return values
}

export async function readSnapshots(dataDir, name) {
  const filePath = tableFilePath(dataDir, name)
  let text
  try {
    text = await fs.readFile(filePath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new GeneratorError(`表定义不存在: ${name}`)
    }
    throw error
  }
  return parseJsonl(text, `${name}.jsonl`)
}

export async function readLatest(dataDir, name) {
  const snapshots = await readSnapshots(dataDir, name)
  if (snapshots.length === 0) {
    throw new GeneratorError(`表定义文件为空: ${name}.jsonl`)
  }
  return snapshots[snapshots.length - 1]
}

async function listJsonlNames(dataDir) {
  await ensureDataDir(dataDir)
  const entries = await fs.readdir(dataDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(JSONL_SUFFIX))
    .map((entry) => entry.name.slice(0, -JSONL_SUFFIX.length))
    .filter((name) => TABLE_NAME_PATTERN.test(name))
}

export async function listTables(dataDir) {
  const names = await listJsonlNames(dataDir)
  const tables = []
  const errors = []
  for (const name of names) {
    try {
      const snapshots = await readSnapshots(dataDir, name)
      if (snapshots.length === 0) {
        errors.push({ name, error: '文件为空' })
        continue
      }
      const latest = snapshots[snapshots.length - 1]
      const definition = normalizeDefinition(latest)
      tables.push({
        name: definition.name,
        entityName: definition.entityName,
        displayName: definition.displayName,
        module: definition.module,
        comment: definition.comment,
        columns: definition.columns.length,
        details: definition.detailTables.length,
        updatedAt: definition.updatedAt,
        outputMode: definition.options.outputMode,
        file: `${name}.jsonl`,
      })
    } catch (error) {
      errors.push({ name, error: error.message })
    }
  }
  tables.sort((left, right) => left.name.localeCompare(right.name))
  return { tables, errors }
}

export async function saveDefinition(dataDir, input, originalName) {
  return serialize(async () => {
    await ensureDataDir(dataDir)
    const normalized = normalizeDefinition(input)
    const targetName = normalized.name
    if (originalName) assertTableName(originalName)

    const now = new Date().toISOString()
    const snapshot = {
      ...normalized,
      createdAt: normalized.createdAt || now,
      updatedAt: now,
    }
    const filePath = tableFilePath(dataDir, targetName)
    // JSONL 只保留一条记录：每次保存直接覆盖，不追加历史版本。
    await fs.writeFile(filePath, `${JSON.stringify(snapshot)}\n`, 'utf8')

    if (originalName && originalName !== targetName) {
      try {
        await fs.unlink(tableFilePath(dataDir, originalName))
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
    return snapshot
  })
}

export async function deleteDefinition(dataDir, name) {
  return serialize(async () => {
    const filePath = tableFilePath(dataDir, name)
    try {
      await fs.unlink(filePath)
      return true
    } catch (error) {
      if (error.code === 'ENOENT')
        throw new GeneratorError(`表定义不存在: ${name}`)
      throw error
    }
  })
}

/** CLI：读取任意 jsonl / json 文件中的最新定义 */
export async function readDefinitionFile(filePath) {
  const text = await fs.readFile(filePath, 'utf8')
  if (filePath.endsWith('.jsonl')) {
    const snapshots = parseJsonl(text, filePath)
    if (snapshots.length === 0) {
      throw new GeneratorError(`文件为空: ${filePath}`)
    }
    return snapshots[snapshots.length - 1]
  }
  return JSON.parse(text)
}
