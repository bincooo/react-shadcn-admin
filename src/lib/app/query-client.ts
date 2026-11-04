/**
 * 全局 QueryClient 实例。
 *
 * 同属「有状态的应用基建」：它是单例，被 `App` 注入到 QueryClientProvider。
 */
import { QueryClient } from '@tanstack/react-query'

/**
 * 全局 QueryClient：重试交给这里统一配置（http 层已关闭 ky 的重试），
 * 窗口聚焦不重取，30s 内视为新鲜数据。
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
