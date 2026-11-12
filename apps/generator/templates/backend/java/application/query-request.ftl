package ${pkgs.webRequest};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName}分页查询请求（查询参数绑定）。
 */
@Data
@AutoMapper(target = Query${entity}Command.class, reverseConvertGenerate = false)
public class Query${entity}Request {

    private int page = 1;
    private int size = 10;
    private String keyword;
}
