/**
 * 模板仓库：负责定位、读取与缓存模板 AST。
 *
 * 缓存按 mtime + size 失效，保留“改模板无需重启”的能力；
 * 编译（预处理 → 词法 → 语法）只发生一次。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GeneratorError } from '../errors.mjs'
import { parse } from './parse.mjs'
import { stripDirectiveLines } from './preprocess.mjs'
import { tokenize } from './tokenize.mjs'

const TEMPLATE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../templates',
)

/** 模板路径 → { mtimeMs, size, ast } */
const cache = new Map()

/** 把模板名解析成绝对路径，并阻止越界访问 */
function resolveTemplatePath(name) {
  const file = path.resolve(TEMPLATE_ROOT, name)
  if (!file.startsWith(`${TEMPLATE_ROOT}${path.sep}`)) {
    throw new GeneratorError(`模板路径越界: ${name}`)
  }
  return file
}

/** 编译：源码 → AST */
export function compile(source) {
  return parse(tokenize(stripDirectiveLines(source)))
}

/** 读取并编译模板；命中缓存时直接返回 AST */
export function loadTemplate(name) {
  const file = resolveTemplatePath(name)
  let stat
  try {
    stat = fs.statSync(file)
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new GeneratorError(`模板不存在: ${name}`)
    }
    throw error
  }

  const cached = cache.get(file)
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
    return cached.ast
  }

  const ast = compile(fs.readFileSync(file, 'utf8'))
  cache.set(file, { mtimeMs: stat.mtimeMs, size: stat.size, ast })
  return ast
}
