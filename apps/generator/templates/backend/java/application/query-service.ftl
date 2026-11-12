package ${pkgs.applicationQuery};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName}查询服务（读侧用例，只读不开事务）。
 */
@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class ${entity}QueryService {

    private final ${entity}Repository ${entityVar}Repository;
    private final ${entity}Loader ${entityVar}Loader;

    /** 分页查询列表 */
    public PageDTO<${entity}DTO> listPage(Query${entity}Command query) {
        PageQuery pageQuery = new PageQuery(query.page(), query.size(), query.keyword());
        PageResult<${entity}> result = ${entityVar}Repository.findPage(pageQuery);
        return PageDTO.from(result, pageQuery, ${entity}DTO::from);
    }

    /** 按 ID 查询详情 */
    public ${entity}DTO get(String id) {
        return ${entity}DTO.from(${entityVar}Loader.requireById(id));
    }
}
