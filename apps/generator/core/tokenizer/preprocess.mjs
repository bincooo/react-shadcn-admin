/**
 * 指令行清理：把“整行只有 FTL 标签 / 注释”的行压成标签本身，
 * 去掉缩进与行尾换行，避免生成结果里出现大量空白行。
 *
 * 这是渲染前的源码预处理，不属于词法分析本身。
 */
import { findCommentEnd, findTagEnd, nextTagIndex } from './scanner.mjs'
import { COMMENT_OPEN, TAG_CLOSE, TAG_OPEN } from './tokens.mjs'

/** 去掉一行里的所有标签，只留纯文本 */
function stripTagsFromLine(line) {
  let rest = line
  while (true) {
    const start = nextTagIndex(rest, 0)
    if (start === -1) break
    const closing = rest.startsWith(TAG_CLOSE, start)
    const openLength = closing ? TAG_CLOSE.length : TAG_OPEN.length
    const end = findTagEnd(rest, start + openLength)
    rest = `${rest.slice(0, start)}${rest.slice(end + 1)}`
  }
  return rest
}

/** 去掉整行的 FTL 注释 */
function stripComments(line) {
  let rest = line
  let index = rest.indexOf(COMMENT_OPEN)
  while (index !== -1) {
    const end = findCommentEnd(rest, index + COMMENT_OPEN.length)
    rest = `${rest.slice(0, index)}${rest.slice(end)}`
    index = rest.indexOf(COMMENT_OPEN)
  }
  return rest
}

/**
 * 逐行处理源码：
 * - 空行保留（最后一行除外）
 * - 只含标签 / 注释的行，输出去掉缩进后的标签本身，且不补换行
 * - 其余行原样输出，非末行补换行
 */
export function stripDirectiveLines(source) {
  const lines = source.split('\n')
  let output = ''
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const isLast = index === lines.length - 1
    const trimmed = line.trim()

    if (!trimmed) {
      if (!isLast) output += '\n'
      continue
    }

    const hasTag = nextTagIndex(trimmed, 0) !== -1
    if (hasTag && stripTagsFromLine(stripComments(trimmed)).trim() === '') {
      // 指令行：只保留标签本身，去掉缩进与换行
      output += trimmed
      continue
    }

    output += line
    if (!isLast) output += '\n'
  }
  return output
}
