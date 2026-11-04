import type { RouteObject } from 'react-router'
import type { RouteEntry, RouteModuleDefinition } from '../types'

interface RouteModuleExports {
  routeModule: RouteModuleDefinition
}

/** Route definitions are discovered at build time; page components remain lazy. */
export const routeModules = Object.entries(
  import.meta.glob<RouteModuleExports>(['./*.tsx', '!./auth.tsx'], {
    eager: true,
  }),
)
  .map(([file, module]) => ({ file, ...module.routeModule }))
  .sort(
    (left, right) =>
      left.order - right.order || left.file.localeCompare(right.file),
  )

export function mergeRouteModules(...modules: RouteObject[][]): RouteObject[] {
  const paths = new Set<string>()
  const routes = modules.flat()

  for (const route of routes) {
    if (!route.path) continue
    if (paths.has(route.path)) {
      throw new Error(`Duplicate route path: ${route.path}`)
    }
    paths.add(route.path)
  }

  return routes
}

export const routeEntries: RouteEntry[] = routeModules
  .filter((module) => module.kind === 'business')
  .flatMap((module) => module.routes)
  .flatMap((route) => {
    // handle 上写的是 RouteEntry 去掉 path 的那部分，路径由 route.path 规范化后补上
    const metadata = route.handle as Omit<RouteEntry, 'path'> | undefined
    if (!route.path || !metadata?.title) return []

    return [{ ...metadata, path: `/${route.path.replace(/^\/+/, '')}` }]
  })

export function findRouteEntry(pathname: string): RouteEntry | undefined {
  const path = pathname.replace(/\/+$/, '') || '/'
  return routeEntries.find((entry) => entry.path === path)
}
