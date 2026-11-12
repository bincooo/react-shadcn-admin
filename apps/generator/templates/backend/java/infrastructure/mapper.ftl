package ${pkgs.infrastructureMapper};

<#list imports as imp>import ${imp};
</#list>

/**
 * MyBatis-Plus Mapper：${definition.name} 表。
 *
 * <p>基础 CRUD 由 BaseMapper 直接提供，无需 XML。</p>
 */
public interface ${entity}Mapper extends BaseMapper<${entity}PO> {
}
