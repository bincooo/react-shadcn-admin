import type { Menu, MenuInput } from '@/api/system/menu'
import type { FakeRouteConfig } from 'vite-plugin-fake-server/client'
import {
  detachMenu,
  findMenu,
  findMenuById,
  insertMenu,
  menuTree,
  mockError,
  mockState,
  navMenus,
  nextSnowflakeId,
  queryString,
  removeMenu,
} from '../../mock-state'

/** 节点及其子树的菜单编码 */
function subtreeCodes(node: Menu): string[] {
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

function withMenuNode(input: MenuInput, existing?: Menu): Menu {
  return {
    id: existing?.id ?? nextSnowflakeId(),
    menuCode: input.menuCode,
    parentMenuId: input.parentMenuId ?? undefined,
    menuName: input.menuName,
    menuType: input.menuType,
    menuUrl: input.menuUrl ?? undefined,
    imageIcon: input.imageIcon ?? undefined,
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
      const input = body as unknown as MenuInput
      if (!input.menuCode || !input.menuName) {
        return mockError(400, '菜单编码与名称不能为空')
      }
      if (findMenu(input.menuCode)) {
        return mockError(409, '菜单编码已存在')
      }

      if (input.parentMenuId && !findMenuById(input.parentMenuId)) {
        return mockError(404, '父级菜单不存在')
      }
      const node = withMenuNode(input)
      insertMenu(node)
      return node
    },
  },
  {
    url: '/api/menus/:id',
    method: 'PUT',
    response: ({ params, body }) => {
      const id = queryString(params.id)
      const found = findMenuById(id)
      if (!found) return mockError(404, '菜单不存在')

      const input = body as unknown as MenuInput
      const parentChanged =
        input.parentMenuId !== undefined &&
        input.parentMenuId !== found.node.parentMenuId
      if (input.parentMenuId && !findMenuById(input.parentMenuId)) {
        return mockError(404, '父级菜单不存在')
      }

      if (parentChanged) detachMenu(id)
      const node = withMenuNode(input, found.node)
      node.menuCode = found.node.menuCode
      if (parentChanged) {
        insertMenu(node)
      } else {
        Object.assign(found.node, node)
        found.siblings.sort((left, right) => left.seq - right.seq)
      }
      return node
    },
  },
  {
    url: '/api/menus',
    method: 'DELETE',
    response: ({ body }) => {
      const menuIds = Array.isArray(body.menuIds)
        ? body.menuIds.map((id: unknown) => String(id))
        : []
      const unique = [...new Set(menuIds)]
      if (unique.length === 0) return mockError(400, 'menuIds 不能为空')
      for (const id of unique) {
        if (!findMenuById(id)) return mockError(404, '菜单不存在')
      }

      const cascade = body.cascade === true
      if (!cascade) {
        for (const id of unique) {
          const found = findMenuById(id)
          if (found && (found.node.children?.length ?? 0) > 0) {
            return mockError(409, '菜单仍有子项，请先删除子菜单或使用级联删除')
          }
        }
      }

      const codes = new Set<string>()
      for (const id of unique) {
        const found = findMenuById(id)
        if (found) {
          for (const code of subtreeCodes(found.node)) {
            codes.add(code)
          }
        }
      }
      for (const id of unique) {
        if (findMenuById(id)) removeMenu(id, true)
      }
      revokeMenuCodes([...codes])
      return { success: true }
    },
  },
  {
    url: '/api/menus/:id',
    method: 'DELETE',
    response: ({ params, query }) => {
      const id = queryString(params.id)
      const found = findMenuById(id)
      if (!found) return mockError(404, '菜单不存在')

      const cascade = queryString(query.cascade) === 'true'
      if (!removeMenu(id, cascade)) {
        return mockError(409, '菜单仍有子项，请先删除子菜单或使用级联删除')
      }
      revokeMenuCodes(subtreeCodes(found.node))
      return { success: true }
    },
  },
] satisfies FakeRouteConfig

export default routes
