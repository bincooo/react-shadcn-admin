import { useQuery } from '@tanstack/react-query'
import { fetchPermissions } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

/**
 * 按钮权限判断：返回 `can(code)`，编码在已授权集合中时为 true。
 *
 * 权限编码与后端 `@PreAuthorize` 使用的 BUTTON 菜单编码一致；
 * 数据未就绪时按无权限处理（按钮默认隐藏），避免闪现越权入口。
 */
export function usePermission() {
  const token = useAuthStore((state) => state.token)
  const query = useQuery({
    queryKey: ['auth-permissions'],
    queryFn: fetchPermissions,
    enabled: Boolean(token),
    staleTime: 5_000,
  })
  return (permission: string) => query.data?.includes(permission)
}
