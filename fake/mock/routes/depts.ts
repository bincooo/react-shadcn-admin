import type {
  SystemDept,
  SystemDeptCreateInput,
  SystemDeptUpdateInput,
} from '@/api/system/dept'
import type { FakeRouteConfig } from 'vite-plugin-fake-server/client'
import {
  deptTree,
  mockError,
  mockState,
  nextSnowflakeId,
  queryString,
} from '../../mock-state'

function findDept(id: string): SystemDept | undefined {
  return mockState.depts.find((dept) => dept.id === id)
}

/** candidate 是否为 ancestor 的后代（含自身） */
function isSelfOrDescendant(candidateId: string, ancestorId: string): boolean {
  let current = findDept(candidateId)
  while (current) {
    if (current.id === ancestorId) return true
    if (!current.parentId) return false
    current = findDept(current.parentId)
  }
  return false
}

const routes = [
  {
    url: '/api/departments/tree',
    method: 'GET',
    response: () => deptTree(),
  },
  {
    url: '/api/departments',
    method: 'POST',
    response: ({ body }) => {
      const input = body as unknown as SystemDeptCreateInput
      const deptCode = input.deptCode?.trim() ?? ''
      const deptName = input.deptName?.trim() ?? ''
      if (!deptCode || !deptName) {
        return mockError(400, '部门编码与名称不能为空')
      }
      if (
        mockState.depts.some(
          (dept) =>
            dept.deptCode.toLocaleLowerCase() === deptCode.toLowerCase(),
        )
      ) {
        return mockError(409, '部门编码已存在')
      }
      if (input.parentId && !findDept(input.parentId)) {
        return mockError(400, '上级部门不存在')
      }

      const dept: SystemDept = {
        id: nextSnowflakeId(),
        parentId: input.parentId ?? null,
        deptCode,
        deptName,
        sort: input.sort ?? 0,
        status: 'ENABLED',
        description: input.description?.trim() || null,
        createdAt: new Date().toISOString(),
      }
      mockState.depts.push(dept)
      return dept
    },
  },
  {
    url: '/api/departments/:id',
    method: 'PUT',
    response: ({ params, body }) => {
      const id = queryString(params.id)
      const dept = findDept(id)
      if (!dept) return mockError(404, '部门不存在')

      const input = body as unknown as SystemDeptUpdateInput
      const parentId = input.parentId ?? null
      if (parentId && isSelfOrDescendant(parentId, id)) {
        return mockError(400, '上级部门不能是自身或其子部门')
      }
      if (parentId && !findDept(parentId)) {
        return mockError(400, '上级部门不存在')
      }
      if (input.deptName !== undefined) {
        dept.deptName = input.deptName.trim() || dept.deptName
      }
      dept.parentId = parentId
      if (input.sort !== undefined) dept.sort = input.sort
      if (input.description !== undefined) {
        dept.description = input.description.trim() || null
      }
      if (input.status) dept.status = input.status
      return dept
    },
  },
  {
    url: '/api/departments/:id',
    method: 'DELETE',
    response: ({ params }) => {
      const id = queryString(params.id)
      if (!findDept(id)) return mockError(404, '部门不存在')
      if (mockState.depts.some((dept) => dept.parentId === id)) {
        return mockError(409, '请先删除子部门')
      }
      if (mockState.users.some((user) => user.deptId === id)) {
        return mockError(409, '部门下仍有用户，无法删除')
      }

      mockState.depts = mockState.depts.filter((dept) => dept.id !== id)
      return { success: true }
    },
  },
] satisfies FakeRouteConfig

export default routes
