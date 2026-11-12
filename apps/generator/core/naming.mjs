/** 命名转换工具：表名 / 类名 / 字段名 / 路由。纯函数，可在浏览器与 Node 复用。 */
import { JAVA_RESERVED_WORDS } from './constants.mjs'

function splitWords(value) {
  return String(value ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase())
}

export function toPascal(value) {
  return splitWords(value)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

export function toCamel(value) {
  const pascalValue = toPascal(value)
  return pascalValue
    ? pascalValue.charAt(0).toLowerCase() + pascalValue.slice(1)
    : ''
}

export function toSnake(value) {
  return splitWords(value).join('_')
}

export function toKebab(value) {
  return splitWords(value).join('-')
}

/** 生成合法 Java 标识符：数字开头补前缀，关键字追加 Value。 */
export function toJavaIdentifier(value) {
  let identifier = toCamel(value)
  if (!identifier) return 'field'
  if (/^[0-9]/.test(identifier)) identifier = `field${toPascal(identifier)}`
  if (JAVA_RESERVED_WORDS.has(identifier)) identifier = `${identifier}Value`
  return identifier
}

/** 包路径 com.example.ddd -> com/example/ddd */
export function packageToPath(basePackage) {
  return String(basePackage).split('.').filter(Boolean).join('/')
}

/** REST 路由：取实体类名的小写形式（Order -> order） */
export function entityToRoute(entityName) {
  return String(entityName ?? '').toLowerCase()
}
