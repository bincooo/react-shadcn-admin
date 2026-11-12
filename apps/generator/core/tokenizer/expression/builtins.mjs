/**
 * 表达式内建函数注册表（`?name` 形式）。
 *
 * 每个内建是 `(value, args) => result` 的纯函数；新增内建只需往表里加一项，
 * 求值器不感知具体实现。
 */
import { GeneratorError } from '../../errors.mjs'
import { jsString, jsxString } from '../../js-literal.mjs'

export { jsString, jsxString }

function hasContent(value) {
  if (value == null) return false
  if (typeof value === 'string') return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function uncapitalize(text) {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text
}

/** 内建函数表：名称 → 实现 */
export const BUILTINS = new Map([
  ['has_content', (value) => hasContent(value)],
  ['js', (value) => jsString(value)],
  ['jsx', (value) => jsxString(value)],
  ['java', (value) => JSON.stringify(String(value ?? ''))],
  ['size', (value) => value?.length ?? 0],
  ['length', (value) => value?.length ?? 0],
  ['upper_case', (value) => String(value ?? '').toUpperCase()],
  ['lower_case', (value) => String(value ?? '').toLowerCase()],
  ['cap_first', (value) => capitalize(String(value ?? ''))],
  ['uncap_first', (value) => uncapitalize(String(value ?? ''))],
  ['trim', (value) => String(value ?? '').trim()],
  ['c', (value) => String(value ?? '')],
  ['default', (value, args) => value ?? args[0]],
  [
    'join',
    (value, args) =>
      Array.isArray(value) ? value.join(args[0] ?? ', ') : String(value ?? ''),
  ],
  [
    'replace',
    (value, args) =>
      String(value ?? '')
        .split(String(args[0]))
        .join(String(args[1])),
  ],
  ['contains', (value, args) => String(value ?? '').includes(String(args[0]))],
  [
    'starts_with',
    (value, args) => String(value ?? '').startsWith(String(args[0])),
  ],
  ['ends_with', (value, args) => String(value ?? '').endsWith(String(args[0]))],
])

/** 应用内建；未注册的名称直接报错，避免模板静默产出错误内容 */
export function applyBuiltin(value, name, args = []) {
  const builtin = BUILTINS.get(name)
  if (!builtin) throw new GeneratorError(`FTL 不支持的内建: ?${name}`)
  return builtin(value, args)
}
