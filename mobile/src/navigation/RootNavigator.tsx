import { NavigationContainer, type LinkingOptions } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import { Loading } from '../components/ui'
import { useAuth } from '../state/AuthContext'
import { DashboardScreen } from '../screens/DashboardScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { ProductsScreen } from '../screens/ProductsScreen'
import { PosScreen } from '../screens/PosScreen'
import { MoreScreen } from '../screens/MoreScreen'
import { InventoryReceiptScreen } from '../screens/InventoryReceiptScreen'
import { ProductFormScreen } from '../screens/ProductFormScreen'
import { PlaceholderScreen } from '../screens/PlaceholderScreen'
import type { MainTabParamList, RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tabs = createBottomTabNavigator<MainTabParamList>()

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}>
      <Tabs.Screen name="Inicio" component={DashboardScreen} options={{ tabBarLabel: 'Inicio', tabBarIcon: () => <Text>⌂</Text> }} />
      <Tabs.Screen name="Productos" component={ProductsScreen} options={{ tabBarLabel: 'Productos', tabBarIcon: () => <Text>▦</Text> }} />
      <Tabs.Screen name="POS" component={PosScreen} options={{ tabBarLabel: 'POS', tabBarIcon: () => <Text>▣</Text> }} />
      <Tabs.Screen name="Más" component={MoreScreen} options={{ tabBarLabel: 'Más', tabBarIcon: () => <Text>•••</Text> }} />
    </Tabs.Navigator>
  )
}

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['minipos://'],
  config: { screens: { Login: 'login', Main: 'main' } }
}

export function RootNavigator() {
  const { loading, user } = useAuth()
  if (loading) return <Loading />

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="InventoryReceipt" component={InventoryReceiptScreen} options={{ headerShown: true, title: 'Ingreso de inventario' }} />
          <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ headerShown: true, title: 'Nuevo producto' }} />
          <Stack.Screen name="Categories" component={PlaceholderScreen} options={{ headerShown: true, title: 'Categorías' }} />
          <Stack.Screen name="Users" component={PlaceholderScreen} options={{ headerShown: true, title: 'Usuarios' }} />
          <Stack.Screen name="Settings" component={PlaceholderScreen} options={{ headerShown: true, title: 'Configuración' }} />
        </> : <Stack.Screen name="Login" component={LoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
