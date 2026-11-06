import { useCallback, useMemo, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Button, Card, EmptyState, Field, Header, Loading, Notice, Screen, colors, styles } from '../components/ui'
import { mobileApi } from '../lib/api'
import { SubmissionGuard } from '../lib/inventory'
import type { Product, SaleLine } from '../lib/types'

const PAYMENT_METHODS = ['Efectivo', 'Yape / Plin', 'Tarjeta']

export function PosScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<SaleLine[]>([])
  const [query, setQuery] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0])
  const [discount, setDiscount] = useState('0')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const guard = useRef(new SubmissionGuard())

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

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return products.slice(0, 8)
    return products.filter((product) => `${product.nombre} ${product.codigo_barras ?? ''}`.toLocaleLowerCase().includes(normalized)).slice(0, 8)
  }, [products, query])

  const total = cart.reduce((sum, line) => sum + (line.precio_venta - line.descuento) * line.cantidad, 0) - Number(discount || 0)

  const addProduct = (product: Product) => {
    setError(null)
    setMessage(null)
    setCart((current) => {
      const existing = current.find((line) => line.id_producto === product.id_producto)
      if (existing) {
        if (existing.cantidad >= product.stock_actual) {
          setError(`No hay más stock disponible de ${product.nombre}`)
          return current
        }
        return current.map((line) => line.id_producto === product.id_producto ? { ...line, cantidad: line.cantidad + 1 } : line)
      }
      return [...current, { id_producto: product.id_producto, nombre: product.nombre, precio_venta: product.precio_venta, cantidad: 1, descuento: 0 }]
    })
  }

  const changeQuantity = (id: number, delta: number) => {
    setCart((current) => current.flatMap((line) => {
      if (line.id_producto !== id) return [line]
      const quantity = line.cantidad + delta
      return quantity > 0 ? [{ ...line, cantidad: quantity }] : []
    }))
  }

  const submit = async () => {
    setError(null)
    setMessage(null)
    const parsedDiscount = Number(discount || 0)
    if (cart.length === 0) {
      setError('Agrega al menos un producto a la venta')
      return
    }
    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > total + parsedDiscount) {
      setError('El descuento debe ser un monto válido')
      return
    }
    if (!guard.current.tryStart()) return
    const result = await mobileApi.sales.create(cart, paymentMethod, parsedDiscount)
    guard.current.finish()
    if (result.success) {
      setCart([])
      setDiscount('0')
      setMessage(`Venta registrada correctamente (#${result.data})`)
      void load()
    } else {
      setError(result.error)
    }
  }

  if (loading && products.length === 0) return <Loading />

  return (
    <Screen>
      <Header title="Punto de venta" subtitle="El servidor valida precios y stock al confirmar" />
      {error ? <Notice>{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}
      <Field label="Buscar producto" onChangeText={setQuery} placeholder="Nombre o código de barras" value={query} />
      {searchResults.length > 0 ? <Card>
        <Text style={styles.strong}>Resultados</Text>
        {searchResults.map((product) => (
          <Pressable key={product.id_producto} onPress={() => addProduct(product)} style={({ pressed }) => [styles.rowBetween, pressed && { opacity: 0.6 }]}>
            <View style={styles.productCopy}><Text style={styles.strong}>{product.nombre}</Text><Text style={styles.smallText}>{product.codigo_barras || 'Sin código'} · Stock {product.stock_actual}</Text></View>
            <Text style={styles.strong}>S/ {product.precio_venta.toFixed(2)}</Text>
          </Pressable>
        ))}
      </Card> : null}
      <Card>
        <Text style={styles.strong}>Venta actual</Text>
        {cart.length === 0 ? <EmptyState label="Selecciona productos para comenzar" /> : cart.map((line) => (
          <View key={line.id_producto} style={[styles.rowBetween, styles.listRow]}>
            <View style={styles.productCopy}><Text style={styles.strong}>{line.nombre}</Text><Text style={styles.smallText}>S/ {line.precio_venta.toFixed(2)} · Subtotal S/ {(line.precio_venta * line.cantidad).toFixed(2)}</Text></View>
            <View style={styles.quantityControls}><Pressable accessibilityLabel={`Quitar una unidad de ${line.nombre}`} onPress={() => changeQuantity(line.id_producto, -1)} style={styles.quantityButton}><Text style={styles.strong}>−</Text></Pressable><Text style={styles.strong}>{line.cantidad}</Text><Pressable accessibilityLabel={`Agregar una unidad de ${line.nombre}`} onPress={() => changeQuantity(line.id_producto, 1)} style={styles.quantityButton}><Text style={styles.strong}>+</Text></Pressable></View>
          </View>
        ))}
        <Field keyboardType="decimal-pad" label="Descuento global" onChangeText={setDiscount} placeholder="0.00" value={discount} />
        <Text style={styles.total}>Total: S/ {Math.max(0, total).toFixed(2)}</Text>
        <Text style={styles.fieldLabel}>Forma de pago</Text>
        <View style={styles.paymentRow}>{PAYMENT_METHODS.map((method) => <Pressable key={method} onPress={() => setPaymentMethod(method)} style={[styles.paymentOption, paymentMethod === method && styles.selectedPayment]}><Text style={paymentMethod === method ? styles.selectedPaymentText : styles.smallText}>{method}</Text></Pressable>)}</View>
        <Button disabled={cart.length === 0} label="Confirmar venta" onPress={() => void submit()} />
      </Card>
    </Screen>
  )
}
