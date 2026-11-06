import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Button, Card, Field, Header, Loading, Notice, Screen, styles } from '../components/ui'
import { mobileApi } from '../lib/api'
import type { AppSetting } from '../lib/types'
import { useAuth } from '../state/AuthContext'

export function SettingsScreen() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<AppSetting[]>([])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await mobileApi.settings.list()
    if (result.success) setSettings(result.data)
    else setError(result.error)
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => {
    void load()
  }, [load]))

  const updateSetting = async (setting: AppSetting) => {
    const result = await mobileApi.settings.update(setting)
    if (result.success) setMessage(`${setting.clave} actualizado`)
    else setError(result.error)
  }

  const changePassword = async () => {
    setError(null)
    setMessage(null)
    if (!currentPassword || newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    const result = await mobileApi.auth.changePassword(currentPassword, newPassword)
    if (result.success) {
      setCurrentPassword('')
      setNewPassword('')
      setMessage('Contraseña actualizada')
    } else setError(result.error)
  }

  if (loading) return <Loading />

  return (
    <Screen>
      <Header title="Configuración" subtitle="Preferencias y seguridad de tu cuenta" />
      {error ? <Notice>{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}
      <Card>
        <Text style={styles.strong}>Preferencias</Text>
        {user?.rol !== 'administrador' ? <Notice tone="warning">Solo un administrador puede actualizar las preferencias globales.</Notice> : null}
        {settings.length === 0 ? <Text style={styles.smallText}>No hay preferencias configuradas.</Text> : settings.map((setting, index) => <View key={setting.clave} style={index > 0 ? styles.settingRow : undefined}><Field label={setting.descripcion || setting.clave} onChangeText={(value) => setSettings((current) => current.map((item) => item.clave === setting.clave ? { ...item, valor: value } : item))} value={setting.valor} /><Button disabled={user?.rol !== 'administrador'} label="Guardar" onPress={() => void updateSetting(setting)} variant="secondary" /></View>)}
      </Card>
      <Card>
        <Text style={styles.strong}>Cambiar contraseña</Text>
        <Field label="Contraseña actual" onChangeText={setCurrentPassword} secureTextEntry value={currentPassword} />
        <Field label="Nueva contraseña" onChangeText={setNewPassword} secureTextEntry value={newPassword} />
        <Button label="Actualizar contraseña" onPress={() => void changePassword()} />
      </Card>
    </Screen>
  )
}
