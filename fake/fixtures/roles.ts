import type { SystemMenu } from '@/api/system/menu'
import type { SystemRole, SystemRoleDataScopeConfig } from '@/api/system/role'
import { buttonPermissionCodes, menuSeeds } from './menus'

/** 递归展开菜单树（含按钮节点） */
function flatten(nodes: SystemMenu[]): SystemMenu[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])])
}

const allMenuCodes = flatten(menuSeeds).map((node) => node.menuCode)
const navMenuCodes = flatten(menuSeeds)
  .filter((node) => node.menuType !== 'BUTTON')
  .map((node) => node.menuCode)
const dashboardCodes = ['dashboard', 'dashboard-index', 'dashboard-monitor']

export const roleSeeds: SystemRole[] = [
  {
    roleCode: 'admin',
    roleName: '系统管理员',
    description: '拥有系统全部菜单与按钮权限',
    status: 'ENABLED',
    createdAt: '2024-01-01T08:00:00.000Z',
  },
  {
    roleCode: 'common',
    roleName: '普通用户',
    description: '可访问全部页面，但不能执行管理操作',
    status: 'ENABLED',
    createdAt: '2024-01-01T08:00:00.000Z',
  },
  {
    roleCode: 'ops',
    roleName: '运维人员',
    description: '负责组织与部门维护',
    status: 'ENABLED',
    createdAt: '2024-02-18T08:00:00.000Z',
  },
  {
    roleCode: 'guest',
    roleName: '访客',
    description: '仅可查看工作台与监控大盘',
    status: 'DISABLED',
    createdAt: '2024-03-11T08:00:00.000Z',
  },
]

/** 角色 → 已授权菜单编码（含目录 / 页面 / 按钮） */
export const roleMenuSeeds: Record<string, string[]> = {
  admin: allMenuCodes,
  common: navMenuCodes,
  ops: [
    ...navMenuCodes,
    'system:dept:create',
    'system:dept:update',
    'system:dept:delete',
  ],
  guest: dashboardCodes,
}

/** 角色 → 数据权限配置 */
export const roleDataScopeSeeds: Record<string, SystemRoleDataScopeConfig> = {
  admin: { roleCode: 'admin', dataScope: 'ALL', departmentIds: [] },
  common: {
    roleCode: 'common',
    dataScope: 'DEPT_AND_CHILD',
    departmentIds: [],
  },
  ops: { roleCode: 'ops', dataScope: 'DEPT', departmentIds: [] },
  guest: {
    roleCode: 'guest',
    dataScope: 'CUSTOM',
    departmentIds: ['111', '121'],
  },
}

/** 管理员默认拥有的按钮权限 */
export const adminPermissionCodes = buttonPermissionCodes
