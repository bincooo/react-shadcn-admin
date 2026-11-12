/**
 * 源码扫描工具：在 FTL 源码中定位标签 / 插值 / 注释的边界。
 *
 * 只做位置计算，不产生 token，供 tokenizer 与指令行清理共用。
 */
import { GeneratorError } from '../errors.mjs'
import {
  COMMENT_CLOSE,
  ESCAPED_INTERPOLATION,
  INTERPOLATION_OPEN,
  TAG_CLOSE,
  TAG_OPEN,
} from './tokens.mjs'

/** 找到下一个 FTL 标签起点（支持 `<#...>` 与 `</#...>`） */
export function nextTagIndex(source, from) {
  const open = source.indexOf(TAG_OPEN, from)
  const close = source.indexOf(TAG_CLOSE, from)
  if (open === -1) return close
  if (close === -1) return open
  return Math.min(open, close)
}

/** 找到标签结束的 `>`，跳过字符串字面量中的 `>` */
export function findTagEnd(source, start) {
  let quote = null
  for (let index = start; index < source.length; index += 1) {
    const char = source[index]
    if (quote) {
      if (char === '\\') {
        index += 1
      } else if (char === quote) {
        quote = null
      }
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '>') return index
  }
  throw new GeneratorError('FTL 标签未闭合')
}

/** 找到 `${` 对应的 `}`，跳过字符串字面量与嵌套花括号 */
export function findInterpolationEnd(source, start) {
  let quote = null
  let depth = 0
  for (let index = start; index < source.length; index += 1) {
    const char = source[index]
    if (quote) {
      if (char === '\\') {
        index += 1
      } else if (char === quote) {
        quote = null
      }
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') {
      if (depth === 0) return index
      depth -= 1
    }
  }
  throw new GeneratorError('FTL 插值未闭合')
}

/** 找到注释结束位置；返回 `-->` 之后的下标 */
export function findCommentEnd(source, start) {
  const end = source.indexOf(COMMENT_CLOSE, start)
  if (end === -1) throw new GeneratorError('FTL 注释未闭合')
  return end + COMMENT_CLOSE.length
}

/**
 * 找出源码中下一个“有意义”的标记位置。
 * 同时考虑插值、标签与转义插值，取最靠前者。
 */
export function nextMarker(source, from) {
  const candidates = [
    source.indexOf(INTERPOLATION_OPEN, from),
    nextTagIndex(source, from),
    source.indexOf(ESCAPED_INTERPOLATION, from),
  ].filter((index) => index !== -1)
  return candidates.length === 0 ? -1 : Math.min(...candidates)
}
