/** 模板输出里常用的 JS / JSX 字面量格式化，供模型与表达式内建共用。 */

/** 单引号 JS 字符串字面量 */
export function jsString(value) {
  return `'${String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")}'`
}

/** JSX 文本表达式：{"中文"} */
export function jsxString(value) {
  return `{${JSON.stringify(String(value ?? ''))}}`
}
