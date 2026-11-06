import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, UsuarioSession } from '../lib/api'

interface AuthState {
  user: UsuarioSession | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  verifySession: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ loading: true, error: null })
        try {
          const response = await api.auth.login(username, password)
          if (response.success && response.data) {
            set({ 
              user: response.data, 
              isAuthenticated: true, 
              loading: false 
            })
            return true
          } else {
            set({ error: response.error || 'Error de autenticación', loading: false })
            return false
          }
        } catch (error) {
          set({ error: String(error), loading: false })
          return false
        }
      },

      logout: async () => {
        try {
          await api.auth.logout()
        } finally {
        set({ user: null, isAuthenticated: false, error: null })
        }
      },

      verifySession: async () => {
        const { user } = get()
        if (!user) {
          set({ isAuthenticated: false })
          return
        }

        try {
          const response = await api.auth.verifySession(user.id_usuario)
          if (response.success && response.data) {
            set({ isAuthenticated: true, user: response.data })
          } else {
            set({ user: null, isAuthenticated: false })
          }
        } catch {
          set({ user: null, isAuthenticated: false })
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'minipos-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
)
