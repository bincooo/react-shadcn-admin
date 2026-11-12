/**
 * Java 各层模板的渲染入口：模板模型固定为 buildModel(ctx)，
 * 各层只追加自己需要的 imports / 派生字段。
 */
import { renderTemplate } from '../tokenizer/index.mjs'
import { buildModel } from '../model.mjs'

export function renderJava(ctx, template, extra = {}) {
  return renderTemplate(template, { ...buildModel(ctx), ...extra })
}
