import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import { Button, Field, Notice, colors } from '../components/ui'
import { useAuth } from '../state/AuthContext'

export function LoginScreen() {
  const { configured, error, loading, signIn, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const submit = async () => {
    clearError()
    setLocalError(null)
    if (!email.trim() || !password) {
      setLocalError('Ingresa tu correo y contraseña')
      return
    }
    await signIn(email, password)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.brand}>
        <Text style={styles.logo}>MiniPOS</Text>
        <Text style={styles.tagline}>Inventario compartido, estés donde estés.</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Usa la cuenta de Supabase invitada por tu administrador.</Text>
        {!configured ? <Notice tone="warning">Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY antes de iniciar sesión.</Notice> : null}
        {localError || error ? <Notice>{localError ?? error}</Notice> : null}
        <Field autoCapitalize="none" autoComplete="email" keyboardType="email-address" label="Correo electrónico" onChangeText={setEmail} placeholder="usuario@ejemplo.com" value={email} />
        <Field autoCapitalize="none" label="Contraseña" onChangeText={setPassword} placeholder="••••••••" secureTextEntry value={password} />
        <Button disabled={loading || !configured} label={loading ? 'Ingresando...' : 'Ingresar'} onPress={() => void submit()} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#eff6ff', flex: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logo: { color: colors.primaryDark, fontSize: 42, fontWeight: '900' },
  tagline: { color: colors.muted, fontSize: 16, marginTop: 8, textAlign: 'center' },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, gap: 16, padding: 20 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 }
})
