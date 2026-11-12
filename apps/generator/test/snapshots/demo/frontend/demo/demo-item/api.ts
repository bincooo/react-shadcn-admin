import { del, get, post, put } from '@/lib/http'
import type { PageResult } from '@/types'
import type { DemoItem, DemoItemInput } from './types'

/** 分页查询演示明细；keyword 由后端按可查询字段模糊匹配 */
export function fetchDemoItemPage(params: {
  page: number
  size: number
  keyword?: string
}) {
  return get<PageResult<DemoItem>>('/demoitem', params)
}

/** 按 ID 查询演示明细详情 */
export function fetchDemoItem(id: string) {
  return get<DemoItem>(`/demoitem/${id}`)
}

/** 创建演示明细 */
export function createDemoItem(input: DemoItemInput) {
  return post<DemoItem>('/demoitem', input)
}

/** 更新演示明细 */
export function updateDemoItem(id: string, input: DemoItemInput) {
  return put<DemoItem>(`/demoitem/${id}`, input)
}

/** 删除演示明细 */
export function deleteDemoItem(id: string) {
  return del<void>(`/demoitem/${id}`)
}
