/**
 * 语法分析：把 token 流转成 AST。
 *
 * 解析器只负责游标推进、块结束判定与错误上报；
 * 具体标签的语法由 parser/tags.mjs 的处理器负责。
 */
import { GeneratorError } from '../errors.mjs'
import { BRANCH_ELSE, BRANCH_ELSEIF, TOKEN } from './tokens.mjs'
import { findTagHandler } from './parser/tags.mjs'

/** 游标：在 token 数组上前进，并提供递归解析入口 */
function createCursor(tokens) {
  let position = 0

  const cursor = {
    /** 当前标签文本（仅当当前 token 是 tag） */
    currentTag() {
      return tokens[position]?.value
    },
    advance() {
      position += 1
    },
    /**
     * 解析一段节点，直到遇到 `stops` 中的块结束标签。
     * 返回 `{ nodes, stop }`，stop 为 null 表示已到输入末尾。
     */
    parseNodes(stops) {
      const nodes = []
      while (position < tokens.length) {
        const token = tokens[position]

        if (token.type !== TOKEN.TAG) {
          nodes.push(token)
          position += 1
          continue
        }

        const tag = token.value

        if (tag.startsWith('/')) {
          const name = tag.slice(1).trim()
          if (stops.includes(name)) return { nodes, stop: name }
          throw new GeneratorError(`FTL 意外的结束标签 </${name}>`)
        }

        if (tag === BRANCH_ELSE || tag.startsWith(`${BRANCH_ELSEIF} `)) {
          const name = tag === BRANCH_ELSE ? BRANCH_ELSE : BRANCH_ELSEIF
          if (stops.includes(name)) return { nodes, stop: name }
          throw new GeneratorError(`FTL 意外的分支标签 <#${tag}>`)
        }

        const handler = findTagHandler(tag)
        if (!handler) throw new GeneratorError(`FTL 不支持的标签: <#${tag}>`)

        const result = handler.parse(cursor, tag)
        if (result.node) nodes.push(result.node)
      }
      return { nodes, stop: null }
    },
  }

  return cursor
}

export function parse(tokens) {
  return createCursor(tokens).parseNodes([]).nodes
}
