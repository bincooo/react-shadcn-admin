# ${displayName}（${tableName}）DDD 代码

- 实体：`${entity}` / ID：`${entityId}`
- 模块：`${module}`
- 基础包：`${basePackage}`
- REST 路由：`/api/${route}`
- 生成时间：${generatedAt}

## 明细表

<#if details?size gt 0><#list details as detail>- `${detail.entity}`（${detail.table}，${detail.columns} 列）
</#list><#else>- 无
</#if>

## 生成文件

<#list files as file>- `${file}`
</#list>

## SQL 文件

<#if sqlFiles?size gt 0><#list sqlFiles as file>- `${file}`
</#list><#else>- 未启用 SQL 生成
</#if>

## 前端代码

<#if frontendFiles?size gt 0><#list frontendFiles as file>- `${file}`
</#list>

前端文件按 playground 约定引用 `@/lib/http`、`@/hooks/*`、
`@/components/common/*`、`@repo/ui` 与 `@repo/table`。把 `frontend/`
下的目录复制到 `apps/playground/src` 后即可接入路由与菜单。

<#else>- 未启用前端代码生成
</#if>

## 依赖的共享基座

以下类沿用 `ddd-springboot` 的共享层，未重复生成：

<#list sharedDependencies as dependency>- `${dependency}`
</#list>

如果目标工程缺少这些类，请从 `ddd-springboot` 对应模块复制，或关闭相关生成选项后手动适配。

## 使用方式

1. 将本目录解压到后端工程根目录（默认 `ddd-springboot`），或使用生成器页面的「写入工程」按钮。
2. 确认 `${domainModelPackage}` 等包路径与目标工程一致。
3. 执行对应方言 SQL（位于 `${resourceBase}/db/generated/`）。
4. 重新编译：`./mvnw -q -DskipTests compile`。

## 命令行

```bash
# 在 react-admin 根目录
pnpm generate ${tableName}
pnpm generate ${tableName} --write
pnpm generate ${tableName} --json
```
