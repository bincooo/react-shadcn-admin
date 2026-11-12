package ${pkgs.applicationService};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName}应用服务（写侧用例编排）。
 *
 * <p>职责：加载聚合 → 调用聚合行为 → 持久化 → 发布领域事件。
 * 唯一性等需要跨聚合判断的规则在本层校验。</p>
 */
@Service
@Transactional(rollbackFor = Exception.class)
@AllArgsConstructor
public class ${entity}CommandService {

    private final ${entity}Repository ${repositoryField};
    private final ${entity}Loader ${loaderField};
    private final DomainEventPublisher eventPublisher;

    /** 用例：创建${displayName} */
    public ${entity}DTO create(Create${entity}Command command) {
<#list uniqueColumns as column>
        ensure${column.pascal}Available(command.${column.javaName}());
</#list>
        ${entity} saved = ${repositoryField}.save(${entity}.create(${entityId}.next()<#list createColumns as column>, command.${column.javaName}()</#list>));
        eventPublisher.publishFrom(saved);
        return ${entity}DTO.from(saved);
    }

    /** 用例：更新${displayName} */
    public ${entity}DTO update(String id, Update${entity}Command command) {
        ${entity} ${entityVar} = ${loaderField}.requireById(id);
<#list uniqueColumns as column>
        if (!Objects.equals(${entityVar}.${column.javaName}(), command.${column.javaName}())
                && command.${column.javaName}() != null
                && ${repositoryField}.existsBy${column.pascal}(command.${column.javaName}())) {
            throw new ${domainException}(${(column.comment + '已存在: ')?java} + command.${column.javaName}());
        }
</#list>
<#list editableColumns as column>
<#if updatedByColumn && column.id == updatedByColumn.id>
        if (command.${column.javaName}() != null) {
            ${entityVar}.${column.changeMethod}(command.${column.javaName}());
        }
<#else>
        ${entityVar}.${column.changeMethod}(command.${column.javaName}());
</#if>
</#list>
        ${repositoryField}.save(${entityVar});
        return ${entity}DTO.from(${entityVar});
    }

    /** 用例：删除${displayName} */
    public void delete(String id) {
        ${entity} ${entityVar} = ${loaderField}.requireById(id);
        ${repositoryField}.deleteById(${entityVar}.id());
    }
<#list uniqueColumns as column>

    /** ${column.comment}不能重复 */
    private void ensure${column.pascal}Available(${column.javaType} value) {
        if (value != null && ${repositoryField}.existsBy${column.pascal}(value)) {
            throw new ${domainException}(${(column.comment + '已存在: ')?java} + value);
        }
    }
</#list>
}
