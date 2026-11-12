package ${pkgs.webRequest};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${kindLabel}${displayName}请求体（Bean Validation 校验）。
 */
@AutoMapper(target = ${commandClass}.class, reverseConvertGenerate = false)
public record ${className}(<#list requestColumns as column>
        <#list column.validationAnnotations as annotation>${annotation}
        </#list>${column.javaType} ${column.javaName}<#if column_has_next>,</#if></#list>
) {
}
