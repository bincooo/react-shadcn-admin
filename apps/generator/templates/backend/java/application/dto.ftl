package ${pkgs.applicationDto};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName} DTO（读模型，供接口层返回）。
 *
 * <p>聚合不直接暴露给外部；雪花 long 主键序列化为字符串，避免前端精度丢失。</p>
 */
public record ${entity}DTO(
<#list columns as column>        <#if column.isPk || column.jsonString>@JsonSerialize(using = ToStringSerializer.class) </#if>${column.javaType} ${column.javaName}<#if column_has_next>,</#if>
</#list>) {

    /** 由聚合映射为对外读模型 */
    public static ${entity}DTO from(${entity} aggregate) {
        return new ${entity}DTO(
<#list columns as column>                <#if column.isPk>aggregate.id().value()<#else>aggregate.${column.javaName}()</#if><#if column_has_next>,<#else>);</#if>
</#list>    }
}
