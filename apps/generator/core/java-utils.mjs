/** Java 模板辅助：import 推导与文本判定（不生成任何代码文本）。 */

export function escapeJavaString(value) {
  return JSON.stringify(String(value ?? ''))
}

/** 列的业务名称：优先注释，其次展示名，最后列名。 */
export function columnLabel(column) {
  return column.comment || column.label || column.name
}

/** 列类型 → 固定的 Java import */
const FIXED_TYPE_IMPORTS = {
  decimal: 'java.math.BigDecimal',
  date: 'java.time.LocalDate',
  datetime: 'java.time.Instant',
}

/** 由列类型推导需要的 Java import */
export function typeImports(columns, ctx) {
  const imports = []
  for (const column of columns) {
    const fixed = FIXED_TYPE_IMPORTS[column.type]
    if (fixed) imports.push(fixed)
    if (column.type === 'enum') {
      imports.push(`${ctx.pkgs.domainModel}.${ctx.enumNames.get(column.id)}`)
    }
  }
  return imports
}

export function isTextLike(column) {
  return ['string', 'text', 'json', 'uuid'].includes(column.type)
}
