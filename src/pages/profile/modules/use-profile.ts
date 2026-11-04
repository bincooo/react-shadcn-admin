import { useQuery } from '@tanstack/react-query'
import { fetchProfile } from '@/api/profile'

/**
 * 当前登录用户档案：以服务端返回为准。
 * 登录态失效由 http 层统一处理（401 清空登录态并跳转登录页）。
 */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 30_000,
  })
}
