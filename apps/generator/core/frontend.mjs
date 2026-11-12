/**
 * 前端生成入口：core 只负责把定义整理成模板模型，
 * 生成文本（类型、导入、校验、控件）全部由 templates/frontend/*.ftl 决定。
 */
import { renderTemplate } from './tokenizer/index.mjs'
import { buildModel } from './model.mjs'
import { toKebab } from './naming.mjs'

export function generateFrontendFiles(ctx) {
  const kebab = toKebab(ctx.entity)
  const root = `frontend/${ctx.module}/${kebab}`
  const model = buildModel(ctx)
  const files = [
    ['types.ts', 'frontend/types.ftl'],
    ['api.ts', 'frontend/api.ftl'],
    [`modules/use-${kebab}.ts`, 'frontend/use.ftl'],
    ['modules/table.tsx', 'frontend/table.ftl'],
    ['modules/dialog.tsx', 'frontend/dialog.ftl'],
    ['index.tsx', 'frontend/index.ftl'],
  ]
  return files.map(([file, template]) => ({
    path: `${root}/${file}`,
    content: renderTemplate(template, model),
  }))
}
