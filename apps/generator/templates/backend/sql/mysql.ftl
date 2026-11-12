-- ============================================================
-- 表: ${definition.name}    实体: ${definition.entityName}
-- 方言: ${dialectLabel}
-- 生成时间: ${generatedAt}
-- 生成器: react-admin/apps/generator
-- ============================================================
-- 注意: 需 MySQL 5.7+；JSON 列使用原生 JSON 类型。
CREATE TABLE IF NOT EXISTS ${tableName} (
<#list columns as column>    ${column.name} ${column.type}<#if column.notNull> NOT NULL</#if><#if column.defaultExpr?has_content> DEFAULT ${column.defaultExpr}</#if><#if column.autoIncrement> AUTO_INCREMENT</#if> COMMENT '${column.comment}'<#if column_has_next || constraints?size gt 0>,</#if>
</#list><#list constraints as item>    CONSTRAINT ${item.name} ${item.kind} (${item.column})<#if item_has_next>,</#if>
</#list>) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='${tableComment}';

<#list indexes as index>CREATE INDEX ${index.name} ON ${index.table} (${index.column});
</#list>
