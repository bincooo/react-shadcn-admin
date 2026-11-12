/**
 * 表达式求值：把表达式字符串解析并求值。
 *
 * 采用「优先级爬升」而不是多层嵌套递归函数：
 * 运算符的优先级、结合性与实现集中在 BINARY_OPERATORS 表里，
 * 增加运算符不需要改动解析流程。
 */
import { GeneratorError } from '../../errors.mjs'
import { RELATIONAL_ALIASES, TOKEN } from '../tokens.mjs'
import { applyBuiltin } from './builtins.mjs'
import { lexExpression } from './lexer.mjs'

/** 二元运算符：符号 → { precedence, apply } */
const BINARY_OPERATORS = new Map([
  [
    '||',
    { precedence: 1, apply: (left, right) => Boolean(left) || Boolean(right) },
  ],
  [
    'or',
    { precedence: 1, apply: (left, right) => Boolean(left) || Boolean(right) },
  ],
  [
    '&&',
    { precedence: 2, apply: (left, right) => Boolean(left) && Boolean(right) },
  ],
  [
    'and',
    { precedence: 2, apply: (left, right) => Boolean(left) && Boolean(right) },
  ],
  ['==', { precedence: 3, apply: (left, right) => left === right }],
  ['!=', { precedence: 3, apply: (left, right) => left !== right }],
  ['>', { precedence: 4, apply: (left, right) => left > right }],
  ['<', { precedence: 4, apply: (left, right) => left < right }],
  ['>=', { precedence: 4, apply: (left, right) => left >= right }],
  ['<=', { precedence: 4, apply: (left, right) => left <= right }],
  [
    '+',
    {
      precedence: 5,
      apply: (left, right) =>
        typeof left === 'string' || typeof right === 'string'
          ? `${left ?? ''}${right ?? ''}`
          : Number(left) + Number(right),
    },
  ],
])

/** 一元运算符：符号 → apply */
const UNARY_OPERATORS = new Map([
  ['!', (value) => !value],
  ['not', (value) => !value],
])

/** 字面量关键字 */
const LITERALS = new Map([
  ['true', true],
  ['false', false],
  ['null', null],
])

/** 把 token 归一化成运算符名（支持 gt / lt 之类的单词别名） */
function operatorName(token) {
  if (token?.type === TOKEN.IDENT) {
    return RELATIONAL_ALIASES[token.value] ?? token.value
  }
  return token?.type === TOKEN.OP ? token.value : undefined
}

/** 是否当前 token 就是指定运算符（含单词别名） */
function matchesOperator(token, name) {
  return operatorName(token) === name
}

/** 沿 scope 链查找变量 */
function resolveVariable(name, scope) {
  for (let current = scope; current; current = current.parent) {
    if (Object.hasOwn(current.vars, name)) return current.vars[name]
  }
  return undefined
}

export function evaluateExpression(input, scope) {
  const tokens = lexExpression(input)
  let position = 0

  const peek = () => tokens[position]
  const take = () => tokens[position++]
  const isOperator = (name) => matchesOperator(peek(), name)

  /** 括号表达式 */
  function parseParenthesized() {
    if (!isOperator('(')) throw new GeneratorError(`FTL 括号未闭合: ${input}`)
    take()
    const value = parseBinary(0)
    if (!isOperator(')')) throw new GeneratorError(`FTL 括号未闭合: ${input}`)
    take()
    return value
  }

  /** 内建调用参数列表 */
  function parseArguments() {
    const args = []
    if (!isOperator('(')) return args
    take()
    while (!isOperator(')')) {
      args.push(parseBinary(0))
      if (isOperator(',')) take()
    }
    take()
    return args
  }

  /** 后缀：属性访问 `.name` 与内建 `?name(args)` */
  function parsePostfix() {
    let value = parsePrimary()
    while (true) {
      if (isOperator('.')) {
        take()
        const token = take()
        if (token?.type !== TOKEN.IDENT) {
          throw new GeneratorError(`FTL 属性访问语法错误: ${input}`)
        }
        value = value?.[token.value]
        continue
      }
      if (isOperator('?')) {
        take()
        const token = take()
        if (token?.type !== TOKEN.IDENT) {
          throw new GeneratorError(`FTL 内建语法错误: ${input}`)
        }
        value = applyBuiltin(value, token.value, parseArguments())
        continue
      }
      break
    }
    return value
  }

  function parseUnary() {
    const name = operatorName(peek())
    if (name && UNARY_OPERATORS.has(name)) {
      take()
      return UNARY_OPERATORS.get(name)(parseUnary())
    }
    return parsePostfix()
  }

  /** 优先级爬升：只吃优先级不低于 minPrecedence 的运算符 */
  function parseBinary(minPrecedence) {
    let left = parseUnary()
    while (true) {
      const name = operatorName(peek())
      const operator = name && BINARY_OPERATORS.get(name)
      if (!operator || operator.precedence < minPrecedence) break
      take()
      const right = parseBinary(operator.precedence + 1)
      left = operator.apply(left, right)
    }
    return left
  }

  function parsePrimary() {
    const token = take()
    if (!token) throw new GeneratorError(`FTL 表达式为空: ${input}`)
    if (token.type === TOKEN.STRING || token.type === TOKEN.NUMBER) {
      return token.value
    }
    if (token.type === TOKEN.IDENT) {
      return LITERALS.has(token.value)
        ? LITERALS.get(token.value)
        : resolveVariable(token.value, scope)
    }
    if (token.type === TOKEN.OP && token.value === '(') {
      position -= 1
      return parseParenthesized()
    }
    throw new GeneratorError(`FTL 表达式语法错误: ${input}`)
  }

  const result = parseBinary(0)
  if (position < tokens.length) {
    throw new GeneratorError(`FTL 表达式多余内容: ${input}`)
  }
  return result
}
