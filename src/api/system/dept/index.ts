import { del, get, post, put } from '@/lib/http'

/** 部门启用状态 */
export type SystemDeptStatus = 'ENABLED' | 'DISABLED'

/** 后端 DeptDTO：雪花 id 已序列化为字符串 */
export interface SystemDept {
  id: string
  parentId: string | null
  deptCode: string
  deptName: string
  sort: number
  status: SystemDeptStatus
  description: string | null
  createdAt: string
}

/** 部门树节点：比 SystemDept 多一层 children，节点信息完整以便表单回显 */
export interface SystemDeptTreeNode {
  id: string
  parentId: string | null
  deptCode: string
  deptName: string
  sort: number
  status: SystemDeptStatus
  description: string | null
  createdAt: string
  children: SystemDeptTreeNode[] | null
}

/** 创建部门表单输入（后端固定新建为启用） */
export interface SystemDeptCreateInput {
  parentId?: string | null
  deptCode: string
  deptName: string
  sort?: number
  description?: string
}

/** 编辑部门表单输入；status 省略表示不变更 */
export interface SystemDeptUpdateInput {
  deptName: string
  parentId?: string | null
  sort?: number
  description?: string
  status?: SystemDeptStatus
}

/** 查询部门树（按 sort 升序，children 为空时为 null） */
export function fetchSystemDeptTree() {
  return get<SystemDeptTreeNode[]>('/departments/tree')
}

/** 创建部门（deptCode 唯一，后端固定新建为启用） */
export function createSystemDept(input: SystemDeptCreateInput) {
  return post<SystemDept>('/departments', input)
}

/** 更新部门（名称、父部门、排序、描述、启用状态） */
export function updateSystemDept(id: string, input: SystemDeptUpdateInput) {
  return put<SystemDept>(`/departments/${encodeURIComponent(id)}`, input)
}

/** 删除部门；后端拒绝删除仍含子部门或在职用户的部门 */
export function deleteSystemDept(id: string) {
  return del<void>(`/departments/${encodeURIComponent(id)}`)
}
