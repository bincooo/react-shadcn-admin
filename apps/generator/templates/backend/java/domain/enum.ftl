package ${pkgs.domainModel};

/**
 * ${column.comment} 枚举。
 */
public enum ${column.enumName} {

<#list column.enumEntries as entry><#if entry.description>    /** ${entry.description} */
</#if>    ${entry.value}<#if entry_has_next>,</#if>
</#list>}
