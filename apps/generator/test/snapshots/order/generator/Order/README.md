# 订单（sys_order）DDD 代码

- 实体：`Order` / ID：`OrderId`
- 模块：`order`
- 基础包：`com.example.ddd`
- REST 路由：`/api/order`
- 生成时间：<TIMESTAMP>

## 明细表

- 无

## 生成文件

- `ddd-domain/src/main/java/com/example/ddd/domain/order/model/OrderId.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/order/model/Order.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/order/event/OrderCreatedEvent.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/order/exception/OrderDomainException.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/order/exception/OrderNotFoundException.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/order/repository/OrderRepository.java`
- `ddd-domain/src/main/java/com/example/ddd/domain/order/model/OrderStatus.java`
- `ddd-application/src/main/java/com/example/ddd/application/order/command/CreateOrderCommand.java`
- `ddd-application/src/main/java/com/example/ddd/application/order/command/UpdateOrderCommand.java`
- `ddd-application/src/main/java/com/example/ddd/application/order/command/QueryOrderCommand.java`
- `ddd-application/src/main/java/com/example/ddd/application/order/dto/OrderDTO.java`
- `ddd-application/src/main/java/com/example/ddd/application/order/loader/OrderLoader.java`
- `ddd-application/src/main/java/com/example/ddd/application/order/query/OrderQueryService.java`
- `ddd-application/src/main/java/com/example/ddd/application/order/service/OrderCommandService.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/order/request/CreateOrderRequest.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/order/request/UpdateOrderRequest.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/order/request/QueryOrderRequest.java`
- `ddd-interfaces/src/main/java/com/example/ddd/interfaces/web/order/controller/OrderController.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/order/persistence/po/OrderPO.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/order/persistence/mapper/OrderMapper.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/order/persistence/converter/OrderPersistenceConverter.java`
- `ddd-infrastructure/src/main/java/com/example/ddd/infrastructure/order/persistence/adapter/MybatisPlusOrderRepositoryAdapter.java`
- `ddd-infrastructure/src/main/resources/db/generated/mysql/sys_order.sql`
- `ddd-infrastructure/src/main/resources/db/generated/postgres/sys_order.sql`
- `ddd-infrastructure/src/main/resources/db/generated/sqlserver/sys_order.sql`
- `ddd-infrastructure/src/main/resources/db/generated/oracle/sys_order.sql`
- `frontend/order/order/types.ts`
- `frontend/order/order/api.ts`
- `frontend/order/order/modules/use-order.ts`
- `frontend/order/order/modules/table.tsx`
- `frontend/order/order/modules/dialog.tsx`
- `frontend/order/order/index.tsx`

## SQL 文件

- `ddd-infrastructure/src/main/resources/db/generated/mysql/sys_order.sql`
- `ddd-infrastructure/src/main/resources/db/generated/postgres/sys_order.sql`
- `ddd-infrastructure/src/main/resources/db/generated/sqlserver/sys_order.sql`
- `ddd-infrastructure/src/main/resources/db/generated/oracle/sys_order.sql`

## 前端代码

- `frontend/order/order/types.ts`
- `frontend/order/order/api.ts`
- `frontend/order/order/modules/use-order.ts`
- `frontend/order/order/modules/table.tsx`
- `frontend/order/order/modules/dialog.tsx`
- `frontend/order/order/index.tsx`

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
2. 确认 `com.example.ddd.domain.order.model` 等包路径与目标工程一致。
3. 执行对应方言 SQL（位于 `ddd-infrastructure/src/main/resources/db/generated/`）。
4. 重新编译：`./mvnw -q -DskipTests compile`。

## 命令行

```bash
# 在 react-admin 根目录
pnpm generate sys_order
pnpm generate sys_order --write
pnpm generate sys_order --json
```
