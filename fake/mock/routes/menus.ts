import type { SystemMenu, SystemMenuInput } from '@/api/system/menu'
import type { FakeRouteConfig } from 'vite-plugin-fake-server/client'
import {
  detachMenu,
  findMenu,
  insertMenu,
  menuTree,
  mockError,
  mockState,
  navMenus,
  queryString,
  removeMenu,
} from '../../mock-state'

/** 节点及其子树的菜单编码 */
function subtreeCodes(node: SystemMenu): string[] {
  return [node.menuCode, ...(node.children ?? []).flatMap(subtreeCodes)]
}

/** 从所有角色的菜单授权中移除指定编码 */
function revokeMenuCodes(codes: string[]) {
  const removed = new Set(codes)
  for (const [roleCode, menuCodes] of Object.entries(mockState.roleMenus)) {
    mockState.roleMenus[roleCode] = menuCodes.filter(
      (code) => !removed.has(code),
    )
  }
}

function toMenuNode(input: SystemMenuInput, existing?: SystemMenu): SystemMenu {
  return {
    menuCode: input.menuCode,
    parentMenuCode: input.parentMenuCode ?? existing?.parentMenuCode ?? '',
    menuName: input.menuName,
    menuType: input.menuType,
    menuUrl: input.menuUrl ?? null,
    imageIcon: input.imageIcon ?? null,
    seq: input.seq,
    status: input.status ?? existing?.status ?? 'ENABLED',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    createdBy: existing?.createdBy ?? 'admin',
    children: existing?.children ?? [],
  }
}

const routes = [
  {
    url: '/api/menus',
    method: 'GET',
    response: () => ({ menus: navMenus() }),
  },
  {
    url: '/api/menus/tree',
    method: 'GET',
    response: () => menuTree(),
  },
  {
    url: '/api/menus',
    method: 'POST',
    response: ({ body }) => {
      const input = body as unknown as SystemMenuInput
      if (!input.menuCode || !input.menuName) {
        return mockError(400, '菜单编码与名称不能为空')
      }
      if (findMenu(input.menuCode)) {
        return mockError(409, '菜单编码已存在')
      }

      const node = toMenuNode(input)
      insertMenu(node)
      return node
    },
  },
  {
    url: '/api/menus/:menuCode',
    method: 'PUT',
    response: ({ params, body }) => {
      const menuCode = queryString(params.menuCode)
      const found = findMenu(menuCode)
      if (!found) return mockError(404, '菜单不存在')

      const input = body as unknown as SystemMenuInput
      const parentChanged =
        input.parentMenuCode !== undefined &&
        input.parentMenuCode !== found.node.parentMenuCode

      if (parentChanged) detachMenu(menuCode)
      const node = toMenuNode(input, found.node)
      node.menuCode = menuCode
      if (parentChanged) {
        insertMenu(node)
      } else {
        Object.assign(found.node, node)
      }
      return node
    },
  },
  {
    url: '/api/menus/:menuCode',
    method: 'DELETE',
    response: ({ params, query }) => {
      const menuCode = queryString(params.menuCode)
      const found = findMenu(menuCode)
      if (!found) return mockError(404, '菜单不存在')

      const cascade = queryString(query.cascade) === 'true'
      if (!removeMenu(menuCode, cascade)) {
        return mockError(409, '菜单仍有子项，请先删除子菜单或使用级联删除')
      }
      revokeMenuCodes(subtreeCodes(found.node))
      return { success: true }
    },
  },
] satisfies FakeRouteConfig

export default routes
