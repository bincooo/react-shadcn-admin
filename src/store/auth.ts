import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loginRequest, type LoginResult } from '@/api/auth'

/** 登录用户信息与接口返回保持一致 */
type UserProfile = LoginResult['user']

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
        const { token, user } = await loginRequest(username, password)
        set({ token, user })
      },

      logout: () => {
        set({ token: null, user: null })
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
