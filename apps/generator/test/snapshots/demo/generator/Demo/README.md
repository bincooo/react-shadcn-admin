# 演示（sys_demo）DDD 代码

- 实体：`Demo` / ID：`DemoId`
- 模块：`demo`
- 基础包：`com.example.ddd`
- REST 路由：`/api/demo`
- 生成时间：<TIMESTAMP>

## 明细表

- `DemoItem`（sys_demo_item，7 列）

## 生成文件

- `ddd-domain/src/main/java/com/example/ddd/domain/demo/model/DemoId.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/model/Demo.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/event/DemoCreatedEvent.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/exception/DemoDomainException.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/exception/DemoNotFoundException.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/repository/DemoRepository.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/model/DemoStatus.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/command/CreateDemoCommand.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/command/UpdateDemoCommand.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/command/QueryDemoCommand.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/dto/DemoDTO.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/loader/DemoLoader.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/query/DemoQueryService.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/service/DemoCommandService.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/demo/request/CreateDemoRequest.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/demo/request/UpdateDemoRequest.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/demo/request/QueryDemoRequest.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/demo/controller/DemoController.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/demo/persistence/po/DemoPO.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/demo/persistence/mapper/DemoMapper.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/demo/persistence/converter/DemoPersistenceConverter.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/demo/persistence/adapter/MybatisPlusDemoRepositoryAdapter.java`
- `ddd-infrastructure/src/main/resources/db/generated/mysql/sys_demo.sql`
- `ddd-infrastructure/src/main/resources/db/generated/postgres/sys_demo.sql`
- `ddd-infrastructure/src/main/resources/db/generated/sqlserver/sys_demo.sql`
- `ddd-infrastructure/src/main/resources/db/generated/oracle/sys_demo.sql`
- `frontend/demo/demo/types.ts`
- `frontend/demo/demo/api.ts`
- `frontend/demo/demo/modules/use-demo.ts`
- `frontend/demo/demo/modules/table.tsx`
- `frontend/demo/demo/modules/dialog.tsx`
- `frontend/demo/demo/index.tsx`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/model/DemoItemId.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/model/DemoItem.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/event/DemoItemCreatedEvent.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/exception/DemoItemDomainException.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/exception/DemoItemNotFoundException.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/demo/repository/DemoItemRepository.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/command/CreateDemoItemCommand.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/command/UpdateDemoItemCommand.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/command/QueryDemoItemCommand.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/dto/DemoItemDTO.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/loader/DemoItemLoader.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/query/DemoItemQueryService.java`
- `ddd-application/src/main/java/com/example/ddd/application/demo/service/DemoItemCommandService.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/demo/request/CreateDemoItemRequest.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/demo/request/UpdateDemoItemRequest.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/demo/request/QueryDemoItemRequest.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/demo/controller/DemoItemController.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/demo/persistence/po/DemoItemPO.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/demo/persistence/mapper/DemoItemMapper.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/demo/persistence/converter/DemoItemPersistenceConverter.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/demo/persistence/adapter/MybatisPlusDemoItemRepositoryAdapter.java`
- `ddd-infrastructure/src/main/resources/db/generated/mysql/sys_demo_item.sql`
- `ddd-infrastructure/src/main/resources/db/generated/postgres/sys_demo_item.sql`
- `ddd-infrastructure/src/main/resources/db/generated/sqlserver/sys_demo_item.sql`
- `ddd-infrastructure/src/main/resources/db/generated/oracle/sys_demo_item.sql`
- `frontend/demo/demo-item/types.ts`
- `frontend/demo/demo-item/api.ts`
- `frontend/demo/demo-item/modules/use-demo-item.ts`
- `frontend/demo/demo-item/modules/table.tsx`
- `frontend/demo/demo-item/modules/dialog.tsx`
- `frontend/demo/demo-item/index.tsx`

## SQL 文件

- `ddd-infrastructure/src/main/resources/db/generated/mysql/sys_demo.sql`
- `ddd-infrastructure/src/main/resources/db/generated/postgres/sys_demo.sql`
- `ddd-infrastructure/src/main/resources/db/generated/sqlserver/sys_demo.sql`
- `ddd-infrastructure/src/main/resources/db/generated/oracle/sys_demo.sql`

## 前端代码

- `frontend/demo/demo/types.ts`
- `frontend/demo/demo/api.ts`
- `frontend/demo/demo/modules/use-demo.ts`
- `frontend/demo/demo/modules/table.tsx`
- `frontend/demo/demo/modules/dialog.tsx`
- `frontend/demo/demo/index.tsx`
- `frontend/demo/demo-item/types.ts`
- `frontend/demo/demo-item/api.ts`
- `frontend/demo/demo-item/modules/use-demo-item.ts`
- `frontend/demo/demo-item/modules/table.tsx`
- `frontend/demo/demo-item/modules/dialog.tsx`
- `frontend/demo/demo-item/index.tsx`

前端文件按 playground 约定引用 `@/lib/http`、`@/hooks/*`、
`@/components/common/*`、`@repo/ui` 与 `@repo/table`。把 `frontend/`
下的目录复制到 `apps/playground/src` 后即可接入路由与菜单。


## 依赖的共享基座

以下类沿用 `ddd-springboot` 的共享层，未重复生成：

- `com.example.ddd.domain.shared.AggregateRoot`
- `com.example.ddd.domain.shared.DomainEvent`
- `com.example.ddd.domain.shared.DomainException`
- `com.example.ddd.domain.shared.NotFoundException`
- `com.example.ddd.domain.shared.PageQuery`
- `com.example.ddd.domain.shared.PageResult`
- `com.example.ddd.domain.shared.SnowflakeIdGenerator`
- `com.example.ddd.application.shared.PageDTO`
- `com.example.ddd.application.shared.Loaders`
- `com.example.ddd.application.shared.DomainEventPublisher`
- `com.example.ddd.infrastructure.persistence.support.PageResults`

如果目标工程缺少这些类，请从 `ddd-springboot` 对应模块复制，或关闭相关生成选项后手动适配。

## 使用方式

1. 将本目录解压到后端工程根目录（默认 `ddd-springboot`），或使用生成器页面的「写入工程」按钮。
2. 确认 `com.example.ddd.domain.demo.model` 等包路径与目标工程一致。
3. 执行对应方言 SQL（位于 `ddd-infrastructure/src/main/resources/db/generated/`）。
4. 重新编译：`./mvnw -q -DskipTests compile`。

## 命令行

```bash
# 在 react-admin 根目录
pnpm generate sys_demo
pnpm generate sys_demo --write
pnpm generate sys_demo --json
```
