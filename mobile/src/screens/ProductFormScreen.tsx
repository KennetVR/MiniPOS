import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Button, Card, Chip, Field, FieldRow, Loading, Notice, Screen, colors, formatMoney, styles as ui } from '../components/ui'
import { mobileApi } from '../lib/api'
import { parseMoney } from '../lib/search'
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
  const [cost, setCost] = useState('')
  const [price, setPrice] = useState('')
  const [minimum, setMinimum] = useState('')
  const [initialStock, setInitialStock] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const nameRef = useRef<TextInput>(null)
  const costRef = useRef<TextInput>(null)
  const priceRef = useRef<TextInput>(null)
  const initialStockRef = useRef<TextInput>(null)
  const minimumRef = useRef<TextInput>(null)
  const descriptionRef = useRef<TextInput>(null)

  useEffect(() => {
    void mobileApi.categories.list().then((result) => {
      if (result.success) {
        const active = result.data.filter((category) => category.estado)
        setCategories(active)
        setCategoryId(active[0]?.id_categoria ?? null)
      } else setError(result.error)
      setLoading(false)
    })
  }, [])

  const parsedCost = parseMoney(cost)
  const parsedPrice = parseMoney(price)
  const margin = parsedPrice - parsedCost
  const showMargin = cost.trim() !== '' && price.trim() !== '' && Number.isFinite(margin)

  const submit = async () => {
    const parsedMinimum = Number(minimum.trim() || 0)
    const parsedInitialStock = Number(initialStock.trim() || 0)
    if (!name.trim()) return setError('Ingresá el nombre del producto')
    if (!categoryId) return setError('Seleccioná una categoría')
    if (!price.trim()) return setError('Ingresá el precio de venta')
    if ([parsedCost, parsedPrice].some((value) => !Number.isFinite(value) || value < 0)) return setError('Los precios deben ser montos válidos')
    if ([parsedMinimum, parsedInitialStock].some((value) => !Number.isInteger(value) || value < 0)) return setError('El stock debe ser un número entero mayor o igual a cero')
    setError(null)
    setSaving(true)
    const result = await mobileApi.products.create({ id_categoria: categoryId, codigo_barras: barcode, nombre: name, descripcion: description, precio_compra: parsedCost, precio_venta: parsedPrice, stock_minimo: parsedMinimum, id_proveedor: null, stock_inicial: parsedInitialStock })
    setSaving(false)
    if (result.success) navigation.goBack()
    else setError(result.error)
  }

  if (loading) return <Loading />
  if (user?.rol !== 'administrador') return <Screen><Notice>Solo un administrador puede crear productos.</Notice></Screen>

  return (
    <Screen footer={<Button disabled={saving} label={saving ? 'Guardando...' : 'Guardar producto'} onPress={() => void submit()} />}>
      {error ? <Notice>{error}</Notice> : null}

      <Card>
        <Text style={s.section}>Identificación</Text>
        <Field
          autoFocus={!barcode}
          label="Nombre *"
          onChangeText={setName}
          onSubmitEditing={() => costRef.current?.focus()}
          placeholder="Ej. Coca Cola 500 ml"
          ref={nameRef}
          returnKeyType="next"
          submitBehavior="submit"
          value={name}
        />
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label="Código de barras"
          onChangeText={setBarcode}
          placeholder="Opcional"
          value={barcode}
        />
        <Text style={ui.fieldLabel}>Categoría *</Text>
        {categories.length === 0
          ? <Notice tone="warning">No hay categorías activas. Creá una desde Más → Categorías.</Notice>
          : (
            <ScrollView contentContainerStyle={s.chips} horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
              {categories.map((category) => <Chip key={category.id_categoria} label={category.nombre} onPress={() => setCategoryId(category.id_categoria)} selected={categoryId === category.id_categoria} />)}
            </ScrollView>
          )}
      </Card>

      <Card>
        <Text style={s.section}>Precios</Text>
        <FieldRow>
          <Field containerStyle={ui.flex} keyboardType="decimal-pad" label="Compra (S/)" onChangeText={setCost} onSubmitEditing={() => priceRef.current?.focus()} placeholder="0.00" ref={costRef} returnKeyType="next" submitBehavior="submit" value={cost} />
          <Field containerStyle={ui.flex} keyboardType="decimal-pad" label="Venta (S/) *" onChangeText={setPrice} onSubmitEditing={() => initialStockRef.current?.focus()} placeholder="0.00" ref={priceRef} returnKeyType="next" submitBehavior="submit" value={price} />
        </FieldRow>
        {showMargin ? (
          <View style={[s.margin, margin < 0 && s.marginNegative]}>
            <Text style={[s.marginText, margin < 0 && s.marginTextNegative]}>
              {margin < 0 ? 'Pérdida' : 'Ganancia'} por unidad: {formatMoney(Math.abs(margin))}
              {parsedCost > 0 ? ` (${Math.round((margin / parsedCost) * 100)}%)` : ''}
            </Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={s.section}>Inventario</Text>
        <FieldRow>
          <Field containerStyle={ui.flex} keyboardType="number-pad" label="Stock inicial" onChangeText={setInitialStock} onSubmitEditing={() => minimumRef.current?.focus()} placeholder="0" ref={initialStockRef} returnKeyType="next" submitBehavior="submit" value={initialStock} />
          <Field containerStyle={ui.flex} hint="Avisa cuando queda poco" keyboardType="number-pad" label="Stock mínimo" onChangeText={setMinimum} onSubmitEditing={() => descriptionRef.current?.focus()} placeholder="0" ref={minimumRef} returnKeyType="next" submitBehavior="submit" value={minimum} />
        </FieldRow>
        <Field label="Descripción" multiline onChangeText={setDescription} placeholder="Opcional" ref={descriptionRef} value={description} />
      </Card>
    </Screen>
  )
}

const s = StyleSheet.create({
  section: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  chips: { gap: 8, paddingVertical: 2 },
  margin: { backgroundColor: colors.successBackground, borderRadius: 10, padding: 10 },
  marginNegative: { backgroundColor: colors.dangerBackground },
  marginText: { color: colors.success, fontSize: 14, fontWeight: '700' },
  marginTextNegative: { color: colors.danger }
})
