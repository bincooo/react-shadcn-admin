package ${pkgs.domainException};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName}领域规则违反（唯一键重复、空字段、非法状态等业务冲突）。
 *
 * <p>接口层通常映射为 409；参数格式问题仍使用 {@code IllegalArgumentException}（映射 400）。</p>
 */
public class ${domainException} extends DomainException {

    public ${domainException}(String message) {
        super(message);
    }
}
