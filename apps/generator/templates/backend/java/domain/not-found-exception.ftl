package ${pkgs.domainException};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName}不存在领域异常（接口层映射为 404）。
 */
public class ${notFoundException} extends NotFoundException {

    public ${notFoundException}(Object identifier) {
        super(${displayNameEscaped}, identifier);
    }
}
