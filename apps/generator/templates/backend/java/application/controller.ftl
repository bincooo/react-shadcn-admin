package ${pkgs.webController};

<#list imports as imp>import ${imp};
</#list>

/**
 * ${displayName} REST 接口（接口层 / 驱动侧适配器）。
 *
 * <p>只做协议转换：HTTP 请求 → 命令/查询 → 应用服务，不含业务逻辑。</p>
 */
@RestController
@RequestMapping("/api/${route}")
@AllArgsConstructor
public class ${entity}Controller {

    private final ${entity}CommandService ${entityVar}CommandService;
    private final ${entity}QueryService ${entityVar}QueryService;
    private final Converter converter;

    /** 分页查询列表 */
    @GetMapping
<#if options.security>    @PreAuthorize("@permission.has('${options.permissionPrefix}:query')")
</#if>    public PageDTO<${entity}DTO> listPage(@ModelAttribute Query${entity}Request request) {
        return ${entityVar}QueryService.listPage(
                converter.convert(request, Query${entity}Command.class));
    }

    /** 按 ID 查询详情 */
    @GetMapping("/{id}")
<#if options.security>    @PreAuthorize("@permission.has('${options.permissionPrefix}:query')")
</#if>    public ${entity}DTO get(@PathVariable String id) {
        return ${entityVar}QueryService.get(id);
    }

    /** 创建 */
    @PostMapping
<#if options.security>    @PreAuthorize("@permission.has('${options.permissionPrefix}:create')")
</#if>    @ResponseStatus(HttpStatus.CREATED)
    public ${entity}DTO create(@Valid @RequestBody Create${entity}Request request) {
        return ${entityVar}CommandService.create(
                converter.convert(request, Create${entity}Command.class));
    }

    /** 更新 */
    @PutMapping("/{id}")
<#if options.security>    @PreAuthorize("@permission.has('${options.permissionPrefix}:update')")
</#if>    public ${entity}DTO update(@PathVariable String id,
                                @Valid @RequestBody Update${entity}Request request) {
        return ${entityVar}CommandService.update(id,
                converter.convert(request, Update${entity}Command.class));
    }

    /** 删除 */
    @DeleteMapping("/{id}")
<#if options.security>    @PreAuthorize("@permission.has('${options.permissionPrefix}:delete')")
</#if>    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        ${entityVar}CommandService.delete(id);
    }
}
