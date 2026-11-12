import { del, get, post, put } from '@/lib/http'
import type { PageResult } from '@/types'
import type { Order, OrderInput } from './types'

/** 分页查询订单；keyword 由后端按可查询字段模糊匹配 */
export function fetchOrderPage(params: {
  page: number
  size: number
  keyword?: string
}) {
  return get<PageResult<Order>>('/order', params)
}

/** 按 ID 查询订单详情 */
export function fetchOrder(id: string) {
  return get<Order>(`/order/${id}`)
}

/** 创建订单 */
export function createOrder(input: OrderInput) {
  return post<Order>('/order', input)
}

/** 更新订单 */
export function updateOrder(id: string, input: OrderInput) {
  return put<Order>(`/order/${id}`, input)
}

/** 删除订单 */
export function deleteOrder(id: string) {
  return del<void>(`/order/${id}`)
}
