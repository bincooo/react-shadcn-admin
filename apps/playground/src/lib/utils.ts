/**
 * 应用内统一的 className 合并入口。
 *
 * 实现与 `@repo/ui` 共用同一份 `cn`，避免应用与组件库各自维护一份
 * class 合并实现导致行为漂移。
 */
export { cn } from '@repo/ui/lib/utils'
