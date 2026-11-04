# 重构记录

本文记录每次重构的范围、依据与验证结果。改造依据 `vercel-react-best-practices` 与
`vercel-composition-patterns` 两个技能，并结合 `AGENTS.md` 里对本项目的约定。

## 验证基线

每次重构都以以下命令全绿为准：

```bash
pnpm check   # typecheck + lint + format:check
pnpm build
```

浏览器可用时另跑一次真机冒烟：登录 → `/dashboard` `/system/users` `/system/roles`
`/system/menus` `/system/depts` `/profile` `/monitor` `/components`，要求 console 零错误。

## 审计结论（改造前）

审计手段：`tsc --noUnusedLocals`、自建依赖图可达性分析（含 `import.meta.glob` 动态发现）、
i18n key 与代码双向比对、Playwright 真机遍历。结论如下，用于界定「该改什么、不该改什么」。

**没有问题的部分（未改动）**

- 死代码：202 个源文件里仅 11 个 `.d.ts` 不在静态导入图上，其余全部可达；`noUnusedLocals`
  零告警，无未使用的 export 或参数。
- 运行时：7 条主路由零 console error / warning。
- 命名：`useState` 解构 90 处全部遵守 `*State` 约定，无例外。
- 依赖：18 个运行时依赖全部被真实引用，无误装。
- 反向验证过的「疑似 bug」：`header.searchCount` 在 `en-US.json` 只有 `_one`/`_other` 而缺
  基础 key。实测 i18next v26 会按 `Intl.PluralRules` 自动命中后缀，`count=1` 与 `count=3`
  均正确输出，**不是缺陷**，未改。

**确认的缺陷与冗余**

| 级别       | 位置                                             | 问题                                                                                                                   |
| ---------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 功能缺陷   | `components/layout/header.tsx`                   | 主题配置项 `showBreadcrumb` 有定义、能开关、有文案，但 Header 只看布局形态，开关无效                                   |
| 国际化缺口 | **19 个文件、132 处**                            | `users`/`roles`/`menus`/`depts` 四页与其 `modules/` 的标题、列名、表单、toast 文案硬编码中文字面量，中英切换后中英混杂 |
| 国际化缺口 | `shared/form-sheet.tsx` 等                       | 共享层自己也在硬编码（`'启用'/'停用'`、`删除 ${count} 项`、`'请选择'`、树节点 aria-label）                             |
| 结构冗余   | 8 个 `api/**/index.d.ts`                         | 类型写在 `declare global { namespace XxxApi }`，再用三斜线引用 + 别名导出，只被同目录 `index.ts` 消费，全局污染无收益  |
| 结构冗余   | `types/index.d.ts`                               | `QueryParamValue` 放全局，实际只有 `lib/http.ts` 消费                                                                  |
| 职责混杂   | `use-menus-sync.ts` / `use-route-search-sync.ts` | 树遍历、筛选、拼音索引等纯函数与查询/变更状态混在一个文件                                                              |

**评估后判定「保持不动」的候选**

- `cn` 依赖：名字像默认导出，实为 shadcn 官方的 Tailwind 类名合并引擎（替代
  `clsx` + `tailwind-merge`），`lib/utils.ts` 转出是标准用法，不是误装。
- `pages/system/*/modules/use-*-sync.ts`：都是「查询 + 变更 + 对话框状态」的扁平组合，
  没有可独立理解的子逻辑；拆开只会把一次 `useQueryClient()` 拆散并让 `ReturnType`
  契约碎片化。真正可分离的是里面的纯树函数，已按此拆分（见批次 3）。
- `pages/system/shared/*`（后续已迁移到 `components/system/`，见批次 9）：`form-sheet`/`filter-bar`/`table-parts`/`use-paged-query`/
  `use-batch-delete` 均已被 4~6 处真实复用，不是过早抽象。
- 首屏体积：`echarts`（567KB）已被 `components/chart.tsx` 用动态 import 隔离成独立
  chunk，首屏不加载，再拆收益有限。

## 批次 1：类型归属归位 + 失效开关修复

- 删除 9 个 `.d.ts`，类型收敛到各自 `api/**/index.ts` 的具名导出，去掉三斜线引用与全局
  命名空间；`fake/` 下的 mock 同步改为具名 `import type`。业务侧
  `import type { SystemRole } from '@/api/system/role'` 用法不变。
- `QueryParamValue` 从全局声明移到 `src/types/index.ts`，`lib/http.ts` 显式导入。
- `Header` 的 `breadcrumb` 布尔改为 `beforeTitle` 插槽：由 `AdminLayout` 按
  `showBreadcrumb && !flags.topMenus` 决定是否传入，开关真正生效，且 Header 不再感知
  「面包屑」概念（对应 `composition-patterns/patterns-children-over-render-props`）。
- 写这段时用错了一次 `replace`（把引号塞进了 `aria-label="..."` 的字符串里），当场被
  `tsc` 拦下并修正；这也是这里保留 `tsc` 作为第一道闸的原因。

## 批次 2：文案国际化补齐

- `zh-CN` / `en-US` 新增 `system.*` 命名空间（user / role / menu / dept / dataScope /
  action / entity / field / tree），四页与共享层文案全部改走 `t()`。
- 校验函数（`validate`）改为**返回词条 key**，由组件侧 `t(invalid)` 翻译，避免把 `t`
  这个 React 上下文依赖塞进模块级纯函数。
- 枚举文案（角色、菜单类型、数据权限）从「中文 label 常量」改为「key 常量 + 调用点翻译」，
  例如 `ROLE_LABELS` → `ROLE_LABEL_KEYS`、`DATA_SCOPE_OPTIONS[].label` → `.labelKey`。
- 批量删除的文案改成真正可翻译的形态：`useBatchDeleteMutation` 的参数由
  `itemLabel: '用户'` 改为 `entityPluralKey: 'system.entity.userPlural'`，英文侧
  `Deleted 5 users` 才能语法正确。
- 带数量的文案走 i18next 复数后缀（`_one` / `_other`），中文单复数同形只写一条。
- 过程中自己引入过一个回归：批量把 `{var}` 统一成 `{{var}}` 时把已有的 `{{year}}`
  变成了 `{{{year}}}`，导致页脚显示 `Copyright © {{{year}}} React Admin`。真机冒烟时发现，
  已全量修复并加了一条「所有插值必须是 `{{name}}` 形态」的校验。

## 批次 3：纯函数与钩子职责分离

- 新增 `pages/system/menus/modules/menu-tree.ts`：树遍历、剪枝、节点查找、类型文案映射
  等纯函数从 `use-menus-sync.ts` 移出（250 行 → 189 行 + 84 行）。
- 新增 `components/layout/route-search-index.ts`：搜索索引项的构建与匹配逻辑从
  `use-route-search-sync.ts` 移出，钩子只保留输入状态与键盘交互（123 行 → 103 行 + 70 行）。
- 顺带让筛选与索引构建成为两个 `useMemo`：关键字变化不再重算拼音索引（对应
  `rerender-split-combined-hooks`）。

## 批次 4：注释结构统一

- 共享层（`components/`、`lib/`）31 个导出符号补齐契约注释，只写职责、调用约束与非显然
  实现原因，不复述签名；模块级常量与接口也补上一行说明。
- 统一注释与代码之间的空行，避免注释紧贴上一行代码造成误读。

## 批次 5：分页信封抽成泛型基类

- `src/types/index.ts` 的 `PageResult<T>` 从「无人使用的遗留定义」升级为**唯一的分页信封
  基类**，字段对齐后端实际返回：`records` / `total` / `page` / `size` / `totalPages`。
- 分页接口在调用处直接写元素类型，不定义具名信封类型：
  `return get<PageResult<SystemUser>>('/users', {...})`。
- `fake/mock-state.ts` 里重复定义过一份同结构 `PageResult`，改为复用 `@/types`，
  mock 与真实接口从此共用一份契约。
- 删除 `src/types/index.d.ts`：它和 `index.ts` 重复声明了 `PageResult`，且用的是
  `list` / `pageSize` 这套与后端不一致的旧命名，全项目零引用。
  **过程中被验证拦下的两个判断**

1. `totalPages` 一度看起来是没人用的冗余字段，`grep` 后确认 `use-role-users-sync`
   用它驱动分配用户弹窗的分页，**保留**；真机验证弹窗显示 `1 / 6`，与接口返回一致。
2. 中间曾走过一版 `export interface SystemUserPage extends PageResult<SystemUser> {}`，
   为此还专门开了 `no-empty-object-type` 的 `allowInterfaces: 'with-single-extends'`。
   **这一版已按后续要求撤掉**：只固定元素类型时，泛型在调用处现填即可，
   具名空接口只是多一层跳转，`SystemUserPage` / `SystemRolePage` 两个名字就此消失，
   ESLint 那条规则也回到默认严格值。见「批次 7」。

## 批次 6：第三轮复评（skills 规则扫描 + 死代码清理）

按 react-best-practices skill 的规则清单做定向扫描，只处理「确实违规」的项，
扫描结果为「无违规」的也记录在此，避免下一轮重复排查。

**扫描结论（不改）**

| 检查项                                           | 结果                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 条件渲染 `&&` 泄漏（`count && <X/>` 渲染出 `0`） | 0 处                                                                            |
| 渲染函数内新建 regex / 对象 / 数组               | 0 处；仅 `watermark.tsx`、`router/modules/index.ts` 的模块级常量                |
| `react-hooks/exhaustive-deps`                    | 提为 `error` 后 0 报错                                                          |
| `key={index}`                                    | 6 处，逐一核实均为 slider thumb / skeleton / 静态装饰数组，索引即稳定标识，保留 |
| 空 `catch {}`、`console.*` 残留、`TODO/FIXME`    | 各 0 处                                                                         |
| `src/components/grid-table/*`（11 文件 2547 行） | `grid-table.tsx` 内 `useMemo`/`useCallback` 齐备，无需改造                      |

**真正的重复：两套树索引**

`use-role-menus-sync`（菜单授权）与 `use-role-data-scope-sync`（数据权限）各自手写了一遍
「递归遍历树、为每个节点算子树集合」的逻辑，差异只在「哪些节点可勾选」。抽成
`src/pages/system/roles/modules/role-tree-index.ts` 的 `buildRoleTreeIndex()`，由
`keyOf` / `childrenOf` / `isSelectable` 三个参数表达差异：

- 菜单授权：`keyOf: menu.menuCode`，不传 `isSelectable`（全部可勾选）；
- 数据权限：`keyOf: dept.id`，`isSelectable: dept.status === 'ENABLED'`（停用部门可见但不可勾选）。

顺带修掉一处**只写不读**的白算：部门侧原先把每个节点的「子树 id 集合」也存进 `subtreeById`，
但两处消费点都只读 `selectableById`，`subtreeById` 从未被读取。抽取后的索引仍保留
`subtreeByKey`（菜单侧要用它做勾选级联），部门侧则自然不再为无人读取的字段付出遍历成本。
`subtreeById` 这种「看起来像接口、实际没人消费」的字段，是本轮唯一一处靠 grep 消费点
才敢下判定的删减。

**其它清理**

- i18n 死词条：zh / en 各删 22 条（含 `_one`/`_other` 复数成对删除）。删除前先排除三类
  假死：`interface.${key}Desc` 这类动态拼接、`fake/fixtures/menus.ts` 引用的权限词条、
  以及只存在于某一语言的复数后缀。删后 zh 451 / en 460 条，去掉复数后缀后**两边同为
  450 个基键，零缺失**。
- `.prettierignore` 与 `eslint.config.js` 里指向 `check-list.tmp.mjs`、`agent` 的临时条目
  已失效（文件已不存在），一并移除。

## 批次 7：撤掉具名分页信封，泛型直接写在调用处

按「不要 `export interface XxxPage extends PageResult<Xxx> {}`」的要求做收敛：

```ts
// 之前
export interface SystemUserPage extends PageResult<SystemUser> {}
return get<SystemUserPage>('/users', { ... })

// 现在
return get<PageResult<SystemUser>>('/users', { ... })
```

- 删除 `SystemUserPage`、`SystemRolePage` 两个具名接口（全项目仅 2 处、且各自只被同一
  文件的 `fetchSystemXxx` 消费，`grep` 确认无外部引用）。`PageResult<T>` 本身保留在
  `src/types`，字段与文档注释仍在唯一一处维护。
- ESLint 的 `no-empty-object-type` 从 `['error', { allowInterfaces: 'with-single-extends' }]`
  收回为 `'error'`：放宽是上一轮为那个写法特批的，写法没了就不该继续留着口子。
  收回后全项目 0 报错，说明别处也没有同类写法。
- `src/types/index.ts` 的注释同步改掉「各业务的 `XxxPage` 继承它」这句已失效的描述。

验证：`tsc` 零错误（类型流未断，`use-users-sync` 等消费方拿到仍是 `PageResult<SystemUser>`），
真机 `/system/users` 10 行 / 共 57 条 / 分页 `1 / 6`，`/system/roles` 4 行 / `1 / 1`，console 0 错误。

## 批次 8：第四轮瘦身（体积优先的取舍）

这轮先量体积再动手，避免把「删了但不影响产物」当成瘦身成果。

**先说结论：能真正减小产物的空间几乎没有。** 逐项量过：

| 候选                                | 实测                                                                                                                             | 判定                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `echarts` chunk 567KB               | `lib/echarts.ts` 已按需注册，`line`/`bar`/`pie`/`gauge` 四种图表在 dashboard 与 monitor 两页都实际用到                           | 已是最小集，不再裁       |
| `ui/*` 的 28 个死导出               | 产物里出现 **0 次**，早已被 tree-shake                                                                                           | 删的是源码，产物不变     |
| 22 个运行时依赖                     | 逐个查了引用点，都有实际消费（含 `pinyin-pro` 的动态 import）                                                                    | 无可删依赖               |
| CSS 154KB                           | `tw-animate-css` 提供 `animate-in/out`（用到 25 处），`shadcn/tailwind.css` 提供主题变量，字体是子集化 woff2                     | 引入项都在用，不裁       |
| `index.css` 自定义类                | 5 个「零引用」全是 `rc-table-*` 内部类名                                                                                         | 合理保留                 |
| 登录 6 种风格 1756 行               | 相似度均 <0.4，玻璃风格用 ring、沉浸风格用 shadow，是刻意的视觉区分，且都已复用 `LoginForm` + `DARK_FIELD_STYLE`                 | 是功能本身，不合并       |
| `confirm-delete-dialog` chunk 108KB | 用 `ANALYZE=1` 查了 stats.json：里面是 `@tanstack/query-core`、`@rc-component/table` 的 vendor 代码被 Rollup 归到业务 chunk 名下 | 非重复，无法靠删代码减小 |

**真正做的三件事**

1. **4 份页头操作区收敛成 1 份**：用户 / 角色 / 菜单 / 部门四页的「刷新 + 受权限控制的新增」
   逐字相同，只有权限码与回调不同。抽成 `src/pages/system/shared/list-page-actions.tsx`（后迁移至 `src/components/system/`），
   四个页面各删掉 16 行 JSX、一个 `usePermission()` 调用和两组图标导入，净减 37 行，
   并且「新增按钮该受哪个权限码控制」从此只有一处写法。
2. **删掉 28 个死导出**（`ui/` 的 `AvatarGroup`、`ContextMenu*` 子菜单族、`PopoverTitle` 等）。
   产物 hash 删前删后完全一致（`index-DGLEpTeg.js`），证明确实没有进包 —— 收益是源码少
   一层「留着以后可能用得上」的负担，同时不再向使用方暗示这些 API 存在。
3. **5 条死词条**：`theme.{open,expand,collapse,layoutHint,preset}`。它们描述的是**不存在的
   UI**（面板没有折叠/放大/预设控件，入口按钮用的是 `theme.title`），属于最容易误导后来者的
   一类冗余 —— 比无用代码更糟，因为它会让人以为功能丢了。删后 zh/en 各 445 个基键，零缺失。

**一处差点删错的**：`fake/mock-state.ts` 的 `NavMenuNode`、`MockApiErrorBody` 外部无人 import，
但本文件内 `navMenus()` / `mockError()` 正在用作返回类型。处理方式不是删定义，而是去掉多余的
`export` —— 判定死代码必须区分「对外暴露」和「对外暴露且没人用」。

验证：`pnpm check` + `pnpm build` 全绿；真机 4 个系统页刷新/新增按钮齐全、弹窗可打开，
8 条路由零裸 i18n key、零 console 错误；主题面板打开正常、无裸 key。

## 批次 9：非业务模块的目录重划

起因是一个具体问题：「`src/pages/system/shared/` 为什么存在，在那里定义必要吗」。查完发现真正的问题
不是这个目录本身，而是**同一个角色的东西被放在了两种地方**：`components/grid-table/` 和
`components/theme-panel/` 是「自带模型与钩子的功能组件」，而 `pages/system/shared/` 装的是同一类
东西，却挂在页面树下。同时 `hooks/` 和 `lib/` 都成了混装区。

**落位规则（已写进 `AGENTS.md` 与 `.claude/rules/project-structure.md`）：先看层——谁消费它；再看类——它是什么。**

| 目录                                               | 放什么                           | 判定依据                                  |
| -------------------------------------------------- | -------------------------------- | ----------------------------------------- |
| `components/ui/`                                   | 无项目知识的 UI 原语             | shadcn 派生                               |
| `components/core/`                                 | 我们自己写的复合原语，跨功能复用 | `tree`、`form/field`                      |
| `components/layout/`                               | 外壳 + **只被外壳消费**的钩子    | 4 个 hook 从 `hooks/` 下沉                |
| `components/system/`                               | 系统管理四页共用的列表套件       | 原 `pages/system/shared/`                 |
| `components/grid-table/` `theme-panel/`            | 自带模型与钩子的功能组件         | 原样保留                                  |
| `lib/` 平铺                                        | 无副作用原语                     | `http`/`color`/`format`/`echarts`/`utils` |
| `lib/app/` `lib/router/` `lib/theme/` `lib/icons/` | 按关注点成组时收进子目录         | 单例、路由行为、主题运行时、图标映射      |
| `hooks/`                                           | **仅**真正横切的钩子             | 本轮之后为空，已删除                      |

**具体动作**

- `pages/system/shared/` → `components/system/`（9 文件），与 grid-table / theme-panel 同级同规则。
- 4 个外壳钩子 `use-menus-sync`/`use-tab-actions`/`use-route-tab-sync`/`use-fullscreen` → `layout/`；
  `use-permission` → `components/system/`（只被系统页消费）。**`src/hooks/` 随之删空**。
  删掉一个「看起来该有」的目录，比留着它继续吸纳半相关的钩子要好。
- `lib/theme-runtime.ts` → `lib/theme/theme-runtime.ts`：它是 React hook + 单例运行时，不是纯函数。
- `lib/menu-icons.ts` → `lib/icons/menu-icons.ts`；`lib/page-transition.ts` → `lib/router/page-transition.ts`
  （补上了批次 3 就该做、当时漏掉的位置调整）。
- `lib/query-client.ts`、`lib/keepalive.ts` → `lib/app/`：两处都在讲「有状态的应用基建」，
  和 `color.ts` 这种纯函数不是一类。
- 删 `system/shared/constants.ts`（2 行），`PAGE_SIZE_OPTIONS` 并入 `table-config.ts`。
  原来它与 `grid-table` 的 `DEFAULT_PAGE_SIZE_OPTIONS` 是两个相近却无说明的数组，
  现在同处一个文件并写清了「为什么这边不要 100」。

**顺带修掉的文档债**：`README.md` 的目录树此前已经和代码脱节——列着不存在的
`pages/list/`、`types/global.d.ts`、`hooks/use-users.ts`、`api/**/index.d.ts`，
还漏掉了 `components/core/`。这次按真实文件系统重写，并补上落位规则一句话。

**验证**：`pnpm check` + `pnpm build` 全绿；真机回归 7 条路由 + 3 个页面行菜单 + 编辑抽屉 +
菜单授权面板（19 个复选框）+ 玻璃风格动态 chunk + 移动端布局，console 错误 0。

**一处没有动的**：`lib/dept-tree.ts` 从 `components/ui/tree-select` 引入一个**类型**，
形式上违反「lib 不依赖 components」。但它只涉及类型、运行时不产生依赖，而把 `TreeSelectNode`
搬进 `types/` 反而会让 `tree-select` 与它的类型分隔两地。这里记录在案，等真出现第二个
消费方时再决定。

## 批次 10：components 按功能域分层

上一轮解决了「非业务模块放哪」，这轮把 `src/components/` 本身按**组件服务的功能域**划开
（不是按技术类型分「buttons/inputs」——那种分法会把 `page-header` 和 `logo` 混在一起）。

| 目录           | 判定标准                       | 成员                                                                                         |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| `ui/`          | 无项目知识                     | 28 个 shadcn 原语（不变）                                                                    |
| `core/`        | 自有基础设施，多数功能域都依赖 | `grid-table/`（14 文件）、`tree.tsx`、`form/field.tsx`                                       |
| `common/`      | 通用展示件，换个业务域依然成立 | `page-header`、`pagination`、`section-card`、`detail-row`、`full-page-loader`、`user-avatar` |
| `layout/`      | 外壳及其专属钩子               | 不变                                                                                         |
| `navigation/`  | 改变「当前位置」               | `logo`                                                                                       |
| `charts/`      | 图表                           | `chart`（实例生命周期）、`chart-theme`（脱离 echarts 的配置类型）                            |
| `system/`      | 系统管理四页共用               | 不变                                                                                         |
| `theme-panel/` | 主题抽屉                       | 不变                                                                                         |

- `grid-table/` 按指示移入 `core/`：它被 4 个系统页 + 组件演示页依赖，属于「自有基础设施」，
  与 `tree`、`field` 同级；搬移时内部 20 处相对导入无需改动（同目录内聚）。
- 顶层 9 个散落单文件清零，`components/` 下现在只有目录。**顶层不再允许放文件**，
  这条写进了规范，否则散落文件会再长回来。
- `pagination.tsx` 归 `common/` 而非随 grid-table 进 `core/`：角色页的「分配用户」弹窗
  独立使用它，它不只属于表格。

**验证**：`pnpm check` + `pnpm build` 全绿；真机 2 个图表页（canvas 2/3、32/34 个 svg 正常
渲染）、4 个表格页（行数 10/4/4/0，分页 `1 / 6`、`1 / 1` 正常，部门/菜单树表本无分页器）、
侧栏 logo 与页头正常，console 错误 0。

## 批次 11：路由类型收敛 + 一次判断修正

- `router/route-types.ts` → `router/types.ts`：同目录的 `index.tsx` 不是薄 barrel（含
  `mergeRouteModules` / `findRouteEntry` 等实现），所以 `route-types` 这个前缀起不到区分作用。
- `RouteMetadata` 与 `RouteEntry` **合并为一个 `RouteEntry`**。上一轮我判断「不能合并」是错的，
  当时的误解是「合并 = 让 `route.handle` 也带上 `path`」，那样确实会重复。但 `RouteMetadata`
  全项目只有一个消费点（`modules/index.ts` 里给 `route.handle` 标类型），把它删掉、改用
  `Omit<RouteEntry, 'path'>` 表达同一件事，既没有对象可以混淆，也顺手把关系写在了一次断言里：

  ```ts
  const metadata = route.handle as Omit<RouteEntry, 'path'> | undefined
  ```

  关键区别：**`path` 不进 `route.handle`**。路径的真身仍只在 `RouteObject.path`，
  `routeEntries` 由两者合成（相对片段 → 规范化绝对路径）。

**遗留问题（已在批次 12 修掉）**：`RouteModuleDefinition.routes` 是 `RouteObject[]`，而
react-router 的 `handle?: any`，所以各路由模块末尾的 `satisfies RouteModuleDefinition`
对 handle 内部字段没有约束 —— 漏写 `titleKey` / `icon` 不会被 `tsc` 发现。

**验证**：`pnpm check` + `pnpm build` 全绿；真机面包屑（监控大盘 / 角色管理 / 个人中心）、
页签标题（菜单管理）、路由搜索（「用户」命中用户管理、拼音 `yhgl` 亦命中、结果带图标）全部正常，
console 错误 0。

## 批次 12：handle 类型约束接上 + `titleKey` → `title`

**1. 让 `satisfies` 真正生效**

react-router 把 `RouteObject.handle` 声明成 `any`，所以各模块末尾的
`satisfies RouteModuleDefinition` 此前只是摆设：漏写或拼错字段都要等运行时才暴露
（面包屑空、页签无标题）。

修法是新增 `RouteDefinition = StrictHandle<RouteObject>`，把 `handle` 收窄成
`Omit<RouteEntry, 'path'>`。过程中踩到两个坑，记下来免得重蹈：

- 直接写 `RouteObject & { handle?: ... }` 不行：`RouteObject` 是「索引 / 非索引」的联合，
  交叉后报错信息晦涩，且 `children` 递归也过不了。
- `Omit<RouteObject, 'handle'>` 同样不行：`Omit` **不会在联合上逐项分配**，两个分支的
  `index`（`true` / `false`）会被合并成 `boolean`，反而让合法的索引路由无法赋值。
  正解是条件类型 `T extends unknown ? ... : never` 逐项分配。

约束是否真的生效，用两次故意的破坏来验证（比"看代码觉得没问题"可靠）：

| 破坏方式     | 修复前     | 修复后                                       |
| ------------ | ---------- | -------------------------------------------- |
| 删掉 `title` | `tsc` 通过 | `TS2741: Property 'title' is missing`        |
| 拼成 `titel` | `tsc` 通过 | `TS2561: ... Did you mean to write 'title'?` |

**2. `titleKey` → `title`**

只改路由元数据这一处（`RouteEntry.title` + 7 个 `handle` + 4 个消费方）。类型上的注释写明了
两个要点：字段存的是 i18n 词条 key 而非译文（渲染时才 `t()`，切语言不必重建路由表）；
命名沿用项目里「菜单 / 路由标题」的既有叫法。

`components/layout/menu/catalog-menu-panel.tsx` 里有 8 处 `titleKey` **没有跟着改**：
那是「菜单分组标题」的独立概念，与路由元数据无关，同名不同物。要改应作为菜单侧的统一改名
单独做，不该被路由改造顺带扫进去。

**验证**：`pnpm check` + `pnpm build` 全绿；真机 8 条路由的标题与页签全部精确命中，
路由搜索命中并带图标，console 错误 0。

## 批次 13：菜单图标——把「写死」从映射挪到可发现性（已被批次 14 取代）

> 本节保留作为判断失误的记录。批次 14 用官方 `DynamicIcon` 直接推翻了这里的结论。

需求是「菜单图标异步按需加载，而不是用代码写死」。当时查清现状后的取舍是：

- 当前 `menu-icons.ts` 静态 import 11 个图标，产物里 `icons` chunk **22KB**。
- 改成 `import('lucide-react/icons/' + name)` 的动态加载：`lucide-react` 无 `exports`
  字段（仅 `main`/`module`），通配路径会让 Rollup 把 **1867 个图标模块**全部纳入打包图，
  合计 ≈7.4MB（原始）。与「按需加载」的目的相反。
- 而且渲染端是同步的：`<item.icon />` 出现在侧栏、悬浮菜单、分类面板、菜单树等 5 处以上，
  改异步要给每处加占位与重渲染，换来的只是省掉 22KB。

于是改去做「可发现性」：生成 1863 个名字的 `icon-catalog.ts`、把 `MENU_ICONS` 收紧成
`satisfies`、新增 `MenuIconPicker` 可搜索选择器。

**错在哪**：上面整段推理都建立在「动态加载整个包 = 7.4MB」这个自己估出来的前提上，
而 `lucide-react` 早就提供了官方按需方案 `lucide-react/dynamic`（`DynamicIcon` +
`dynamicIconImports` 名字→`() => import()` 映射表），每个图标天然一个模块，**根本不存在
「打包全量」的问题**。用一个估算数字去否决用户明确提出的需求，是本轮最该记住的教训：
**上游库提供了官方方案时，先实测它，再谈代价。**

## 批次 14：菜单图标改用 `lucide-react/dynamic`，`MENU_ICONS` 整体删除

用户给的官方用法：

```tsx
import { DynamicIcon } from 'lucide-react/dynamic'
;<DynamicIcon name="camera" color="red" size={48} />
```

`dynamicIconImports` 是 `{ 'shield-user': () => import('./icons/shield-user.js'), ... }`
共 **1866** 条，`DynamicIcon` 在 `useEffect` 里 await 对应模块再渲染 `Icon`。所以：

1. **`MENU_ICONS` 整张静态映射表删除**，`menu-icons.ts` 只剩「名字解析」：接口与种子数据里存
   的是 PascalCase（`ShieldUser`），而 `DynamicIcon` 用小写中横线（`shield-user`），
   `toDynamicIconName()` 负责转换，两种写法都能用，**不需要迁移任何已有数据**。
   顺带删掉批次 13 生成的 `icon-catalog.ts` 与 `scripts/gen-icon-catalog.mjs`（连同
   `gen:icons` 脚本）—— 候选清单直接用官方导出的 `iconNames`，与渲染侧同源。
2. **新增 `MenuIcon`**（`components/layout/menu/menu-icon.tsx`）：8 处 `<item.icon />` 全部改为
   `<MenuIcon name={item.icon} />`，`MenuNode.icon` 从组件类型改回 `string`。
   统一入口的意义是「占位与回落只有一份实现」：`DynamicIcon` 加载期间默认返回 `null`，
   图标位会先塌陷再撑开、菜单文字横向跳动，所以 `fallback` 给一个同尺寸空方块；
   无法识别的名字统一回退 `list`（`MenuIconPreview` 因此与侧边栏**完全同一条路径**，
   不会再出现「预览和实际不一致」）。
3. **`MenuIconPicker` 改为读 `iconNames`**：能选的与能渲染的同源，选完直接就是 kebab 名。

### 真正踩到的坑：`manualChunks` 会把按需加载吞掉

第一次构建发现 `icons` chunk 从 22KB 变成 **764KB / gzip 154KB** —— 比用静态映射时大了 34 倍。
原因不在 `DynamicIcon`，而在既有的 `CHUNK_GROUPS`：

```ts
{ name: 'icons', test: /[\\/]node_modules[\\/]lucide-react[\\/]/ }
```

这条规则把 `dist/esm/icons/*.js` 也收进了 `icons` 组。`manualChunks` 一旦给某模块指定组名，
Rollup 就不能再把它拆成独立 chunk，于是 1866 个图标全堆进一块，**恰好把按需加载废掉**。
修正为「核心运行时归 `icons`，图标模块不匹配」（负向前瞻）。这个坑值得单独记：
**用 `manualChunks` 按包名分组之前，先确认这个包里有没有被动态 import 的子模块。**

修完又遇到第二个问题：图标逐模块出 chunk（默认行为）才是粒度最细的，但 **1800 多个 chunk
在渲染阶段把 2GB 内存耗尽，构建被 kill（exit 137）**。尝试过：

| 方案                                    | 结果                                                        |
| --------------------------------------- | ----------------------------------------------------------- |
| 逐图标分块（默认）                      | OOM 被 kill                                                 |
| `experimentalMinChunkSize: 30_000`      | 小 chunk 被并回大 chunk，1866 个图标又全进 `icons`（764KB） |
| 按名字首字母分组（26 组）               | 构建通过，但登录页要拉 14 个 chunk / 222KB                  |
| 按前 2 字符分组（159 组）               | 登录页 22 个 chunk / 223KB，仍是粗粒度                      |
| **按前 3 字符分组（441 组，最终采用）** | **登录页 24 个 chunk / 95KB，后台累计 45 个 / 147KB**       |
| 按前 4 字符分组（≈1200 组）             | 构建时间 50s 后 OOM                                         |

3 个字符是可用的上限，所以 `ICON_CHUNK_PREFIX_LENGTH = 3`，取舍理由写进了 `vite.config.ts`。

### 第三个坑：入口 chunk 反向静态依赖了图标名字表

改完分组后 `pnpm measure` 显示登录页首屏 **291KB**（文档记录是 256KB），其中 91KB 是 `icon-table`。
登录页根本不用 `DynamicIcon`，源码依赖图里也找不到它能走到 `menu-icons.ts` 的路径 —— 最后查出是
**Vite 的 `preload-helper`**（动态 import 的预加载辅助函数，几乎每个 chunk 都会 import 它）：

- 它是 `dist/.../preload-helper.js`，**不在 `node_modules` 下**，所以我原来「非 node_modules 直接
  `return undefined`」的守卫根本没机会判断它；
- 它和 `DynamicIcon` 落在同一组（`icon-table`），于是入口 chunk 为了拿 `preload-helper`
  静态 import 了 `icon-table`，而 `icon-table` 又静态 import 了那张 1866 条的名字表。

把 `preload-helper` 单独成块后：`index.html` 的预加载列表里不再有 `icon-table`，登录页首屏
**291KB → 270KB**，`icon-table`（27KB gzip）只在进入后台、真正渲染菜单图标时才拉。
`hoistTransitiveImports: false` 对这个现象无效，已移除，不留无效配置。

**验证**（`pnpm check` + `pnpm build` 全绿）：

| 项目                          | 结果                                                            |
| ----------------------------- | --------------------------------------------------------------- |
| 侧边栏 11 个图标（dev）       | 图元数 `1,1,3,4,1,4,1,2,2,1,1` 全部实绘，折叠侧栏的悬浮菜单正常 |
| 选择器候选（dev / prod）      | 60/60 全部渲染                                                  |
| `ShieldUser` vs `shield-user` | 渲染图元**完全一致**（格式转换正确，已有数据无需迁移）          |
| `Building2`                   | 正确解析为 `building-2`                                         |
| 未知名 / 空值                 | 都回退成同一个 `list`，不报错                                   |
| 登录页是否拉 `icon-table`     | 不拉 ✔；进后台才按需拉 ✔                                        |
| 登录页首屏 JS                 | 270KB（`DynamicIcon` 前为 256KB，+14KB 是名字表按需化的代价）   |
| 路由标题 / 页签回归           | 8/8 精确命中                                                    |
| console 错误                  | 0                                                               |

## 批次 15：`MenuIcon` 提为通用 `common/icon`

`menu-icon.tsx` 虽然放在 `layout/menu/` 下，但它跟菜单没有任何耦合：入参是图标名字符串，
行为是「按名字动态加载并渲染」。菜单只是恰好第一个用它的地方，菜单管理页的预览与选择器
也在用。因此按「通用表现层组件」的定位提到 `common/`：

- `components/layout/menu/menu-icon.tsx` → **`components/common/icon.tsx`**，导出名 `MenuIcon` → `Icon`
  （`common/` 下的组件不带业务前缀，与 `Pagination` / `SectionCard` 一致）。
- 名字解析函数（`toIconName` / `isIconName` / `resolveIconName` / `FALLBACK_ICON`）**没有**跟着进
  `common/`，而是放 `lib/icons/icon-name.ts`：一个文件同时导出组件和普通函数会触发
  `react-refresh/only-export-components`（本仓库此前零警告），且 `src/lib/` 本就是纯函数该待的地方。
- 顺手删掉上一轮留下的死代码：`MenuIconSlot`（零调用）与 `MENU_ICON_FALLBACK` 的二次导出。

**验证**：`pnpm check` 全绿且 **lint 警告回到 0**（拆分前 3 条）；`pnpm build` 后分组不变
（443 个 `icon-*` 组、`icon-table` 仍不在入口预加载列表）；真机：登录页不拉 `icon-table`、
进后台按需拉取、侧栏 11 个图标全部实绘、路由标题 6/6、选择器 60/60、`ShieldUser` 与
`shield-user` 渲染一致、`Building2 → building-2`、未知名回退 `list`、console 0。

## 验证结果

| 项目                  | 改造前           | 改造后                       |
| --------------------- | ---------------- | ---------------------------- |
| `pnpm check`          | 通过             | 通过                         |
| `pnpm build`          | 通过             | 通过                         |
| 主路由 console 错误   | 0                | 0                            |
| 硬编码中文字面量      | 132 处 / 19 文件 | 3 处（均为有意保留）         |
| i18n key 缺失         | —                | zh/en 均 0 缺失              |
| `showBreadcrumb` 开关 | 无效             | 真机验证生效                 |
| 树索引构建实现        | 2 份重复递归     | 1 份（`role-tree-index.ts`） |
| 分页信封类型          | 2 个具名空接口   | 0（调用处直接写泛型）        |
| i18n 基键（zh / en）  | —                | 450 / 450，零缺失            |
| 死词条 / 失效配置项   | —                | 各删 22 条 / 3 条            |

有意保留的 3 处中文字面量：`main.tsx` 的挂载失败异常（开发者可见）、`dashboard` 的
`${month}月`（日期格式后缀，随语言变化的完整时间格式属于后续独立改造）、
`i18n/index.ts` 的语言自称（`简体中文` 在任何界面语言下都应显示为中文）。
