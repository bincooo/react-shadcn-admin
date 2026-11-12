import type { Menu } from '@/api/system/menu'

/**
 * 菜单种子：同时服务于侧边导航（/api/menus）与管理表格（/api/menus/tree）。
 * menuName 直接使用前端 i18n 词条 key；叶子 children 为空数组，由接口原样返回。
 * id 为代理主键，parentMenuId 表达树形关系；menuCode 是唯一业务键与权限点。
 */

function button(
  id: string,
  menuCode: string,
  menuName: string,
  parentMenuId: string,
  seq: number,
): Menu {
  return {
    id,
    menuCode,
    parentMenuId,
    menuName,
    menuType: 'BUTTON',
    seq,
    status: 'ENABLED',
    createdAt: '2024-01-06T08:00:00.000Z',
    createdBy: 'admin',
    children: [],
  }
}

function leaf(
  id: string,
  menuCode: string,
  menuName: string,
  menuUrl: string,
  imageIcon: string,
  seq: number,
  parentMenuId?: string,
  createdAt = '2024-01-02T08:00:00.000Z',
): Menu {
  return {
    id,
    menuCode,
    parentMenuId,
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

const userMenu: Menu = {
  id: '7',
  menuCode: 'system:user',
  parentMenuId: '6',
  menuName: 'menu.user',
  menuType: 'MENU',
  menuUrl: '/system/users',
  imageIcon: 'Users',
  seq: 1,
  status: 'ENABLED',
  createdAt: '2024-01-02T08:00:00.000Z',
  createdBy: 'admin',
  children: [
    button('8', 'system:user:create', 'menu.userCreate', '7', 1),
    button('9', 'system:user:update', 'menu.userUpdate', '7', 2),
    button('10', 'system:user:delete', 'menu.userDelete', '7', 3),
    button(
      '11',
      'system:user:reset-password',
      'menu.userResetPassword',
      '7',
      4,
    ),
  ],
}

const roleMenu: Menu = {
  id: '12',
  menuCode: 'system:role',
  parentMenuId: '6',
  menuName: 'menu.role',
  menuType: 'MENU',
  menuUrl: '/system/roles',
  imageIcon: 'ShieldUser',
  seq: 2,
  status: 'ENABLED',
  createdAt: '2024-01-02T08:00:00.000Z',
  createdBy: 'admin',
  children: [
    button('13', 'system:role:create', 'menu.roleCreate', '12', 1),
    button('14', 'system:role:update', 'menu.roleUpdate', '12', 2),
    button('15', 'system:role:delete', 'menu.roleDelete', '12', 3),
    button('16', 'system:role:assign-user', 'menu.roleAssignUser', '12', 4),
  ],
}

const deptMenu: Menu = {
  id: '17',
  menuCode: 'system:dept',
  parentMenuId: '6',
  menuName: 'menu.dept',
  menuType: 'MENU',
  menuUrl: '/system/depts',
  imageIcon: 'Building2',
  seq: 3,
  status: 'ENABLED',
  createdAt: '2024-01-02T08:00:00.000Z',
  createdBy: 'admin',
  children: [
    button('18', 'system:dept:create', 'menu.deptCreate', '17', 1),
    button('19', 'system:dept:update', 'menu.deptUpdate', '17', 2),
    button('20', 'system:dept:delete', 'menu.deptDelete', '17', 3),
  ],
}

const menuMenu: Menu = {
  id: '21',
  menuCode: 'system:menu',
  parentMenuId: '6',
  menuName: 'menu.menus',
  menuType: 'MENU',
  menuUrl: '/system/menus',
  imageIcon: 'Menu',
  seq: 4,
  status: 'ENABLED',
  createdAt: '2024-01-02T08:00:00.000Z',
  createdBy: 'admin',
  children: [
    button('22', 'system:menu:create', 'menu.menuCreate', '21', 1),
    button('23', 'system:menu:update', 'menu.menuUpdate', '21', 2),
    button('24', 'system:menu:delete', 'menu.menuDelete', '21', 3),
  ],
}

export const menuSeeds: Menu[] = [
  {
    id: '1',
    menuCode: 'dashboard',
    menuName: 'menu.dashboard',
    menuType: 'DIRECTORY',
    imageIcon: 'LayoutDashboard',
    seq: 1,
    status: 'ENABLED',
    createdAt: '2024-01-01T08:00:00.000Z',
    createdBy: 'admin',
    children: [
      leaf(
        '2',
        'dashboard-index',
        'menu.workspace',
        '/dashboard',
        'SquareKanban',
        1,
        '1',
      ),
    ],
  },
  leaf('4', 'components', 'menu.components', '/components', 'ToggleLeft', 2),
  leaf('5', 'profile', 'menu.profile', '/profile', 'User', 3),
  {
    id: '6',
    menuCode: 'system',
    menuName: 'menu.system',
    menuType: 'DIRECTORY',
    imageIcon: 'Shield',
    seq: 4,
    status: 'ENABLED',
    createdAt: '2024-01-01T08:00:00.000Z',
    createdBy: 'admin',
    children: [userMenu, roleMenu, deptMenu, menuMenu],
  },
]

/** 递归展开菜单树（含按钮节点） */
function flattenMenus(nodes: Menu[]): Menu[] {
  return nodes.flatMap((node) => [node, ...flattenMenus(node.children ?? [])])
}

/** 全部按钮权限编码：管理员默认拥有，其他角色按需分配 */
export const buttonPermissionCodes = flattenMenus(menuSeeds)
  .filter((node) => node.menuType === 'BUTTON')
  .map((node) => node.menuCode)
