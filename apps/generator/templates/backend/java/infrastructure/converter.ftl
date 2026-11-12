package ${pkgs.infrastructureConverter};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName} 领域 ↔ PO 转换（防腐层）。
 *
 * <p>不可变字段经 {@link ${entity}#restore} 全参数重建，不走 setter / 反射。</p>
 */
public final class ${entity}PersistenceConverter {

    private ${entity}PersistenceConverter() {
    }

    /** 领域聚合 → PO */
    public static ${entity}PO toPO(${entity} aggregate) {
        ${entity}PO po = new ${entity}PO();
        po.set${pk.pascal}(aggregate.id().value());
<#list columns as column><#if !column.isPk>
        po.set${column.pascal}(aggregate.${column.javaName}());
</#if></#list>
        return po;
    }

    /** PO → 领域聚合（经 restore 工厂重建，不触发领域行为） */
    public static ${entity} toDomain(${entity}PO po) {
        return ${entity}.restore(
                ${entityId}.of(po.get${pk.pascal}())<#list nonPkColumns as column>,
                po.get${column.pascal}()</#list>);
    }
}
