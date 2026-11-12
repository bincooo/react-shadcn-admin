package ${pkgs.applicationLoader};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName}加载器：按 ID 加载聚合，不存在时抛领域异常。
 */
@Component
@AllArgsConstructor
public class ${entity}Loader {

    private final ${entity}Repository ${repositoryField};

    /** 按 ID 加载；不存在时抛出 {@link ${entity}NotFoundException} */
    public ${entity} requireById(String id) {
        ${entityId} ${entityVar}Id = ${entityId}.parse(id);
        return Loaders.orThrow(${repositoryField}.findById(${entityVar}Id),
                () -> new ${entity}NotFoundException(${entityVar}Id));
    }
}
