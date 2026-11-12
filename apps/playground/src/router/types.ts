import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'
import type { LucideProps } from 'lucide-react'

/** 路由图标：与菜单图标同源的 Lucide 组件类型 */
export type RouteIcon = ComponentType<LucideProps>

type RouteModuleKind = 'business' | 'system'

/**
 * 把一条路由的 `handle` 从 `any` 收窄成真实形状。
 *
 * react-router 把 `handle` 声明成 `any`，若直接用 `RouteObject[]`，各模块末尾的
 * `satisfies` 对 handle 内部字段完全失去约束 —— 漏写 `title` 或 `icon` 也不报错，
 * 只会在运行时静默降级（面包屑空、页签无标题）。
 *
 * 必须逐项分配联合类型：`RouteObject` 是「索引 / 非索引」的联合，直接 `Omit` 会
 * 把两个分支的 `index` 合并成 `boolean`，反而让合法的索引路由无法赋值。
 */
type StrictHandle<T> = T extends unknown
  ? Omit<T, 'handle'> & { handle?: Omit<RouteEntry, 'path'> }
  : never

/** 路由模块里一条路由的形状 */
export type RouteDefinition = StrictHandle<RouteObject>

/** 一个路由定义模块（`router/modules/*.tsx` 的 `routeModule` 导出）的形状 */
export interface RouteModuleDefinition {
  kind: RouteModuleKind
  order: number
  routes: RouteDefinition[]
}

/**
 * 路由的展示元数据 + 规范化后的绝对路径。
 *
 * 同时充当两个角色：
 * - `route.handle` 上写的部分（`Omit<RouteEntry, 'path'>`）——各路由模块自己声明；
 * - `routeEntries` 里供面包屑 / 页签 / 路由搜索消费的扁平条目——路径由
 *   `RouteObject.path` 规范化后补上，不在 handle 里重复写一遍。
 *
 * `title` 存的是 i18n 词条 key 而非译文：词条在渲染时由 `t()` 解析，
 * 这样切换语言不必重建路由表。字段名沿用项目里「菜单 / 路由标题」的既有叫法。
 */
export interface RouteEntry {
  title: string
  breadcrumb: string[]
  path: string
  icon?: RouteIcon
}
