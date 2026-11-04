import type { SystemMenu } from '@/api/system/menu'

/**
 * 菜单种子：同时服务于侧边导航（/api/menus）与管理表格（/api/menus/tree）。
 * menuName 直接使用前端 i18n 词条 key；叶子 children 为空数组，由接口原样返回。
 */

function button(
  menuCode: string,
  menuName: string,
  parentMenuCode: string,
  seq: number,
): SystemMenu {
  return {
    menuCode,
    parentMenuCode,
    menuName,
    menuType: 'BUTTON',
    menuUrl: null,
    imageIcon: null,
    seq,
    status: 'ENABLED',
    createdAt: '2024-01-06T08:00:00.000Z',
    createdBy: 'admin',
    children: [],
  }
}

function leaf(
  menuCode: string,
  menuName: string,
  menuUrl: string,
  imageIcon: string,
  seq: number,
  createdAt = '2024-01-02T08:00:00.000Z',
): SystemMenu {
  return {
    menuCode,
    parentMenuCode: '',
    menuName,
    menuType: 'MENU',
    menuUrl,
    imageIcon,
    seq,
    status: 'ENABLED',
    createdAt,
    createdBy: 'admin',
    children: [],
  }
}

const userMenu: SystemMenu = {
  menuCode: 'system:user',
  parentMenuCode: 'system',
  menuName: 'menu.user',
  menuType: 'MENU',
  menuUrl: '/system/users',
  imageIcon: 'Users',
  seq: 1,
  status: 'ENABLED',
  createdAt: '2024-01-02T08:00:00.000Z',
  createdBy: 'admin',
  children: [
    button('system:user:create', 'menu.userCreate', 'system:user', 1),
    button('system:user:update', 'menu.userUpdate', 'system:user', 2),
    button('system:user:delete', 'menu.userDelete', 'system:user', 3),
    button(
      'system:user:reset-password',
      'menu.userResetPassword',
      'system:user',
      4,
    ),
  ],
}

const roleMenu: SystemMenu = {
  menuCode: 'system:role',
  parentMenuCode: 'system',
  menuName: 'menu.role',
  menuType: 'MENU',
  menuUrl: '/system/roles',
  imageIcon: 'ShieldUser',
  seq: 2,
  status: 'ENABLED',
  createdAt: '2024-01-02T08:00:00.000Z',
  createdBy: 'admin',
  children: [
    button('system:role:create', 'menu.roleCreate', 'system:role', 1),
    button('system:role:update', 'menu.roleUpdate', 'system:role', 2),
    button('system:role:delete', 'menu.roleDelete', 'system:role', 3),
    button('system:role:assign-user', 'menu.roleAssignUser', 'system:role', 4),
  ],
}

const deptMenu: SystemMenu = {
  menuCode: 'system:dept',
  parentMenuCode: 'system',
  menuName: 'menu.dept',
  menuType: 'MENU',
  menuUrl: '/system/depts',
  imageIcon: 'Building2',
  seq: 3,
  status: 'ENABLED',
  createdAt: '2024-01-02T08:00:00.000Z',
  createdBy: 'admin',
  children: [
    button('system:dept:create', 'menu.deptCreate', 'system:dept', 1),
    button('system:dept:update', 'menu.deptUpdate', 'system:dept', 2),
    button('system:dept:delete', 'menu.deptDelete', 'system:dept', 3),
  ],
}

const menuMenu: SystemMenu = {
  menuCode: 'system:menu',
  parentMenuCode: 'system',
  menuName: 'menu.menus',
  menuType: 'MENU',
  menuUrl: '/system/menus',
  imageIcon: 'Menu',
  seq: 4,
  status: 'ENABLED',
  createdAt: '2024-01-02T08:00:00.000Z',
  createdBy: 'admin',
  children: [
    button('system:menu:create', 'menu.menuCreate', 'system:menu', 1),
    button('system:menu:update', 'menu.menuUpdate', 'system:menu', 2),
    button('system:menu:delete', 'menu.menuDelete', 'system:menu', 3),
  ],
}

export const menuSeeds: SystemMenu[] = [
  {
    menuCode: 'dashboard',
    parentMenuCode: '',
    menuName: 'menu.dashboard',
    menuType: 'DIRECTORY',
    menuUrl: null,
    imageIcon: 'LayoutDashboard',
    seq: 1,
    status: 'ENABLED',
    createdAt: '2024-01-01T08:00:00.000Z',
    createdBy: 'admin',
    children: [
      {
        ...leaf(
          'dashboard-index',
          'menu.workspace',
          '/dashboard',
          'SquareKanban',
          1,
        ),
        parentMenuCode: 'dashboard',
      },
      {
        ...leaf(
          'dashboard-monitor',
          'menu.monitor',
          '/dashboard/monitor',
          'Activity',
          2,
        ),
        parentMenuCode: 'dashboard',
      },
    ],
  },
  leaf('components', 'menu.components', '/components', 'ToggleLeft', 2),
  leaf('profile', 'menu.profile', '/profile', 'User', 3),
  {
    menuCode: 'system',
    parentMenuCode: '',
    menuName: 'menu.system',
    menuType: 'DIRECTORY',
    menuUrl: null,
    imageIcon: 'Shield',
    seq: 4,
    status: 'ENABLED',
    createdAt: '2024-01-01T08:00:00.000Z',
    createdBy: 'admin',
    children: [userMenu, roleMenu, deptMenu, menuMenu],
  },
]

/** 递归展开菜单树（含按钮节点） */
function flattenMenus(nodes: SystemMenu[]): SystemMenu[] {
  return nodes.flatMap((node) => [node, ...flattenMenus(node.children ?? [])])
}

/** 全部按钮权限编码：管理员默认拥有，其他角色按需分配 */
export const buttonPermissionCodes = flattenMenus(menuSeeds)
  .filter((node) => node.menuType === 'BUTTON')
  .map((node) => node.menuCode)
