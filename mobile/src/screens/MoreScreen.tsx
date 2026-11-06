import { Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Button, Card, Header, Notice, Screen, styles } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'
import { useAuth } from '../state/AuthContext'

export function MoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user, signOut } = useAuth()

  return (
    <Screen>
      <Header title="Más opciones" subtitle="Administra tu cuenta y la operación" />
      <Card>
        <Text style={styles.strong}>{user?.nombre}</Text>
        <Text style={styles.smallText}>{user?.username || 'Cuenta Supabase'} · {user?.rol}</Text>
      </Card>
      <Button label="Ingresar stock con código de barras" onPress={() => navigation.navigate('InventoryReceipt')} />
      <Button label="Categorías" onPress={() => navigation.navigate('Categories')} variant="secondary" />
      {user?.rol === 'administrador' ? <Button label="Usuarios" onPress={() => navigation.navigate('Users')} variant="secondary" /> : <Notice tone="warning">Las funciones administrativas están protegidas por el rol de Supabase.</Notice>}
      <Button label="Configuración" onPress={() => navigation.navigate('Settings')} variant="secondary" />
      <Button label="Cerrar sesión" onPress={() => void signOut()} variant="danger" />
    </Screen>
  )
}
