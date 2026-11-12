import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '@/lib/query-client'
import { loginRequest, type LoginResult } from '@/api/auth'
import { useAppStore } from '@/store/app'

/** 登录用户信息与接口返回保持一致 */
type UserProfile = LoginResult['user']

// 每次登录或注销使此前尚未完成的登录请求失效，避免旧响应恢复或覆盖会话。
let sessionRevision = 0

interface AuthState {
  token: string | null
  user: UserProfile | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (patch: Partial<UserProfile>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      // 账号校验与 token 签发都在接口侧（mock: POST /api/auth/login）
      login: async (username, password) => {
        const revision = ++sessionRevision
        let result: LoginResult
        try {
          result = await loginRequest(username, password)
        } catch (error) {
          if (revision !== sessionRevision) {
            throw new DOMException('Login superseded', 'AbortError')
          }
          throw error
        }
        if (revision !== sessionRevision) {
          throw new DOMException('Login superseded', 'AbortError')
        }
        const { token, user } = result
        // 登录身份变化时不能复用上一个会话的菜单、权限或页面数据。
        queryClient.clear()
        useAppStore.getState().closeAll()
        set({ token, user })
      },

      logout: () => {
        sessionRevision += 1
        set({ token: null, user: null })
        queryClient.clear()
        useAppStore.getState().closeAll()
      },

      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        })),
    }),
    {
      name: 'react-admin-auth',
      partialize: ({ token, user }) => ({ token, user }),
    },
  ),
)
