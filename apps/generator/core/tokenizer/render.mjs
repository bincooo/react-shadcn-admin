/**
 * AST 渲染：把节点树求值成文本。
 *
 * 每种节点类型注册一个 render 函数，渲染器只做遍历与拼接。
 */
import { NODE } from './tokens.mjs'
import { evaluateExpression } from './expression/evaluate.mjs'

/** 把求值结果转成输出文本（对象不参与输出，数组用逗号连接） */
export function stringify(value) {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(stringify).join(', ')
  if (typeof value === 'object') return ''
  return String(value)
}

/** 创建子作用域：用于 list 循环变量 */
function childScope(scope, vars) {
  return { vars, parent: scope }
}

/** 节点类型 → 渲染实现；第三个参数是递归渲染入口 */
const RENDERERS = new Map([
  [NODE.TEXT, (node) => node.value],
  [
    NODE.INTERP,
    (node, scope) => stringify(evaluateExpression(node.value, scope)),
  ],
  [
    NODE.ASSIGN,
    (node, scope) => {
      scope.vars[node.name] = evaluateExpression(node.expr, scope)
      return ''
    },
  ],
  [
    NODE.IF,
    (node, scope, render) => {
      for (const branch of node.branches) {
        if (evaluateExpression(branch.test, scope)) {
          return render(branch.body, scope)
        }
      }
      return render(node.elseBody, scope)
    },
  ],
  [
    NODE.LIST,
    (node, scope, render) => {
      const sequence = evaluateExpression(node.seq, scope)
      const items = Array.isArray(sequence) ? sequence : []
      let output = ''
      for (let index = 0; index < items.length; index += 1) {
        output += render(
          node.body,
          childScope(scope, {
            [node.item]: items[index],
            [`${node.item}_index`]: index,
            [`${node.item}_has_next`]: index < items.length - 1,
          }),
        )
      }
      return output
    },
  ],
])

/** 递归渲染节点列表 */
export function renderNodes(nodes, scope) {
  let output = ''
  for (const node of nodes) {
    const renderer = RENDERERS.get(node.type)
    if (!renderer) continue
    output += renderer(node, scope, renderNodes)
  }
  return output
}

/** 顶层作用域：模型作为根变量 */
export function createScope(model) {
  return { vars: model, parent: null }
}
