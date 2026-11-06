import 'react-native-url-polyfill/auto'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState } from 'react-native'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && publishableKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, publishableKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null

export function bindSupabaseAutoRefresh(): () => void {
  if (!supabase) return () => undefined

  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh()
    } else {
      void supabase.auth.stopAutoRefresh()
    }
  })

  return () => subscription.remove()
}
