import type { NavigatorScreenParams } from '@react-navigation/native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type MainTabParamList = {
  Inicio: undefined
  Productos: undefined
  POS: undefined
  Más: undefined
}

export type RootStackParamList = {
  Login: undefined
  Main: NavigatorScreenParams<MainTabParamList> | undefined
  InventoryReceipt: undefined
  ProductForm: { barcode?: string } | undefined
  Categories: undefined
  Users: undefined
  Settings: undefined
}

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>
export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<MainTabParamList, T>
