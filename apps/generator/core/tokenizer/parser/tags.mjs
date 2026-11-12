/**
 * 标签处理器注册表。
 *
 * 每种 FTL 标签一个处理器：负责从 token 流中读取自身参数、递归解析子节点，
 * 产出对应 AST 节点。新增标签只需注册一个 handler，解析器本身无需修改。
 *
 * handler 签名：
 *   (cursor, tag) => { node? }
 * - `node` 产出的 AST 节点
 */
import { GeneratorError } from '../../errors.mjs'
import { BRANCH_ELSE, BRANCH_ELSEIF, NODE } from '../tokens.mjs'

/** 解析 `<#list seq as item>` 的参数 */
function parseListArgs(tag) {
  const rest = tag.slice('list '.length).trim()
  const match = /^(.+?)\s+as\s+([A-Za-z_$][\w$]*)$/.exec(rest)
  if (!match) throw new GeneratorError(`FTL list 语法错误: ${tag}`)
  return { seq: match[1], item: match[2] }
}

/** 解析 `<#assign name = expr>` 的参数 */
function parseAssignArgs(tag) {
  const rest = tag.slice('assign '.length)
  const eq = rest.indexOf('=')
  if (eq === -1) throw new GeneratorError(`FTL assign 语法错误: ${tag}`)
  return {
    name: rest.slice(0, eq).trim(),
    expr: rest.slice(eq + 1).trim(),
  }
}

/** 块标签：`<#if>` 支持 elseif / else 分支 */
function parseIf(cursor, tag) {
  cursor.advance()
  const branches = []
  let test = tag.slice('if '.length).trim()
  let elseBody = []

  while (true) {
    const body = cursor.parseNodes([BRANCH_ELSEIF, BRANCH_ELSE, 'if'])
    branches.push({ test, body: body.nodes })
    if (body.stop === BRANCH_ELSEIF) {
      test = cursor.currentTag().slice(BRANCH_ELSEIF.length).trim()
      cursor.advance()
      continue
    }
    if (body.stop === BRANCH_ELSE) {
      cursor.advance()
      elseBody = cursor.parseNodes(['if']).nodes
      cursor.advance()
      break
    }
    cursor.advance()
    break
  }

  return { node: { type: NODE.IF, branches, elseBody } }
}

/** 块标签：`<#list>` */
function parseList(cursor, tag) {
  const { seq, item } = parseListArgs(tag)
  cursor.advance()
  const body = cursor.parseNodes(['list'])
  cursor.advance()
  return { node: { type: NODE.LIST, seq, item, body: body.nodes } }
}

/** 叶子标签：`<#assign>` */
function parseAssign(cursor, tag) {
  const { name, expr } = parseAssignArgs(tag)
  cursor.advance()
  return { node: { type: NODE.ASSIGN, name, expr } }
}

/** 按标签前缀匹配；`if` / `list` / `assign` 需要带空格的参数 */
const TAG_HANDLERS = [
  { name: 'if', match: (tag) => tag.startsWith('if '), parse: parseIf },
  { name: 'list', match: (tag) => tag.startsWith('list '), parse: parseList },
  {
    name: 'assign',
    match: (tag) => tag.startsWith('assign '),
    parse: parseAssign,
  },
]

/** 找到标签对应的处理器 */
export function findTagHandler(tag) {
  return TAG_HANDLERS.find((handler) => handler.match(tag))
}
