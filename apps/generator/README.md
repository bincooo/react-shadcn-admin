# 后端代码模板生成器

在浏览器里设计数据库表与列，生成 Java DDD 分层 CRUD 代码、多数据库建表 SQL，
以及对齐 playground 约定的 React + TypeScript CRUD 页面。
表定义持久化到 `apps/generator/data/[table].jsonl`，页面与 node CLI 共用同一套生成核心。

## 能力

- **DDD 分层代码**：聚合根、ID 值对象、枚举、领域事件、异常、仓储端口、应用命令/查询/DTO/Loader/服务、MyBatis-Plus PO/Mapper/转换器/适配器、Spring MVC Controller/Request。
- **多数据库 DDL**：MySQL、PostgreSQL、SQL Server、Oracle；包含主键、唯一约束、查询索引、字段/表注释与自增列语法。
- **前端 CRUD 页面**：类型、API 封装、列表（分页/搜索/删除）、新增/编辑表单；使用 `@repo/ui`、`@repo/table` 与 playground 的 `@/lib/http` 等基座，产物输出到 `frontend/`。
- **可定制 FTL 模板**：Java / SQL / 前端模板全部外置到 `templates/`，由 config 结构体驱动渲染，修改后无需重新构建。
- **表设计页面**：主表字段设计、可添加多个明细表、字段增删改与排序、类型/长度/精度/可空/唯一/索引、枚举值下拉添加/就地修改/文本说明、生成选项、实时代码预览（Java / TypeScript / SQL / JSON / Markdown 语法高亮）。
- **持久化**：`data/[table].jsonl` 只保留一条表定义记录；保存时覆盖写入，删除即删除文件。
- **离线生成**：不依赖页面，直接读取 JSONL 执行；同一份定义在页面和 CLI 下结果一致。
- **两种交付**：浏览器下载 ZIP，或按 JSONL 中的 `outputDirectory` / `frontendDirectory` 分别写入后端与前端工程。

## 快速开始

```bash
cd react-admin
pnpm install

# 页面：http://localhost:5174
pnpm dev:generator

# CLI：读取 data/sys_order.jsonl
node apps/generator/scripts/generate.mjs --list
node apps/generator/scripts/generate.mjs sys_order
node apps/generator/scripts/generate.mjs sys_order --json

# 直接写入后端工程（会覆盖同名文件）
node apps/generator/scripts/generate.mjs sys_order \
  --write --out ../ddd-springboot

# 同时指定前端工程目录（frontend/ 前缀会被剥离）
node apps/generator/scripts/generate.mjs sys_order \
  --write --out ../ddd-springboot \
  --frontend-out ../playground/src/pages

# 在 react-admin 根目录也可以
pnpm generate sys_order

# 测试：固定定义 → 逐字节比对生成结果
pnpm --filter generator test
# 确认变更符合预期后重建快照
pnpm --filter generator test:update
```

`data/` 为空时页面会显示空列表，可直接新建表定义。

## JSONL 定义

`data/[table].jsonl` 每行是一个 JSON 对象，结构如下（省略部分字段）：

```json
{
  "id": "0e962565-...",
  "name": "sys_order",
  "entityName": "Order",
  "displayName": "订单",
  "module": "order",
  "basePackage": "com.example.ddd",
  "comment": "订单主表",
  "columns": [
    {
      "name": "order_no",
      "javaName": "orderNo",
      "type": "string",
      "length": 64,
      "nullable": false,
      "primaryKey": false,
      "unique": true,
      "queryable": true,
      "comment": "订单号"
    },
    {
      "name": "status",
      "javaName": "status",
      "type": "enum",
      "length": 32,
      "nullable": false,
      "enumValues": ["CREATED", "PAID"],
      "enumDescriptions": {
        "CREATED": "已创建",
        "PAID": "已支付"
      },
      "comment": "订单状态"
    }
  ],
  "options": {
    "dialects": ["mysql", "postgres", "sqlserver", "oracle"],
    "generateSql": true,
    "generateFrontend": true,
    "security": true,
    "permissionPrefix": "system:order",
    "outputMode": "zip",
    "outputDirectory": "../../../ddd-springboot",
    "frontendDirectory": "../playground/src/pages",
    "audit": true
  },
  "detailTables": [
    {
      "name": "sys_order_item",
      "entityName": "OrderItem",
      "displayName": "订单明细",
      "comment": "订单明细表",
      "columns": [
        {
          "name": "order_id",
          "javaName": "orderId",
          "type": "long",
          "nullable": false,
          "comment": "主表ID"
        }
      ]
    }
  ],
  "createdAt": "2026-11-12T06:00:05.291Z",
  "updatedAt": "2026-11-12T06:00:05.291Z"
}
```

### 明细表

- `detailTables` 可配置多个明细表，每个明细表独立校验表名、实体名和字段。
- 明细表共享主表的 `module`、`basePackage` 与生成选项，审计字段规则一致。
- 明细表名、实体名不能与主表或其他明细重复。
- 生成时会作为同模块下的独立实体输出，并默认在新增明细表时加入 `${主表实体}_id` 关联字段。

### 列类型

| type       | Java 类型    | MySQL          | PostgreSQL     | SQL Server         | Oracle         |
| ---------- | ------------ | -------------- | -------------- | ------------------ | -------------- |
| `string`   | `String`     | `VARCHAR(n)`   | `VARCHAR(n)`   | `NVARCHAR(n)`      | `VARCHAR2(n)`  |
| `text`     | `String`     | `TEXT`         | `TEXT`         | `NVARCHAR(MAX)`    | `CLOB`         |
| `integer`  | `Integer`    | `INT`          | `INTEGER`      | `INT`              | `NUMBER(10)`   |
| `long`     | `Long`       | `BIGINT`       | `BIGINT`       | `BIGINT`           | `NUMBER(19)`   |
| `decimal`  | `BigDecimal` | `DECIMAL(p,s)` | `NUMERIC(p,s)` | `DECIMAL(p,s)`     | `NUMBER(p,s)`  |
| `boolean`  | `Boolean`    | `TINYINT(1)`   | `BOOLEAN`      | `BIT`              | `NUMBER(1)`    |
| `date`     | `LocalDate`  | `DATE`         | `DATE`         | `DATE`             | `DATE`         |
| `datetime` | `Instant`    | `DATETIME(3)`  | `TIMESTAMP`    | `DATETIME2`        | `TIMESTAMP`    |
| `enum`     | 生成的枚举类 | `VARCHAR(n)`   | `VARCHAR(n)`   | `NVARCHAR(n)`      | `VARCHAR2(n)`  |
| `json`     | `String`     | `JSON`         | `JSONB`        | `NVARCHAR(MAX)`    | `CLOB`         |
| `uuid`     | `String`     | `CHAR(36)`     | `UUID`         | `UNIQUEIDENTIFIER` | `VARCHAR2(36)` |

约束：

- 必须且只能有一个主键，类型固定为 `long`（雪花 ID 值对象）。
- `audit: true` 时自动补齐并固定在业务字段之后：`created_dept`、`created_at`、`created_by`、`updated_at`、`updated_by`；页面新增字段会插入到审计字段之前。
- `created_dept` / `created_by` 仅在创建命令中可填写；`updated_by` 仅在更新命令中可填写且为空时保留原值；两个时间字段由聚合维护。
- 枚举字段需提供合法 Java 标识符作为枚举值；`enumDescriptions` 可为每个值定义文本说明，生成 Java 枚举常量 JavaDoc 与 DDL 注释。
- 非空字符串字段生成 `@NotBlank` 与聚合内校验；长度上限同时用于 DDL 与 `@Size`。

### 输出选项

| 选项               | 说明                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `dialects`         | 需要生成 SQL 的方言列表；至少一个。                                                         |
| `generateSql`      | 是否生成 SQL 文件。                                                                         |
| `generateFrontend` | 是否生成 React + TypeScript CRUD 页面。                                                     |
| `security`         | 是否生成 `@PreAuthorize`；关闭后不依赖 Spring Security。                                    |
| `permissionPrefix` | 权限前缀，动作后缀为 `:query` / `:create` / `:update` / `:delete`。                         |
| `outputMode`       | CLI 默认输出方式：`zip` 或 `disk`。                                                         |
| `outputDirectory`  | 磁盘写入/默认后端目录；相对路径基于 `apps/generator` 解析。CLI `--out` 则相对当前工作目录。 |
| `frontendDirectory`| 前端产物写入目录；`frontend/` 前缀会被剥离。相对路径基于 `apps/generator` 解析，CLI `--frontend-out` 相对当前工作目录。 |
| `audit`            | 是否自动补齐并维护审计字段。                                                                |

## 模板定制（FTL）

所有代码模板已从 JS 中抽离，存放在 `apps/generator/templates/`：

```text
templates/
  backend/java/domain/*.ftl          # 聚合、ID、枚举、事件、异常、仓储端口
  backend/java/application/*.ftl     # 命令、DTO、Loader、服务、Request、Controller
  backend/java/infrastructure/*.ftl  # PO、Mapper、转换器、仓储适配器
  backend/sql/*.ftl                  # mysql / postgres / sqlserver / oracle
  frontend/*.ftl                     # types / api / hook / table / dialog / index
  report/readme.md.ftl               # 产物自带的 README
```

生成时由 `core/tokenizer/` 从磁盘读取模板并渲染，因此**修改模板后无需重新构建**：
页面下一次「预览 / ZIP / 写入」和 CLI 下一次执行都会使用新模板。
模板按 mtime 缓存编译后的 AST，改动后会自动失效。

模板引擎按职责拆分为：

```text
core/tokenizer/
  index.mjs                  # 门面：只导出 renderTemplate
  tokens.mjs                 # token / 节点类型与字符表
  scanner.mjs                # 定位标签 / 插值 / 注释边界
  preprocess.mjs             # 指令行缩进与换行清理
  tokenize.mjs               # 源码 → token 流
  parse.mjs                  # token 流 → AST（游标 + 块结束判定）
  parser/tags.mjs            # 标签处理器注册表（if / list / assign）
  expression/lexer.mjs       # 表达式词法
  expression/evaluate.mjs    # 表达式求值（优先级表驱动）
  expression/builtins.mjs    # 内建函数注册表（?js / ?size ...）
  render.mjs                 # AST → 文本（节点渲染器注册表）
  repository.mjs             # 模板读取与 AST 缓存
```

新增标签只需在 `parser/tags.mjs` 注册处理器；新增内建只需在
`expression/builtins.mjs` 加一项，解析与渲染流程都不用改。

改完模板后跑一次 `pnpm --filter generator test`：`test/snapshots/` 保存了两份固定定义
（普通表、全列类型 + 明细表）的完整产物，会逐字节比对。确认变化符合预期后，
用 `pnpm --filter generator test:update` 重建快照。

### 支持的 FTL 语法

只实现了生成所需的最小子集：

- 插值 `${expr}`
- `<#if expr> ... <#elseif expr> ... <#else> ... </#if>`
- `<#list seq as item> ... </#list>`（循环内可用 `item`、`item_index`、`item_has_next`）
- `<#assign name = expr>`
- `<#-- 注释 -->`
- 内建：`?has_content` `?size` `?length` `?upper_case` `?lower_case` `?cap_first`
  `?uncap_first` `?trim` `?c` `?default(x)` `?join(sep)` `?replace(a,b)`
  `?contains(x)` `?starts_with(x)` `?ends_with(x)`
- 表达式支持属性访问、`==` `!=`、`>` `<` `>=` `<=`（或 `gt` `lt` `gte` `lte`）、
  `&&` `||` `!`、字符串 `+` 拼接
- 内建 `?js`（单引号 JS 字符串）、`?jsx`（`{"文本"}`）、`?java`（带引号的 Java 字符串字面量）
- `\${` 输出字面量 `${`，用于在模板里写 TS 模板字符串（反引号 + 插值）

> **分层约定**：`core/` 只负责把表定义整理成 config 数据（归一化、字段分类、类型、
> 命名、标志位、每列的派生值），**不生成任何代码文本**；语法、语序、分隔符、缩进、
> 条件分支与注释文案全部由 `templates/` 决定。

### 数据模型（config 结构体）

模板的根对象由 `core/model.mjs` 的 `buildModel(ctx)` 构造，主要字段：

| 字段 | 说明 |
| ---- | ---- |
| `definition` | 归一化后的完整表定义 |
| `entity` / `entityVar` / `entityId` / `entityKebab` | `Order` / `order` / `OrderId` / `order` |
| `module` / `base` / `route` / `pkgs` | 模块、基础包、REST 路由与各层包名；`route` 取实体类名的小写形式（`Order` → `order`，`DemoItem` → `demoitem`） |
| `options` | 生成选项（安全、审计、前端、方言等） |
| `pk` | 主键列（已附带派生字段） |
| `columns` | 全部列（含审计列） |
| `createColumns` / `editableColumns` / `nonPkColumns` | 创建、更新、非主键列 |
| `queryableColumns` / `uniqueColumns` / `enumColumns` | 可查询、唯一、枚举列 |
| `businessColumns` / `auditColumns` | 业务列 / 审计列 |
| `createdColumn` / `updatedColumn` / `updatedByColumn` | 审计列引用 |
| `displayColumn` | 删除确认框展示用的列 |
| `features` / `allFeatures` | 业务列 / 全部列的控件与类型标志位 |
| `aggregateFields` / `restoreAssignColumns` | 聚合字段、restore 赋值字段 |
| `domainException` / `notFoundException` / `createdEvent` 等 | 各层类名 |
| `displayName` / `tableComment` / `displayNameJsx` 等 | 展示名、表注释及其字面量形式 |

每个列对象在原始字段之外还包含：
`javaType`、`tsType`、`optional`、`enumName`、`isPk`、`isAudit`、`isEnum`、
`isNumeric`、`isTextLike`、`isString`、`isText`、`isInteger`、`isLong`、`isDecimal`、
`isBoolean`、`isDate`、`isDateTime`、`isJson`、`isUuid`、`width`、`minWidth`、
`inputId`、`optionsName`、`enumItems`、`enumEntries`、`enumValues`、`enumValuesJs`、
`enumDefault`、`enumDescriptions`、`inputType`、`step`、`defaultJs`、`label`、`comment`、
`escapedComment`、`upperSnake`、`pascal`、`getter`、`setter`、`changeMethod`。

生成器（`core/java/*.mjs`、`core/frontend.mjs`、`core/sql-generator.mjs`）只补充
`imports` 等少量聚合数据，然后调用 `renderTemplate`；不再拼接代码文本。

## 生成目录

生成物按 DDD 多模块目录组织，解压到后端工程根目录即可：

```text
ddd-domain/src/main/java/<base>/domain/<module>/...
ddd-application/src/main/java/<base>/application/<module>/...
ddd-infrastructure/src/main/java/<base>/infrastructure/<module>/...
ddd-interfaces/src/main/java/<base>/interfaces/web/<module>/...
ddd-infrastructure/src/main/resources/db/generated/<dialect>/<table>.sql
generator/<Entity>/README.md
generator/<Entity>/manifest.json
```

明细表按同一套分层目录生成独立实体，SQL 文件名使用各自的表名。

## 共享基座

生成代码依赖目标 `ddd-springboot` 已有的共享类（不会重复生成或覆盖）：

`AggregateRoot`、`DomainEvent`、`DomainException`、`NotFoundException`、`PageQuery`、`PageResult`、`SnowflakeIdGenerator`、`PageDTO`、`Loaders`、`DomainEventPublisher`、`PageResults`。

在真实 `ddd-springboot` 工程上已用 Maven 编译验证（包含 MapStruct 生成的 Request → Command 映射器）。

## HTTP API

开发/预览服务器提供以下接口（仅用于本地设计器）：

| 方法     | 路径                         | 说明                                                                 |
| -------- | ---------------------------- | -------------------------------------------------------------------- |
| `GET`    | `/api/tables`                | 列出 table 摘要与读取错误。                                          |
| `GET`    | `/api/tables/:name`          | 读取当前表定义。                                                     |
| `POST`   | `/api/tables`                | 保存（覆盖单条记录），支持 `originalName` 重命名。                   |
| `DELETE` | `/api/tables/:name`          | 删除 JSONL 文件。                                                    |
| `POST`   | `/api/preview`               | 用请求体 `{definition}` 生成文件映射（不落盘）。                     |
| `GET`    | `/api/tables/:name/files`    | 用已保存定义生成文件映射。                                           |
| `POST`   | `/api/generate`              | 用请求体定义生成 ZIP。                                               |
| `POST`   | `/api/tables/:name/generate` | 用已保存定义生成 ZIP。                                               |
| `POST`   | `/api/write`                 | 写入 `options.outputDirectory` 与 `options.frontendDirectory`（可传 `directory` / `frontendDirectory` 覆盖）。 |
| `GET`    | `/api/config`                | 方言、列类型、目录等前端配置。                                       |

## 注意

- 页面「写入工程」与 CLI `--write` 会覆盖同名文件；不会删除目标目录中的其他文件。
- Oracle 不支持 `CREATE TABLE IF NOT EXISTS`，重复执行前请确认表不存在。
- SQL Server DDL 默认使用 `dbo` schema。
- 生成器的 `typecheck` / `build` 只覆盖 TypeScript；核心模板为 ESM JavaScript，由 node 直接执行。
- CLI 默认 ZIP 输出到 `apps/generator/output/`（已忽略），与 Vite 的 `dist/` 构建目录分开。
