/**
 * ${displayName}前端类型：读模型对齐后端 ${entity}DTO，
 * 写模型只包含业务字段（主键与审计字段由后端维护）。
 */
export interface ${entity} {
<#list columns as column>  /** ${column.label} */
  ${column.javaName}${column.optional}: ${column.tsType}
</#list>}

/** 新建 / 编辑${displayName}的表单输入 */
<#if businessColumns?size gt 0>export interface ${entity}Input {
<#list businessColumns as column>  /** ${column.label} */
  ${column.javaName}${column.optional}: ${column.tsType}
</#list>}
<#else>export type ${entity}Input = Record<string, never>
</#if>
