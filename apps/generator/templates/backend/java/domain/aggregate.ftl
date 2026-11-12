package ${pkgs.domainModel};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName}聚合根（Aggregate Root）。
 *
 * <p>所有业务规则（非空、长度、唯一性之外的聚合内约束）收敛在聚合内部，
 * 外部只能通过行为方法修改状态。唯一性等跨聚合规则由应用服务判定。</p>
 */
public class ${entity} extends AggregateRoot {

    private final ${entityId} id;
<#if createdColumn>
    private final Instant createdAt;
</#if>
<#if updatedColumn>
    private Instant updatedAt;
</#if>
<#list aggregateFields as column>
    private ${column.javaType} ${column.javaName};
</#list>

    private ${entity}(${entityId} id<#if createdColumn>, Instant createdAt</#if>) {
        this.id = id;
<#if createdColumn>
        this.createdAt = createdAt;
</#if>
    }

    /**
     * 工厂方法：创建新${displayName}。
     */
    public static ${entity} create(${entityId} id<#if createColumns?size gt 0>, <#list createColumns as column>${column.javaType} ${column.javaName}<#if column_has_next>, </#if></#list></#if>) {
<#list createColumns as column>
<#if !column.nullable>
<#if column.isTextLike>
        if (${column.javaName} == null || ${column.javaName}.isBlank()) {
            throw new ${domainException}(${(column.comment + '不能为空')?java});
        }
<#else>
        if (${column.javaName} == null) {
            throw new ${domainException}(${(column.comment + '不能为空')?java});
        }
</#if>
</#if>
<#if column.isTextLike && column.length>
        if (${column.javaName} != null && ${column.javaName}.length() > ${column.length}) {
            throw new ${domainException}(${(column.comment + '长度不能超过 ' + column.length)?java});
        }
</#if>
</#list>
<#if createdColumn>
        ${entity} aggregate = new ${entity}(id, Instant.now());
<#else>
        ${entity} aggregate = new ${entity}(id);
</#if>
<#list createColumns as column>
        aggregate.${column.javaName} = ${column.javaName};
</#list>
<#if updatedColumn>
        aggregate.updatedAt = Instant.now();
</#if>
        aggregate.registerEvent(new ${createdEvent}(id.value(), Instant.now()));
        return aggregate;
    }

    /**
     * 重建方法：仅供基础设施层从持久化数据还原聚合，不触发任何领域行为。
     */
    public static ${entity} restore(${entityId} id<#if nonPkColumns?size gt 0>, <#list nonPkColumns as column>${column.javaType} ${column.javaName}<#if column_has_next>, </#if></#list></#if>) {
<#if createdColumn>
        ${entity} aggregate = new ${entity}(id, createdAt);
<#else>
        ${entity} aggregate = new ${entity}(id);
</#if>
<#list restoreAssignColumns as column>
        aggregate.${column.javaName} = ${column.javaName};
</#list>
        return aggregate;
    }
<#list editableColumns as column>

    /** 变更${column.comment} */
    public void ${column.changeMethod}(${column.javaType} ${column.javaName}) {
<#if !column.nullable>
<#if column.isTextLike>
        if (${column.javaName} == null || ${column.javaName}.isBlank()) {
            throw new ${domainException}(${(column.comment + '不能为空')?java});
        }
<#else>
        if (${column.javaName} == null) {
            throw new ${domainException}(${(column.comment + '不能为空')?java});
        }
</#if>
</#if>
<#if column.isTextLike && column.length>
        if (${column.javaName} != null && ${column.javaName}.length() > ${column.length}) {
            throw new ${domainException}(${(column.comment + '长度不能超过 ' + column.length)?java});
        }
</#if>
        this.${column.javaName} = ${column.javaName};
<#if updatedColumn>
        touch();
</#if>
    }
</#list>
<#if updatedColumn>

    /** 任何可编辑字段变化后刷新更新时间 */
    private void touch() {
        this.updatedAt = Instant.now();
    }
</#if>

    public ${entityId} id() {
        return id;
    }
<#if createdColumn>

    public Instant createdAt() {
        return createdAt;
    }
</#if>
<#if updatedColumn>

    public Instant updatedAt() {
        return updatedAt;
    }
</#if>
<#list aggregateFields as column>

    public ${column.javaType} ${column.javaName}() {
        return ${column.javaName};
    }
</#list>

    @Override
    public boolean equals(Object o) {
        return o instanceof ${entity} other && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
