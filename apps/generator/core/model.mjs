/**
 * 模板数据模型（config 结构体）：把 ctx 里带函数 / Map 的结构转成纯对象，
 * 供 .ftl 模板直接读取。用户修改模板时只需了解这里暴露的字段。
 */
import { columnLabel, escapeJavaString, isTextLike } from './java-utils.mjs'
import { jsString, jsxString } from './js-literal.mjs'
import { toKebab, toPascal, toSnake } from './naming.mjs'

const NUMERIC_TYPES = new Set(['integer', 'long', 'decimal'])

/** 前端 TS 类型：主键/数字为 number，枚举为字面量联合 */
function tsTypeOf(ctx, column) {
  if (ctx.isPk(column)) return column.type === 'integer' ? 'number' : 'string'
  if (NUMERIC_TYPES.has(column.type)) return 'number'
  if (column.type === 'boolean') return 'boolean'
  if (column.type === 'enum') {
    const values = column.enumValues ?? []
    return values.length ? values.map(jsString).join(' | ') : 'string'
  }
  return 'string'
}

function upperSnake(value) {
  return toSnake(value).toUpperCase()
}

/** `<Input>` 的 type 属性；空字符串表示普通文本框 */
function inputTypeOf(type, isNumeric) {
  if (type === 'date') return 'date'
  if (type === 'datetime') return 'datetime-local'
  if (isNumeric) return 'number'
  return ''
}

/** 列表列宽：按类型给出展示宽度，属于纯数据派生 */
function columnWidth(column) {
  if (column.type === 'text' || column.type === 'json') return 220
  if (column.type === 'datetime') return 170
  if (column.type === 'date') return 120
  if (column.type === 'boolean') return 90
  if (NUMERIC_TYPES.has(column.type) || column.type === 'enum') return 120
  return Math.min(Math.max((column.length ?? 16) * 8, 120), 220)
}

function columnModel(ctx, column) {
  const label = column.label || column.comment || column.name
  const comment = columnLabel(column)
  const width = columnWidth(column)
  const isNumeric = NUMERIC_TYPES.has(column.type)
  const pascalName = toPascal(column.javaName)
  const enumValues = column.enumValues ?? []
  const enumDescriptions = column.enumDescriptions ?? {}
  return {
    ...column,
    javaType: ctx.javaTypeOf(column),
    /** 前端 TS 类型（含枚举联合类型） */
    tsType: tsTypeOf(ctx, column),
    /** 可选字段标记：`?` 或空串 */
    optional: column.nullable ? '?' : '',
    enumName: column.type === 'enum' ? ctx.enumNames.get(column.id) : null,
    isPk: ctx.isPk(column),
    isAudit: ctx.isAudit(column),
    isEnum: column.type === 'enum',
    isNumeric,
    isTextLike: isTextLike(column),
    isString: column.type === 'string',
    isText: column.type === 'text',
    isInteger: column.type === 'integer',
    isLong: column.type === 'long',
    isDecimal: column.type === 'decimal',
    isBoolean: column.type === 'boolean',
    isDate: column.type === 'date',
    isDateTime: column.type === 'datetime',
    isJson: column.type === 'json',
    isUuid: column.type === 'uuid',
    /** 列表列宽与最小宽度 */
    width,
    minWidth: Math.round(width * 0.75),
    /** 表单控件 id：`<entity-kebab>-<javaName>` */
    inputId: `${toKebab(ctx.entity)}-${column.javaName}`,
    /** 枚举下拉常量名 */
    optionsName: `${column.name.toUpperCase()}_OPTIONS`,
    /** 枚举选项数据（模板直接遍历渲染） */
    enumItems: (enumValues.length ? enumValues : ['ENABLED', 'DISABLED']).map(
      (value) => ({ value, label: enumDescriptions[value] || value }),
    ),
    /** Java 枚举常量：值 + 说明（空值回退 UNKNOWN） */
    enumEntries: (enumValues.length ? enumValues : ['UNKNOWN']).map(
      (value) => ({
        value,
        description: enumDescriptions[value] || '',
      }),
    ),
    /** 枚举允许值，用于校验 */
    enumValues,
    /** 枚举允许值的 JS 字面量列表，如 `'NEW', 'PAID'` */
    enumValuesJs: enumValues.map(jsString).join(', '),
    /** 枚举表单初值：默认值，缺省取第一个枚举值 */
    enumDefault: column.defaultValue || enumValues[0] || '',
    enumDescriptions,
    inputType: inputTypeOf(column.type, isNumeric),
    step: isNumeric ? (column.type === 'decimal' ? '0.01' : '1') : '',
    /** 表单初值（字符串表单模型） */
    defaultJs: String(column.defaultValue ?? ''),
    label,
    comment,
    escapedComment: escapeJavaString(comment),
    upperSnake: upperSnake(column.name),
    pascal: pascalName,
    getter: `${column.javaName}()`,
    setter: `set${pascalName}`,
    changeMethod: `change${pascalName}`,
  }
}

/** 模板里常用的“是否存在某类字段”标志，避免模板自行遍历判断 */
function featuresOf(columns) {
  return {
    hasBoolean: columns.some((column) => column.isBoolean),
    hasDate: columns.some((column) => column.isDate),
    hasDateTime: columns.some((column) => column.isDateTime),
    hasEnum: columns.some((column) => column.isEnum),
    hasTextarea: columns.some((column) => column.isText || column.isJson),
    hasInput: columns.some(
      (column) =>
        !column.isBoolean && !column.isEnum && !column.isText && !column.isJson,
    ),
    hasEnumInput: columns.some(
      (column) => column.isEnum && column.enumValues.length > 0,
    ),
  }
}

/**
 * 构造所有模板共用的基础模型。
 *
 * 同一次生成里 20+ 个模板都调用本函数，而 ctx 在一次生成中不变，
 * 因此按 ctx 缓存结果：模板只读取模型，不做任何修改。
 */
const modelCache = new WeakMap()

export function buildModel(ctx) {
  const cached = modelCache.get(ctx)
  if (cached) return cached

  const columns = ctx.definition.columns.map((column) =>
    columnModel(ctx, column),
  )
  const byId = new Map(columns.map((column) => [column.id, column]))
  const mapColumns = (list) =>
    list.map((column) => byId.get(column.id)).filter(Boolean)
  const tableComment =
    ctx.definition.comment || ctx.definition.displayName || ctx.definition.name

  const model = {
    definition: ctx.definition,
    entity: ctx.entity,
    entityVar: ctx.entityVar,
    entityId: ctx.entityId,
    entityKebab: toKebab(ctx.entity),
    module: ctx.module,
    base: ctx.base,
    route: ctx.route,
    packagePath: ctx.packagePath,
    pkgs: ctx.pkgs,
    options: ctx.definition.options,
    displayName: ctx.definition.displayName,
    displayNameJs: jsString(ctx.definition.displayName),
    displayNameJsx: jsxString(ctx.definition.displayName),
    tableComment,
    tableCommentJs: jsString(tableComment),
    tableCommentJsx: jsxString(tableComment),
    pk: ctx.pk ? byId.get(ctx.pk.id) : null,
    columns,
    createColumns: mapColumns(ctx.createColumns),
    editableColumns: mapColumns(ctx.editableColumns),
    nonPkColumns: mapColumns(ctx.nonPkColumns),
    queryableColumns: mapColumns(ctx.queryableColumns),
    uniqueColumns: mapColumns(ctx.uniqueColumns),
    enumColumns: columns.filter((column) => column.isEnum),
    businessColumns: columns.filter(
      (column) => !column.isPk && !column.isAudit,
    ),
    auditColumns: columns.filter((column) => column.isAudit),
    createdColumn: ctx.createdColumn ? byId.get(ctx.createdColumn.id) : null,
    updatedColumn: ctx.updatedColumn ? byId.get(ctx.updatedColumn.id) : null,
    updatedByColumn: ctx.updatedByColumn
      ? byId.get(ctx.updatedByColumn.id)
      : null,
  }
  // 标志位基于业务列计算（新增 / 编辑表单只关心可编辑字段）
  model.features = featuresOf(model.businessColumns)
  model.allFeatures = featuresOf(columns)
  // 删除确认框展示用的列：优先第一个文本类业务字段，其次第一个业务字段，最后主键
  model.displayColumn =
    model.businessColumns.find((column) =>
      ['string', 'text', 'uuid', 'enum'].includes(column.type),
    ) ??
    model.businessColumns[0] ??
    model.pk
  // 聚合字段：ID / 审计时间戳之外的字段（模板直接遍历）
  model.aggregateFields = model.nonPkColumns.filter(
    (column) =>
      column.id !== model.createdColumn?.id &&
      column.id !== model.updatedColumn?.id,
  )
  model.restoreAssignColumns = model.nonPkColumns.filter(
    (column) => column.id !== model.createdColumn?.id,
  )
  // 领域/应用层常用类名
  model.domainException = `${model.entity}DomainException`
  model.notFoundException = `${model.entity}NotFoundException`
  model.createdEvent = `${model.entity}CreatedEvent`
  model.repositoryField = `${model.entityVar}Repository`
  model.loaderField = `${model.entityVar}Loader`
  modelCache.set(ctx, model)
  return model
}

/** 去重排序后的 import 列表，模板里用 <#list imports as imp> 输出 */
export function uniqueImports(fqns) {
  return [...new Set(fqns.filter(Boolean))].sort()
}
