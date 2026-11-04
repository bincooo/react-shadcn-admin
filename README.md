# React Admin

基于 **React 19 + Vite 7 + Tailwind v4 + shadcn/ui（Radix UI）** 的后台管理系统基础框架。
不依赖 antd / ant-design 生态，图标统一使用 `lucide-react`。

## 快速开始

```bash
pnpm install
pnpm dev         # http://localhost:5173
pnpm build       # 产物输出到 dist/
pnpm preview     # 预览构建产物
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint（react-hooks / react-refresh / TS 规则）
pnpm lint:fix    # 自动修复
pnpm format      # prettier 格式化（含 Tailwind 类名排序）
pnpm check       # typecheck + lint + format:check，提交前跑一遍
pnpm smoke       # Playwright 冒烟：登录 / 6 种登录风格 / 5 个页面 / 语言 / 主题 / 深色（VITE_MOCK=false 时需先启动后端）
pnpm measure     # 用 dist 产物量首屏字节与 LCP（需先 build + preview）
pnpm analyze     # ANALYZE=1 构建，产出 stats.json 看 chunk 构成
```

演示账号：`admin / 123456`（全部权限）与 `demo / 123456`（只读）。两者在真实后端种子与 mock 中一致。

> **纯前端运行**：在 `.env` 中设置 `VITE_MOCK=true`（参考 `.env.example`），`/api/*` 全部由
> `vite-plugin-fake-server` 提供，无需启动 ddd-springboot。mock 覆盖登录 / 注册 / 个人资料 / 按钮权限、
> 侧边导航与菜单管理、用户、角色（含用户分配、菜单授权、数据权限）与部门树的读写；
> 数据保存在 dev server 内存中，重启后回到种子状态。设为 `false` 时只有仪表盘 / 监控使用演示数据，
> 其余请求经 Vite 代理（`server.proxy`，默认 `http://127.0.0.1:8080`）转发到真实后端。
> 插件启用了 `enableProd`，构建时同样按 `VITE_MOCK` 决定是否把全量 mock 打进产物。

## 已实现能力

### 主题系统（对应设计稿「主题配置」面板）

- **外观**
  - 主题模式：明亮 / 黑暗 / 自动（自动跟随系统 `prefers-color-scheme`）
  - 主题颜色：12 个预设色 + 自定义 HEX 输入 + 竖直色相滑条，实时对比度提示
  - 状态颜色：成功 / 警告 / 危险 / 信息，可单独改色与恢复默认
  - 布局样式：纵向、分栏、双栏、经典、混合、横向 —— 六种真实可切换的骨架
  - 登录页风格：臻享双栏、动感玻璃、滑动登录、气泡简约、分屏沉浸、经典点阵
  - 登录页右上角可直接切换主题模式与登录风格（未登录也生效，与主题面板共用配置）
- **界面**：侧边栏宽度、暗色侧边栏、顶栏高度、圆角、内容宽度（流式/定宽）、标签栏、面包屑、页面缓存、切换动画、紧凑模式、页脚；可切换级联浮层 / 金蝶云风格分类网格菜单
- **扩展**：水印（可自定义文字）、灰色模式、色弱模式、自动锁屏、版权信息（可自定义文案）

主题写入 CSS 变量（`--primary` / `--success` / `--radius` / `--sidebar-width` …），
因此所有 shadcn 组件与图表都会自动跟随主题色变化。配置持久化在 `localStorage`。

### 框架能力

| 能力     | 说明                                                                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 路由     | react-router v7（`useRoutes`），页面懒加载 + `RequireAuth` 登录守卫                                                                                                                                                 |
| 多页签   | 右键菜单刷新/关闭/关闭其他/关闭左右侧，固定首页标签，支持中键关闭                                                                                                                                                   |
| 页面缓存 | `keepalive-for-react`，刷新按钮会真正重载缓存页，关闭页签时销毁缓存                                                                                                                                                 |
| 页面搜索 | `⌘K` 风格弹窗，支持中文、英文、全拼与首字母（pinyin-pro）                                                                                                                                                           |
| 国际化   | i18next，简体中文 / English 全量文案，持久化选择                                                                                                                                                                    |
| 数据请求 | ky 封装的请求层 + TanStack Query（分页保留上一页数据）                                                                                                                                                              |
| 表格     | 通用 `GridTable`（`@rc-component/table` 渲染）：`columns / data / config` 三参数接入；服务端排序分页、分组表头、左右固定列、吸顶表头、边框模式、多选、列配置（分组 / 同级拖拽 / Ctrl 跨组 / 改名 / 拆解）、拖拽调宽 |
| 图表     | ECharts 按需引入，色板与主题联动，容器自适应                                                                                                                                                                        |
| 状态     | zustand（theme / app / auth 三个 store，均持久化）                                                                                                                                                                  |
| 移动端   | 侧边栏在 `lg` 以下收起为抽屉导航                                                                                                                                                                                    |

### 通用表格 GridTable

列定义使用 antd Table 风格的 `title / dataIndex / key / render`，分组用 `children`：

```tsx
import { GridTable, type GridTableColumn } from '@/components/grid-table'

const columns: GridTableColumn<UserRow>[] = [
  { title: '用户', dataIndex: 'name', width: 280, fixed: 'left',
    render: (_, row) => <span>{row.name}</span> },
  { title: '城市', dataIndex: 'city', width: 140, fixed: 'left' },
  {
    title: '账号信息',
    key: 'account',
    children: [
      { title: '角色', dataIndex: 'role', width: 130 },
      { title: '状态', dataIndex: 'status', width: 130, hidden: true },
    ],
  },
  { title: '操作', key: 'actions', width: 80, align: 'right',
    render: (_, row) => <RowActions row={row} /> },
]

<GridTable
  columns={columns}
  data={users}
  config={{
    rowKey: (row) => row.id,
    title: '用户列表',
    total: 57,
    sorting: { value: sorting, onChange: setSorting },
    pagination: { page, pageSize, total, onPageChange, onPageSizeChange },
    selection: { selectedKeys, onChange: setSelectedKeys },
  }}
/>
```

- 列上的 `width / minWidth / align / sortable / resizable / hidden / fixed` 会转成对应能力；
  `fixed` 自动生成初始固定列
- `config` 里可配置行主键、标题 / 总条数、加载态、额外初始固定与显隐、受控排序 / 分页、
  多选与选中条操作
- 不传 `sorting` 时表格在本地排序；不传 `pagination` 时不渲染分页条

## 目录结构

非业务模块的落位规则：**先看层（谁消费），再看类（是什么）**。一个 hook 若只有一个消费层，
就留在那一层，不要往公共 `hooks/` 里堆。

```
src/
├─ api/                  # 按业务域拆分，每个域一个 index.ts：类型 + 请求函数
│  ├─ auth/ dashboard/ monitor/ profile/
│  └─ system/{user,role,menu,dept}/   # 分页信封统一写成 get<PageResult<T>>(...)
├─ components/           # 按「组件服务的功能域」划分，顶层不再放散落文件
│  ├─ ui/                # 无项目知识的 UI 原语（shadcn 派生，28 个）
│  ├─ core/              # 自有基础设施型组件：被多数功能域依赖
│  │  ├─ grid-table/          # 通用表格（渲染交给 @rc-component/table）
│  │  ├─ tree.tsx             # 树渲染与勾选联动
│  │  └─ form/field.tsx       # 查询字段（标题在上、控件在下）
│  ├─ common/            # 通用展示件：换个业务域依然成立
│  │  ├─ header.tsx pagination.tsx section-card.tsx
│  │  └─ detail-row.tsx full-page-loader.tsx user-avatar.tsx
│  ├─ layout/            # 后台外壳 + 只被外壳消费的钩子
│  │  ├─ admin-layout.tsx      # 六种布局骨架 + 顶栏菜单 + 页签同步
│  │  ├─ sidebar.tsx header.tsx tabs-bar.tsx mobile-nav.tsx
│  │  ├─ menu/                 # 菜单数据模型与三种场景的渲染
│  │  ├─ route-search.tsx route-search-index.ts
│  │  ├─ lock-screen.tsx watermark.tsx breadcrumb.tsx footer.tsx
│  │  ├─ outlet-with-keep-alive.tsx
│  │  └─ use-menus-sync.ts use-tab-actions.ts use-route-tab-sync.ts use-fullscreen.ts
│  ├─ navigation/        # 改变「当前位置」的组件
│  │  └─ logo.tsx
│  ├─ charts/            # 图表：实例生命周期 + 与 echarts 解耦的配置类型
│  │  ├─ chart.tsx
│  │  └─ chart-theme.ts
│  ├─ system/            # 系统管理四页共用的列表套件
│  │  ├─ list-page-actions.tsx    # 页头「刷新 + 受权限控制的新增」
│  │  ├─ filter-bar.tsx form-sheet.tsx confirm-delete-dialog.tsx
│  │  ├─ table-parts.tsx table-config.ts
│  │  └─ use-paged-query.ts use-batch-delete.ts use-permission.ts
│  └─ theme/             # 主题配置抽屉（面板 + 预览图 + 各分区）
├─ lib/                  # 无副作用的构建块；flat 文件放原语，成主题的收进子目录
│  ├─ http.ts            # ky 封装、鉴权头、错误归一化
│  ├─ color.ts format.ts utils.ts echarts.ts dept-tree.ts
│  ├─ app/               # 有状态的应用基建（单例）
│  │  ├─ query-client.ts      # TanStack Query 全局配置
│  │  └─ keepalive.ts         # 页面缓存实例持有 + 清理动作
│  ├─ router/            # 路由切换行为
│  │  └─ page-transition.ts   # 抽屉导航时跳过入场动画
│  ├─ theme/             # 主题运行时
│  │  └─ theme-runtime.ts     # CSS 变量写入 + 系统明暗订阅（useResolvedMode）
│  └─ icons/             # 图标
│     └─ icon-name.ts         # 图标名解析：PascalCase/kebab → DynamicIcon 名字
├─ pages/                # 路由级页面；页面私有视图/hook/模型就近放 modules/
│  ├─ login/             # 6 种登录风格（后 5 种 lazy 加载）
│  ├─ dashboard/         # 工作台 + monitor/ 监控大盘
│  ├─ system/            # users / roles / menus / depts，四页结构一致
│  ├─ profile/ components/ not-found.tsx
├─ router/               # index.tsx 组合、modules/ 按业务声明、types.ts 路由元数据类型、guard.tsx
├─ store/                # zustand：theme / app / auth
├─ types/                # index.ts 的 PageResult / QueryParamValue、vite-env.d.ts
├─ config/theme.ts       # 主题类型、默认值、状态色、布局与登录风格选项
└─ i18n/                 # i18next 初始化 + zh-CN / en-US 文案（各 445 个基键）
```

## 体积与首屏策略

首屏（登录页）只加载「外壳以外」的东西，后台 UI 与图表按需到位：

| 资源                              | 加载时机                  | 说明                                                                   |
| --------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `react` / `radix` / `icons` chunk | 首屏（`modulepreload`）   | 基础运行时；`icons` 只有 lucide 的 Icon 基座（~1KB），图标本体不在此列 |
| 登录页入口 chunk                  | 首屏                      | 只含默认风格（split），无 motion                                       |
| 其他 5 种登录风格                 | 选中该风格时              | `React.lazy`，glass / slider / bubble 才会带入 motion                  |
| 后台外壳 `admin-layout` chunk     | 登录成功后                | 侧栏 / 顶栏 / 页签 / 主题抽屉 / TooltipProvider                        |
| `echarts` chunk（≈190KB gzip）    | 有 `<Chart>` 的页面挂载时 | 按需注册 + 动态 import，登录页与列表页都不加载                         |
| `pinyin-pro` chunk（≈143KB gzip） | 首次打开页面搜索          | 中文全拼 / 首字母匹配才需要                                            |
| `icon-*` chunk（每组 ≈1–3KB）     | 该图标第一次出现时        | 走 `lucide-react/dynamic`，一个菜单图标只加载自己那一组                |

实测（`pnpm measure`，本地 prod 构建 + gzip 传输体积）：

| 指标                            | 优化前    | 优化后    | 变化       |
| ------------------------------- | --------- | --------- | ---------- |
| 登录页首屏 JS（图标改按需之前） | 313KB     | 256KB     | −57KB −18% |
| 登录页首屏 JS（图标改按需之后） | 256KB     | 270KB     | +14KB      |
| 登录页 LCP                      | 268ms     | 240ms     | −28ms      |
| 登录页 CSS + 字体               | 21 + 31KB | 21 + 31KB | 持平       |

chunk 划分规则（`vite.config.ts`）：`echarts` / `motion` / `react` / `radix` 四个大包各成一块，
业务代码交给 Rollup 按动态 import 自然拆分。不要按「组件」去拆 Radix——各包共享 `@radix-ui/react-primitive`
等底层模块，跨 chunk 会出现运行时 `Cannot access 'x' before initialization`。

另外 `preload-helper`（Vite 的动态 import 预加载辅助函数）必须单独成块：它不在 `node_modules` 下，
容易被顺手归进别的组，一旦和 `DynamicIcon` 同组，**入口 chunk 就会反向静态依赖**那张 1866 条的
名字表，登录页首屏多下载 21KB。

`lucide-react` 比较特殊，**不能让整个包落进 `icons` 分组**：图标通过 `lucide-react/dynamic` 按需
`import()`，一旦 `dist/esm/icons/*.js` 被 `manualChunks` 指定进同一组，Rollup 就无法为其单独出 chunk，
1866 个图标会全被打进一个 764KB 的 `icons` chunk，按需加载彻底失效。现在的做法是 `icons` 只收 lucide
核心运行时，图标模块按**名字前 3 个字符**分组（`icon-sh*`、`icon-us*`……，共 441 组，单组 1–3KB）。
实测后台首屏图标下载 147KB、登录页 95KB；逐图标分块虽然粒度最细，但 1800 多个 chunk 会让构建 OOM。

## 分层与拆分原则

依赖方向单向向上，禁止反向 import（`pages/*` 之间互不引用，`hooks/` 不引用 `components|pages`）：

```
pages/*        → 页面（组合 + 页面私有状态）
components/*   → 可复用视图（layout 外壳、theme 面板、charts、shadcn）
hooks/*        → 跨页面 Hook        lib/*  → 纯函数 / 副作用适配（无 React）
api/*          → 类型 + 请求函数    config/* → 纯数据     store/* → zustand
```

何时拆文件（满足其一即可拆）：

- 文件有 **两个以上变更理由**（例如「菜单数据结构」与「树遍历/缓存」）；
- 组件超 ~150 行且 JSX 里有可独立命名的区块（筛选条 / 表格 / 分页）；
- 同一段 JSX 在 **≥2 处**出现（`menu-item`、`detail-row`、`login/shared`）；
- 一块逻辑需要被别处测试或复用（页面级 `use-user-list-sync`、`chart-options`）。

何时**不**拆（避免「一个文件一个函数」的伪模块化）：

- 单次使用、<40 行、命名即职责的组件：`dashboard/modules/stat-card|quick-links|recent-orders`、
  `layout/icon-btn|collapse-handle` 保持就近，不进全局 `components/`；
- 只有一行的工具（`lib/utils.ts` 的 `cn`）、10 行的 `useQuery` 包装（`use-dashboard` 等）不再包一层；
- 不为「目录对称」而拆：`pages/components`、`pages/profile` 只有 `index.tsx`，就不建 `components/` 子目录。

命名约定：全局可复用 → `components/`；页面私有 → `pages/<page>/modules/`；
纯数据 → `config/`；纯函数/无 React 的适配 → `lib/`；只有 zustand 才放 `store/`。

## 二次开发提示

- **新增页面**：在 `src/pages/<path>/index.tsx` 建页面（`<path>` 可含层级），
  并在对应业务域的 `src/router/modules/<business>.tsx` 注册静态路由；若页面需要显示在导航中，
  再到 `fake/fixtures/menus.ts` 与 `src/components/layout/menu/menu-config.ts` 添加菜单项，并在
  `i18n/locales/*.json` 补齐 `menu.*` 文案。菜单负责导航展示，路由由模块显式声明。
- **新增接口**：在 `src/api/<business>/index.d.ts` 定义该业务的请求 / 响应类型，
  在同目录 `index.ts` 实现无状态请求函数；通用类型放 `src/types/*.d.ts`。
  需要缓存/状态时，在 `src/hooks/` 新建 `use-xxx.ts` 包一层 `useQuery`，
  并在 `fake/*.fake.ts` 中添加路由，fixture 数据放入 `fake/fixtures/`。
- **Hook 约定**：跨页面共享的 `useXXX` 放 `src/hooks/`；页面私有 Hook 就近放在
  `pages/<page>/modules/`，文件名用 `use-kebab-case.ts`、导出命名函数。异步数据/路由组合并同步到 UI 的 Hook 以 `Sync` 结尾；
  React 状态变量及自定义 Hook 暴露的状态字段以 `State` 结尾，setter 使用 `setX`，业务/API 字段保持原名。
  `src/api/<business>/` 只放该业务的类型声明与无状态请求函数，不写 React 逻辑。
- **新增主题变量**：在 `src/config/theme.ts` 扩展 `ThemeConfig` 与 `DEFAULT_THEME`，然后在
  `src/lib/theme/theme-runtime.ts` 的 `applyTheme` 里用 `root.style.setProperty("--xxx", ...)` 写入；
  再到 `src/index.css` 的 `@theme inline` 中登记即可用 `bg-* / text-*` 工具类。
- **明暗模式**：store 里只有 `mode`（light/dark/auto），实际生效的明暗由
  `useResolvedMode()`（`useSyncExternalStore` 订阅 `prefers-color-scheme`）派生，
  需要具体色值的图表用它，纯样式场景交给 CSS 变量。
- **接口约定**：所有请求走 `src/lib/http.ts`，基于 **ky 2.x** 封装：
  `prefix` 统一拼 `VITE_API_BASE`、`beforeRequest` 注入 `Authorization: Bearer <token>`、
  `beforeError` 把 ky 的 `HTTPError` 归一成 `ApiError`（带 `status`）并在 401 时清空登录态。
  重试关闭（`retry: 0`），重试策略交给 TanStack Query，避免两层重试叠加。
  对外只暴露 `get` / `post` / `put` / `del`，以及需要拦截器时的 `api` 实例。
  登录为 `POST /api/auth/login`，返回 `{ token, user }` 由 auth store 持久化；注册为 `POST /api/auth/register`，接收 `{ username, email, password }`。`VITE_MOCK=false` 时由后端（ddd-springboot）实现，经 Vite 代理 / 网关访问，失败返回 401/400/409 + `{ message }`；`VITE_MOCK=true` 时由 `fake/mock` 模拟同一契约，业务失败通过 `{ __fakeApiError: { status, message } }` 由请求层统一转成 `ApiError`。
- **主题色混色**：与中性色做 `color-mix` 时统一用 `in oklab`，避免 `oklch` 色相插值导致的偏色。

## 技术栈版本

React 19.2 · Vite 7 · TypeScript 5.9 · Tailwind CSS 4 · shadcn/ui (Radix UI) ·
react-router 7 · zustand 5 · ky 2 · TanStack Query 5 · ECharts 6 · motion 12 · i18next 26
