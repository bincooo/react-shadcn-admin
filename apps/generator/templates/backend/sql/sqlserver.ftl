-- ============================================================
-- 表: ${definition.name}    实体: ${definition.entityName}
-- 方言: ${dialectLabel}
-- 生成时间: ${generatedAt}
-- 生成器: react-admin/apps/generator
-- ============================================================
-- 注意: 默认 dbo schema；使用 OBJECT_ID / sys.indexes 做存在性判断。
IF OBJECT_ID(N'dbo.${tableNameRaw}', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].${tableName} (
<#list columns as column>        ${column.name} ${column.type}<#if column.notNull> NOT NULL</#if><#if column.defaultExpr?has_content> DEFAULT ${column.defaultExpr}</#if><#if column.autoIncrement> IDENTITY(1,1)</#if><#if column_has_next || constraints?size gt 0>,</#if>
</#list><#list constraints as item>        CONSTRAINT ${item.name} ${item.kind} (${item.column})<#if item_has_next>,</#if>
</#list>    );
END;
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'${tableComment}', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'${tableNameRaw}';
GO
<#list columns as column>EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'${column.comment}', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'${tableNameRaw}', @level2type=N'COLUMN', @level2name=N'${column.rawName}';
GO
</#list>
<#if indexes?size gt 0>

<#list indexes as index>IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'${index.rawName}' AND object_id = OBJECT_ID(N'dbo.${tableNameRaw}'))
    CREATE INDEX ${index.name} ON [dbo].${index.table} (${index.column});
GO
</#list></#if>
