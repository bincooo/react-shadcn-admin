/**
 * 由归一化定义推导生成上下文：包名、字段分类、Java 类型、枚举类名、路由等。
 * 所有模板只消费上下文，不再自行猜测命名，保证各层代码一致。
 */
import {
  AUDIT_COLUMN_NAMES,
  COLUMN_TYPES,
  QUERYABLE_COLUMN_TYPES,
} from './constants.mjs'
import { normalizeDefinition } from './definition.mjs'
import { entityToRoute, packageToPath, toPascal } from './naming.mjs'

const TYPE_META = new Map(COLUMN_TYPES.map((item) => [item.key, item]))

function lowerFirst(value) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value
}

export function buildContext(input, normalizeContext = {}) {
  const definition = normalizeDefinition(input, normalizeContext)
  const base = definition.basePackage
  const module = definition.module
  const entity = definition.entityName
  const entityVar = lowerFirst(entity)

  const findColumn = (name) =>
    definition.columns.find((column) => column.name === name)

  const pk = definition.columns.find((column) => column.primaryKey)
  const audit = definition.options.audit
  const auditColumn = (name) => (audit ? findColumn(name) : undefined)
  const createdColumn = auditColumn('created_at')
  const createdDeptColumn = auditColumn('created_dept')
  const createdByColumn = auditColumn('created_by')
  const updatedColumn = auditColumn('updated_at')
  const updatedByColumn = auditColumn('updated_by')

  const systemColumnIds = new Set(
    [
      pk?.id,
      createdColumn?.id,
      createdDeptColumn?.id,
      createdByColumn?.id,
      updatedColumn?.id,
      updatedByColumn?.id,
    ].filter(Boolean),
  )
  // 创建命令允许填写创建部门/创建人；更新命令允许填写更新人；时间字段由聚合维护。
  const createColumns = definition.columns.filter(
    (column) =>
      !systemColumnIds.has(column.id) ||
      column.id === createdDeptColumn?.id ||
      column.id === createdByColumn?.id,
  )
  const editableColumns = definition.columns.filter(
    (column) =>
      !systemColumnIds.has(column.id) || column.id === updatedByColumn?.id,
  )
  const nonPkColumns = definition.columns.filter(
    (column) => column.id !== pk?.id,
  )

  const enumNames = new Map()
  for (const column of definition.columns) {
    if (column.type === 'enum') {
      enumNames.set(column.id, `${entity}${toPascal(column.javaName)}`)
    }
  }

  const pkgs = {
    domainModel: `${base}.domain.${module}.model`,
    domainRepository: `${base}.domain.${module}.repository`,
    domainEvent: `${base}.domain.${module}.event`,
    domainException: `${base}.domain.${module}.exception`,
    applicationCommand: `${base}.application.${module}.command`,
    applicationDto: `${base}.application.${module}.dto`,
    applicationLoader: `${base}.application.${module}.loader`,
    applicationQuery: `${base}.application.${module}.query`,
    applicationService: `${base}.application.${module}.service`,
    infrastructurePo: `${base}.infrastructure.${module}.persistence.po`,
    infrastructureMapper: `${base}.infrastructure.${module}.persistence.mapper`,
    infrastructureConverter: `${base}.infrastructure.${module}.persistence.converter`,
    infrastructureAdapter: `${base}.infrastructure.${module}.persistence.adapter`,
    webController: `${base}.interfaces.web.${module}.controller`,
    webRequest: `${base}.interfaces.web.${module}.request`,
    sharedApplication: `${base}.application.shared`,
    sharedDomain: `${base}.domain.shared`,
    sharedInfrastructure: `${base}.infrastructure.persistence.support`,
  }

  const javaTypeOf = (column) => {
    if (column.type === 'enum') return enumNames.get(column.id)
    return TYPE_META.get(column.type)?.javaType ?? 'String'
  }

  const isPk = (column) => column.id === pk?.id
  const isAudit = (column) => audit && AUDIT_COLUMN_NAMES.includes(column.name)

  const queryableColumns = definition.columns.filter(
    (column) =>
      column.queryable &&
      !isPk(column) &&
      QUERYABLE_COLUMN_TYPES.includes(column.type),
  )

  return {
    definition,
    entity,
    entityVar,
    entityId: `${entity}Id`,
    pk,
    createdColumn,
    createdDeptColumn,
    createdByColumn,
    updatedColumn,
    updatedByColumn,
    editableColumns,
    createColumns,
    nonPkColumns,
    enumNames,
    javaTypeOf,
    isPk,
    isAudit,
    queryableColumns,
    uniqueColumns: definition.columns.filter(
      (column) => column.unique && !isPk(column),
    ),
    route: entityToRoute(entity),
    pkgs,
    base,
    module,
    packagePath: packageToPath(base),
    idGetter: 'id',
  }
}
