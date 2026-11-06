import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Button, Card, Field, Header, Loading, Notice, Screen, styles } from '../components/ui'
import { mobileApi } from '../lib/api'
import type { Category } from '../lib/types'
import type { RootStackParamList } from '../navigation/types'
import { useAuth } from '../state/AuthContext'

export function ProductFormScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'ProductForm'>>()
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [barcode, setBarcode] = useState(route.params?.barcode ?? '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('0')
  const [price, setPrice] = useState('0')
  const [minimum, setMinimum] = useState('0')
  const [initialStock, setInitialStock] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void mobileApi.categories.list().then((result) => {
      if (result.success) {
        setCategories(result.data)
        setCategoryId(result.data[0]?.id_categoria ?? null)
      } else setError(result.error)
      setLoading(false)
    })
  }, [])

  const submit = async () => {
    const parsedCost = Number(cost)
    const parsedPrice = Number(price)
    const parsedMinimum = Number(minimum)
    const parsedInitialStock = Number(initialStock)
    if (!categoryId || !name.trim()) return setError('Selecciona una categoría e ingresa el nombre')
    if ([parsedCost, parsedPrice, parsedMinimum, parsedInitialStock].some((value) => !Number.isFinite(value) || value < 0)) return setError('Los valores numéricos deben ser mayores o iguales a cero')
    setSaving(true)
    const result = await mobileApi.products.create({ id_categoria: categoryId, codigo_barras: barcode, nombre: name, descripcion: description, precio_compra: parsedCost, precio_venta: parsedPrice, stock_minimo: parsedMinimum, id_proveedor: null, stock_inicial: parsedInitialStock })
    setSaving(false)
    if (result.success) navigation.goBack()
    else setError(result.error)
  }

  if (loading) return <Loading />
  if (user?.rol !== 'administrador') return <Screen><Notice>Solo un administrador puede crear productos. Esta restricción también se aplica en el RPC de Supabase.</Notice></Screen>

  return (
    <Screen>
      <Header title="Nuevo producto" subtitle="El stock inicial se registra dentro del RPC transaccional" />
      {error ? <Notice>{error}</Notice> : null}
      <Card>
        <Field label="Código de barras" onChangeText={setBarcode} placeholder="Opcional" value={barcode} />
        <Field label="Nombre" onChangeText={setName} placeholder="Nombre del producto" value={name} />
        <Field label="Descripción" multiline onChangeText={setDescription} placeholder="Opcional" value={description} />
        <Text style={styles.fieldLabel}>Categoría</Text>
        {categories.map((category) => <Button key={category.id_categoria} label={category.nombre} onPress={() => setCategoryId(category.id_categoria)} variant={categoryId === category.id_categoria ? 'primary' : 'secondary'} />)}
        <Field keyboardType="decimal-pad" label="Precio de compra" onChangeText={setCost} value={cost} />
        <Field keyboardType="decimal-pad" label="Precio de venta" onChangeText={setPrice} value={price} />
        <Field keyboardType="number-pad" label="Stock mínimo" onChangeText={setMinimum} value={minimum} />
        <Field keyboardType="number-pad" label="Stock inicial" onChangeText={setInitialStock} value={initialStock} />
        <Button disabled={saving} label={saving ? 'Guardando...' : 'Crear producto'} onPress={() => void submit()} />
      </Card>
    </Screen>
  )
}
