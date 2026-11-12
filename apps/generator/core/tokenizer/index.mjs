/**
 * 模板引擎门面：对外只暴露 `renderTemplate`。
 *
 * 内部流水线：
 *   repository（读取 + 缓存 AST）
 *     → render（遍历 AST + 表达式求值）
 *
 * 调用方不需要了解分词、解析、求值等细节。
 */
import { GeneratorError } from '../errors.mjs'
import { createScope, renderNodes } from './render.mjs'
import { loadTemplate } from './repository.mjs'

/**
 * 渲染模板。
 *
 * @param name  模板相对 templates/ 的路径，如 `frontend/table.ftl`
 * @param model 模板根作用域的变量
 */
export function renderTemplate(name, model) {
  const ast = loadTemplate(name)
  try {
    return renderNodes(ast, createScope(model))
  } catch (error) {
    if (error instanceof GeneratorError) {
      throw new GeneratorError(`[${name}] ${error.message}`)
    }
    throw error
  }
}
