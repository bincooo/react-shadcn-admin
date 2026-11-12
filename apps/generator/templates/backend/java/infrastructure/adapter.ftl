package ${pkgs.infrastructureAdapter};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName}仓储适配器（Adapter）：领域端口的 MyBatis-Plus 实现。
 *
 * <p>事务由调用方（应用服务的 {@code @Transactional}）声明；
 * 分页在 SQL 侧完成 limit/offset 与 count，不在内存切片。</p>
 */
@Repository
@AllArgsConstructor
public class MybatisPlus${entity}RepositoryAdapter implements ${entity}Repository {

    private final ${entity}Mapper ${mapperField};

    @Override
    public ${entity} findById(${entityId} id) {
        ${entity}PO po = ${mapperField}.selectById(id.value());
        return po == null ? null : ${entity}PersistenceConverter.toDomain(po);
    }

    @Override
    public PageResult<${entity}> findPage(PageQuery query) {
        LambdaQueryWrapper<${entity}PO> wrapper = new LambdaQueryWrapper<>();
<#if queryableColumns?size gt 0>
        if (query.keyword() != null) {
            String like = query.keyword();
            wrapper.and(w -> w.<#list queryableColumns as column><#if column_index == 0>like(${entity}PO::get${column.pascal}, like)<#else>
                    .or().like(${entity}PO::get${column.pascal}, like)</#if></#list>);
        }
<#else>
        // 未配置可查询字段，keyword 不参与过滤
</#if>
<#if createdColumn>
        wrapper.orderByDesc(${entity}PO::get${createdColumn.pascal});
<#else>
        wrapper.orderByAsc(${entity}PO::get${pk.pascal});
</#if>
        Page<${entity}PO> page = ${mapperField}.selectPage(
                new Page<>(query.page(), query.size()), wrapper);
        return PageResults.toDomain(page, ${entity}PersistenceConverter::toDomain);
    }

    @Override
    public ${entity} save(${entity} aggregate) {
        ${entity}PO po = ${entity}PersistenceConverter.toPO(aggregate);
        ${mapperField}.insertOrUpdate(po);
        return aggregate;
    }

    @Override
    public void deleteById(${entityId} id) {
        ${mapperField}.deleteById(id.value());
    }
<#list uniqueColumns as column>

    @Override
    public boolean existsBy${column.pascal}(${column.javaType} value) {
        return ${mapperField}.selectCount(new LambdaQueryWrapper<${entity}PO>()
                .eq(${entity}PO::get${column.pascal}, value)) > 0;
    }
</#list>
}
