/** 生成器可预期错误：携带 issues 列表，便于 API / CLI 直接展示。 */
export class GeneratorError extends Error {
  constructor(message, issues = []) {
    super(message)
    this.name = 'GeneratorError'
    this.issues = issues
  }
}

export function assert(condition, message, issues = []) {
  if (!condition) throw new GeneratorError(message, issues)
}

export function formatIssues(error) {
  if (error instanceof GeneratorError && error.issues.length > 0) {
    return `${error.message}\n- ${error.issues.join('\n- ')}`
  }
  return error instanceof Error ? error.message : String(error)
}
