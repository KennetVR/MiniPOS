import { useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Card, EmptyState, Header, Loading, Notice, Screen, colors, styles } from '../components/ui'
import { mobileApi } from '../lib/api'
import type { UserProfile } from '../lib/types'
import { useAuth } from '../state/AuthContext'

export function UsersScreen() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await mobileApi.users.list()
    if (result.success) setUsers(result.data)
    else setError(result.error)
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => {
    if (user?.rol === 'administrador') void load()
    else setLoading(false)
  }, [load, user?.rol]))

  if (user?.rol !== 'administrador') return <Screen><Notice>Solo un administrador puede consultar y administrar perfiles.</Notice></Screen>
  if (loading) return <Loading />

  const toggle = async (profile: UserProfile) => {
    const result = await mobileApi.users.toggleState(profile)
    if (result.success) void load()
    else setError(result.error)
  }

  return (
    <Screen>
      <Header title="Usuarios" subtitle="Las cuentas se crean mediante invitación de Supabase Auth" />
      {error ? <Notice>{error}</Notice> : null}
      {users.length === 0 ? <EmptyState label="No hay perfiles disponibles" /> : users.map((profile) => <Card key={profile.id_usuario}><View style={styles.rowBetween}><View style={styles.productCopy}><Text style={styles.strong}>{profile.nombre || profile.username}</Text><Text style={styles.smallText}>{profile.username || 'Sin usuario'} · {profile.rol}</Text></View><Pressable accessibilityRole="button" onPress={() => void toggle(profile)}><Text style={[styles.statusLink, { color: profile.estado ? colors.success : colors.danger }]}>{profile.estado ? 'Activo' : 'Inactivo'}</Text></Pressable></View></Card>)}
    </Screen>
  )
}
