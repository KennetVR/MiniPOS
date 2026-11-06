import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { mobileApi } from '../lib/api'
import { bindSupabaseAutoRefresh, isSupabaseConfigured, supabase } from '../lib/supabase'
import type { UserSession } from '../lib/types'

interface AuthContextValue {
  user: UserSession | null
  loading: boolean
  configured: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    const result = await mobileApi.auth.current()
    if (result.success) setUser(result.data)
    else setError(result.error)
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true
    const stopAutoRefresh = bindSupabaseAutoRefresh()
    void mobileApi.auth.current().then((result) => {
      if (!mounted) return
      if (result.success) setUser(result.data)
      else setError(result.error)
      setLoading(false)
    })

    const authSubscription = supabase?.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (!session || event === 'SIGNED_OUT') {
        setUser(null)
        return
      }
      void mobileApi.auth.current().then((result) => {
        if (!mounted) return
        if (result.success) setUser(result.data)
        else setError(result.error)
      })
    }).data.subscription

    return () => {
      mounted = false
      authSubscription?.unsubscribe()
      stopAutoRefresh()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    configured: isSupabaseConfigured,
    error,
    signIn: async (email, password) => {
      setLoading(true)
      setError(null)
      const result = await mobileApi.auth.login(email, password)
      if (result.success) {
        setUser(result.data)
        setLoading(false)
        return true
      }
      setError(result.error)
      setLoading(false)
      return false
    },
    signOut: async () => {
      await mobileApi.auth.logout()
      setUser(null)
      setError(null)
    },
    refresh,
    clearError: () => setError(null)
  }), [error, loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return value
}
