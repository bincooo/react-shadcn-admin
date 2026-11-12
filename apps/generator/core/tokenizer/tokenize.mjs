/**
 * 模板词法分析：把源码切成 text / interp / tag 三类 token。
 *
 * 注释在词法阶段直接丢弃；`\${` 作为转义输出字面量 `${`。
 */
import {
  findCommentEnd,
  findInterpolationEnd,
  findTagEnd,
  nextMarker,
} from './scanner.mjs'
import {
  COMMENT_OPEN,
  ESCAPED_INTERPOLATION,
  INTERPOLATION_OPEN,
  TAG_CLOSE,
  TAG_OPEN,
  TOKEN,
} from './tokens.mjs'

/** 解析一个标签 token 的 value：区分开始 / 结束标签 */
function tagValue(source, start) {
  const closing = source.startsWith(TAG_CLOSE, start)
  const contentStart = start + (closing ? TAG_CLOSE.length : TAG_OPEN.length)
  const end = findTagEnd(source, contentStart)
  return {
    value: `${closing ? '/' : ''}${source.slice(contentStart, end).trim()}`,
    end,
  }
}

export function tokenize(source) {
  const tokens = []
  let index = 0

  while (index < source.length) {
    const next = nextMarker(source, index)
    if (next === -1) {
      tokens.push({ type: TOKEN.TEXT, value: source.slice(index) })
      break
    }
    if (next > index) {
      tokens.push({ type: TOKEN.TEXT, value: source.slice(index, next) })
    }

    // `\${` → 字面量 `${`（用于在模板里写 JS 模板字符串）
    if (source.startsWith(ESCAPED_INTERPOLATION, next)) {
      tokens.push({ type: TOKEN.TEXT, value: INTERPOLATION_OPEN })
      index = next + ESCAPED_INTERPOLATION.length
      continue
    }

    if (source.startsWith(INTERPOLATION_OPEN, next)) {
      const end = findInterpolationEnd(source, next + INTERPOLATION_OPEN.length)
      tokens.push({
        type: TOKEN.INTERP,
        value: source.slice(next + INTERPOLATION_OPEN.length, end),
      })
      index = end + 1
      continue
    }

    if (source.startsWith(COMMENT_OPEN, next)) {
      index = findCommentEnd(source, next + COMMENT_OPEN.length)
      continue
    }

    const tag = tagValue(source, next)
    tokens.push({ type: TOKEN.TAG, value: tag.value })
    index = tag.end + 1
  }

  return tokens
}
