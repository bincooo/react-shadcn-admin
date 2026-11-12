package ${pkgs.applicationCommand};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${kindLabel}${displayName}命令（应用层输入）。
 *
 * <p><#if isCreate>创建命令包含可编辑字段与创建部门；主键、创建时间、更新时间由聚合维护。<#else>更新命令只包含可编辑字段；主键与审计字段不参与更新。</#if></p>
 */
public record ${className}(<#list commandColumns as column>${column.javaType} ${column.javaName}<#if column_has_next>, </#if></#list>) {
}

