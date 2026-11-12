/**
 * 表达式词法分析：把 `<#if ...>` / `${...}` 里的表达式切成 token。
 */
import { GeneratorError } from '../../errors.mjs'
import {
  MULTI_CHAR_OPS,
  SINGLE_CHAR_OPS,
  STRING_ESCAPES,
  TOKEN,
} from '../tokens.mjs'

const isWhitespace = (char) => /\s/.test(char)
const isDigit = (char) => /[0-9]/.test(char)
const isIdentStart = (char) => /[A-Za-z_$]/.test(char)
const isIdentPart = (char) => /[\w$]/.test(char)

/** 读取字符串字面量，处理反斜杠转义 */
function readString(input, start) {
  const quote = input[start]
  let value = ''
  let index = start + 1
  while (index < input.length) {
    const char = input[index]
    if (char === '\\') {
      const escaped = input[index + 1]
      value += STRING_ESCAPES[escaped] ?? escaped ?? ''
      index += 2
      continue
    }
    if (char === quote) {
      return { value, end: index + 1 }
    }
    value += char
    index += 1
  }
  throw new GeneratorError(`FTL 字符串未闭合: ${input}`)
}

/** 连续满足 predicate 的字符数（从 start 起） */
function readWhile(input, start, predicate) {
  let index = start
  while (index < input.length && predicate(input[index])) index += 1
  return index
}

/** 读取数字字面量（整数或小数） */
function readNumber(input, start) {
  const end = readWhile(input, start, (char) => /[0-9.]/.test(char))
  return { value: Number(input.slice(start, end)), end }
}

/** 读取标识符 / 关键字 */
function readIdent(input, start) {
  const end = readWhile(input, start, isIdentPart)
  return { value: input.slice(start, end), end }
}

export function lexExpression(input) {
  const tokens = []
  let index = 0

  while (index < input.length) {
    const char = input[index]

    if (isWhitespace(char)) {
      index += 1
      continue
    }

    if (char === '"' || char === "'") {
      const { value, end } = readString(input, index)
      tokens.push({ type: TOKEN.STRING, value })
      index = end
      continue
    }

    if (isDigit(char)) {
      const { value, end } = readNumber(input, index)
      tokens.push({ type: TOKEN.NUMBER, value })
      index = end
      continue
    }

    if (isIdentStart(char)) {
      const { value, end } = readIdent(input, index)
      tokens.push({ type: TOKEN.IDENT, value })
      index = end
      continue
    }

    const pair = input.slice(index, index + 2)
    if (MULTI_CHAR_OPS.includes(pair)) {
      tokens.push({ type: TOKEN.OP, value: pair })
      index += 2
      continue
    }

    if (SINGLE_CHAR_OPS.includes(char)) {
      tokens.push({ type: TOKEN.OP, value: char })
      index += 1
      continue
    }

    throw new GeneratorError(`FTL 表达式无法识别: ${input}`)
  }

  return tokens
}
