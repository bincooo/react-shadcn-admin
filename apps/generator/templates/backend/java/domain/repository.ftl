package ${pkgs.domainRepository};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName}仓储端口（Port）。
 *
 * <p>领域层只定义契约，具体实现位于 infrastructure 层；
 * 不存在返回 null，由应用层 Loader 抛异常。</p>
 */
public interface ${entity}Repository {

    /** 按 ID 查询；不存在时返回 null */
    ${entity} findById(${entityId} id);

    /** 分页查询，返回当前页记录与总数 */
    PageResult<${entity}> findPage(PageQuery query);

    /** 保存（新增或更新） */
    ${entity} save(${entity} aggregate);

    /** 按 ID 删除 */
    void deleteById(${entityId} id);
<#list uniqueColumns as column>

    /** ${column.comment}是否已存在 */
    boolean existsBy${column.pascal}(${column.javaType} value);
</#list>
}
