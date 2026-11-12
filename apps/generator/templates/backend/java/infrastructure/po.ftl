package ${pkgs.infrastructurePo};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName}持久化对象（PO / Persistence Object）。
 *
 * <p>与领域模型严格隔离，表结构演进不会污染聚合；二者通过转换器互转。</p>
 */
@Data
@TableName("${definition.name}")
public class ${entity}PO {
<#list columns as column>

<#if column.isPk>    @TableId(type = IdType.<#if column.autoIncrement>AUTO<#else>INPUT</#if>)
</#if>    private ${column.javaType} ${column.javaName};
</#list>
}
