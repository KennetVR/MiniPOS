import { useCallback, useMemo, useState } from 'react'
import { RefreshControl, Text, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Button, Card, EmptyState, Field, Header, Loading, Notice, Screen, colors, styles } from '../components/ui'
import { mobileApi } from '../lib/api'
import type { Product } from '../lib/types'
import type { RootStackParamList } from '../navigation/types'

export function ProductsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await mobileApi.products.list()
    if (result.success) setProducts(result.data)
    else setError(result.error)
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => {
    void load()
  }, [load]))

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return products
    return products.filter((product) => [product.nombre, product.codigo_barras ?? '', product.categoria_nombre ?? ''].some((value) => value.toLocaleLowerCase().includes(normalized)))
  }, [products, query])

  if (loading && products.length === 0) return <Loading />

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}>
      <Header title="Productos" subtitle={`${products.length} activos`} action={<Button label="Ingresar stock" onPress={() => navigation.navigate('InventoryReceipt')} />} />
      {error ? <Notice>{error}</Notice> : null}
      <Field label="Buscar" onChangeText={setQuery} placeholder="Nombre o código de barras" value={query} />
      {filtered.length === 0 ? <EmptyState label="No se encontraron productos" /> : filtered.map((product) => (
        <Card key={product.id_producto}>
          <View style={styles.rowBetween}>
            <View style={styles.productCopy}>
              <Text style={styles.strong}>{product.nombre}</Text>
              <Text style={styles.smallText}>{product.codigo_barras || 'Sin código'} · {product.categoria_nombre || 'Sin categoría'}</Text>
            </View>
            <Text style={styles.strong}>S/ {product.precio_venta.toFixed(2)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={[styles.smallText, product.stock_actual <= product.stock_minimo && { color: colors.warning, fontWeight: '700' }]}>Stock: {product.stock_actual} · Mínimo: {product.stock_minimo}</Text>
            <Text style={styles.smallText}>Costo S/ {product.precio_compra.toFixed(2)}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  )
}
