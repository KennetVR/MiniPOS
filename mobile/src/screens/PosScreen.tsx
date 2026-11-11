import { useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, Chip, EmptyState, Field, Loading, Screen, Toast, colors, formatMoney, styles as ui, useToast } from '../components/ui'
import { mobileApi } from '../lib/api'
import { SubmissionGuard } from '../lib/inventory'
import { findExactBarcode, MIN_QUERY_LENGTH, parseMoney, searchProducts, stockLevel } from '../lib/search'
import type { Product, SaleLine } from '../lib/types'

const PAYMENT_METHODS = ['Efectivo', 'Yape / Plin', 'Tarjeta']
const TAX_RATE = 0.18
const MAX_DISCOUNT_RATIO = 0.5
const WIDE_LAYOUT = 768

const SERVER_ERRORS: Record<string, string> = {
  insufficient_stock: 'No hay stock suficiente para uno de los productos.',
  invalid_discount: 'El descuento no puede superar el 50% del subtotal.',
  forbidden: 'Tu usuario no tiene permiso para registrar ventas.',
  product_not_found: 'Uno de los productos ya no está disponible.',
  invalid_sale: 'La venta tiene datos inválidos. Revisá el carrito.'
}

function friendlyError(message: string): string {
  const key = Object.keys(SERVER_ERRORS).find((code) => message.includes(code))
  return key ? SERVER_ERRORS[key] : message
}

export function PosScreen() {
  const { width } = useWindowDimensions()
  const isWide = width >= WIDE_LAYOUT
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<SaleLine[]>([])
  const [query, setQuery] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0])
  const [discount, setDiscount] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useToast()
  const guard = useRef(new SubmissionGuard())
  const searchRef = useRef<TextInput>(null)

  const load = useCallback(async () => {
    const result = await mobileApi.products.list()
    if (result.success) setProducts(result.data)
    else setToast({ tone: 'danger', text: result.error })
    setLoading(false)
  }, [setToast])

  useFocusEffect(useCallback(() => {
    void load()
  }, [load]))

  const productById = useMemo(() => new Map(products.map((product) => [product.id_producto, product])), [products])
  const results = useMemo(() => searchProducts(products, query), [products, query])
  const trimmedQuery = query.trim()

  const itemCount = cart.reduce((sum, line) => sum + line.cantidad, 0)
  const subtotal = cart.reduce((sum, line) => sum + (line.precio_venta - line.descuento) * line.cantidad, 0)
  const parsedDiscount = parseMoney(discount)
  const discountValid = Number.isFinite(parsedDiscount) && parsedDiscount >= 0 && parsedDiscount <= subtotal * MAX_DISCOUNT_RATIO
  const taxable = Math.max(0, subtotal - (discountValid ? parsedDiscount : 0))
  const tax = Math.round(taxable * TAX_RATE * 100) / 100
  const total = taxable + tax

  const addProduct = (product: Product) => {
    const inCart = cart.find((line) => line.id_producto === product.id_producto)?.cantidad ?? 0
    if (inCart >= product.stock_actual) {
      setToast({ tone: 'warning', text: product.stock_actual <= 0 ? `${product.nombre} no tiene stock` : `Solo hay ${product.stock_actual} de ${product.nombre}` })
      return
    }
    setCart((current) => inCart > 0
      ? current.map((line) => line.id_producto === product.id_producto ? { ...line, cantidad: line.cantidad + 1 } : line)
      : [...current, { id_producto: product.id_producto, nombre: product.nombre, precio_venta: product.precio_venta, cantidad: 1, descuento: 0 }])
    setQuery('')
    setToast({ tone: 'success', text: `${product.nombre} agregado` })
    searchRef.current?.focus()
  }

  const changeQuantity = (id: number, delta: number) => {
    const stock = productById.get(id)?.stock_actual ?? Number.POSITIVE_INFINITY
    setCart((current) => current.flatMap((line) => {
      if (line.id_producto !== id) return [line]
      const quantity = line.cantidad + delta
      if (delta > 0 && quantity > stock) {
        setToast({ tone: 'warning', text: `Solo hay ${stock} de ${line.nombre}` })
        return [line]
      }
      return quantity > 0 ? [{ ...line, cantidad: quantity }] : []
    }))
  }

  const submitSearch = () => {
    const exact = findExactBarcode(products, query)
    if (exact) return addProduct(exact)
    if (results.length === 1) return addProduct(results[0])
  }

  const submit = async () => {
    if (cart.length === 0) return setToast({ tone: 'warning', text: 'Agregá al menos un producto' })
    if (!discountValid) return setToast({ tone: 'danger', text: 'El descuento debe ser un monto válido y no mayor al 50% del subtotal' })
    if (!guard.current.tryStart()) return
    setSubmitting(true)
    const result = await mobileApi.sales.create(cart, paymentMethod, parsedDiscount)
    guard.current.finish()
    setSubmitting(false)
    if (result.success) {
      setCart([])
      setDiscount('')
      setCheckoutOpen(false)
      setToast({ tone: 'success', text: `Venta #${result.data} registrada · ${formatMoney(total)}` })
      void load()
    } else {
      setToast({ tone: 'danger', text: friendlyError(result.error) })
    }
  }

  if (loading && products.length === 0) return <Loading />

  const searchBox = (
    <View style={s.searchBox}>
      <TextInput
        accessibilityLabel="Buscar producto"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setQuery}
        onSubmitEditing={submitSearch}
        placeholder="Buscar por nombre o código"
        placeholderTextColor={colors.subtle}
        ref={searchRef}
        returnKeyType="search"
        style={s.searchInput}
        submitBehavior="submit"
        value={query}
      />
      {query ? <Pressable accessibilityLabel="Limpiar búsqueda" hitSlop={12} onPress={() => setQuery('')} style={s.clearButton}><Text style={s.clearText}>✕</Text></Pressable> : null}
    </View>
  )

  const resultsList = trimmedQuery.length > 0 ? (
    <FlatList
      data={results}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => String(item.id_producto)}
      ListEmptyComponent={<EmptyState label={trimmedQuery.length < MIN_QUERY_LENGTH ? 'Escribí al menos 2 letras' : `Sin coincidencias para "${trimmedQuery}"`} />}
      renderItem={({ item }) => <ResultRow inCart={cart.find((line) => line.id_producto === item.id_producto)?.cantidad ?? 0} onPress={() => addProduct(item)} product={item} />}
      style={ui.flex}
    />
  ) : null

  const cartList = (
    <FlatList
      contentContainerStyle={cart.length === 0 ? s.emptyContainer : undefined}
      data={cart}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => String(item.id_producto)}
      ListEmptyComponent={<EmptyState label="Buscá un producto para empezar la venta" />}
      renderItem={({ item }) => <CartRow line={item} onChange={changeQuantity} />}
      style={ui.flex}
    />
  )

  const checkoutForm = (
    <View style={s.checkout}>
      <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
      <Field
        hint={discountValid ? undefined : 'Máximo 50% del subtotal'}
        keyboardType="decimal-pad"
        label="Descuento (S/)"
        onChangeText={setDiscount}
        placeholder="0.00"
        value={discount}
      />
      <SummaryRow label="IGV 18%" value={formatMoney(tax)} />
      <SummaryRow emphasis label="Total" value={formatMoney(total)} />
      <Text style={ui.fieldLabel}>Forma de pago</Text>
      <View style={ui.paymentRow}>
        {PAYMENT_METHODS.map((method) => <Chip key={method} label={method} onPress={() => setPaymentMethod(method)} selected={paymentMethod === method} />)}
      </View>
      <Button disabled={submitting || cart.length === 0} label={submitting ? 'Registrando...' : `Confirmar ${formatMoney(total)}`} onPress={() => void submit()} />
    </View>
  )

  if (isWide) {
    return (
      <Screen scroll={false}>
        <View style={s.wideRow}>
          <View style={s.wideColumn}>
            <Text style={ui.title}>Venta</Text>
            {searchBox}
            <Toast onDismiss={() => setToast(null)} toast={toast} />
            {resultsList ?? <EmptyState label="Escribí el nombre o escaneá el código del producto" />}
          </View>
          <View style={[ui.card, s.wideColumn]}>
            <Text style={ui.strong}>Carrito · {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}</Text>
            {cartList}
            <ScrollView keyboardShouldPersistTaps="handled" style={s.wideCheckout}>{checkoutForm}</ScrollView>
          </View>
        </View>
      </Screen>
    )
  }

  return (
    <Screen
      footer={cart.length > 0 && !trimmedQuery ? (
        <View style={ui.rowBetween}>
          <View>
            <Text style={ui.smallText}>{itemCount} {itemCount === 1 ? 'ítem' : 'ítems'} · inc. IGV</Text>
            <Text style={s.footerTotal}>{formatMoney(total)}</Text>
          </View>
          <Button label="Cobrar" onPress={() => setCheckoutOpen(true)} style={s.chargeButton} />
        </View>
      ) : null}
      scroll={false}
    >
      <Text style={ui.title}>Venta</Text>
      {searchBox}
      <Toast onDismiss={() => setToast(null)} toast={toast} />
      {resultsList ?? cartList}

      <Modal animationType="slide" onRequestClose={() => setCheckoutOpen(false)} transparent visible={checkoutOpen}>
        <Pressable accessibilityLabel="Cerrar cobro" onPress={() => setCheckoutOpen(false)} style={s.backdrop} />
        <KeyboardAvoidingView behavior="padding" pointerEvents="box-none" style={s.sheetWrapper}>
          <SafeAreaView edges={['bottom']} style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={ui.rowBetween}>
              <Text style={ui.title}>Cobrar</Text>
              <Pressable accessibilityLabel="Cerrar" hitSlop={12} onPress={() => setCheckoutOpen(false)}><Text style={s.clearText}>✕</Text></Pressable>
            </View>
            <Toast onDismiss={() => setToast(null)} toast={toast?.tone === 'danger' ? toast : null} />
            <ScrollView keyboardShouldPersistTaps="handled">{checkoutForm}</ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  )
}

function ResultRow({ product, inCart, onPress }: { product: Product; inCart: number; onPress: () => void }) {
  const level = stockLevel(product)
  const disabled = level === 'out'
  return (
    <Pressable
      accessibilityLabel={`Agregar ${product.nombre}, ${formatMoney(product.precio_venta)}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.resultRow, pressed && s.pressedRow, disabled && s.disabledRow]}
    >
      <View style={ui.productCopy}>
        <Text numberOfLines={2} style={ui.strong}>{product.nombre}</Text>
        <View style={ui.row}>
          <Text style={[s.stockBadge, level === 'low' && s.stockLow, level === 'out' && s.stockOut]}>
            {level === 'out' ? 'Sin stock' : `Stock ${product.stock_actual}`}
          </Text>
          {inCart > 0 ? <Text style={s.inCart}>En carrito: {inCart}</Text> : null}
        </View>
      </View>
      <Text style={s.price}>{formatMoney(product.precio_venta)}</Text>
      {!disabled ? <View style={s.addIcon}><Text style={s.addIconText}>+</Text></View> : null}
    </Pressable>
  )
}

function CartRow({ line, onChange }: { line: SaleLine; onChange: (id: number, delta: number) => void }) {
  return (
    <View style={s.cartRow}>
      <View style={ui.productCopy}>
        <Text numberOfLines={2} style={ui.strong}>{line.nombre}</Text>
        <Text style={ui.smallText}>{formatMoney(line.precio_venta)} c/u</Text>
        <Text style={s.lineTotal}>{formatMoney((line.precio_venta - line.descuento) * line.cantidad)}</Text>
      </View>
      <View style={ui.quantityControls}>
        <Pressable accessibilityLabel={`Quitar una unidad de ${line.nombre}`} onPress={() => onChange(line.id_producto, -1)} style={ui.quantityButton}><Text style={ui.quantityText}>−</Text></Pressable>
        <Text style={ui.quantityText}>{line.cantidad}</Text>
        <Pressable accessibilityLabel={`Agregar una unidad de ${line.nombre}`} onPress={() => onChange(line.id_producto, 1)} style={ui.quantityButton}><Text style={ui.quantityText}>+</Text></Pressable>
      </View>
    </View>
  )
}

function SummaryRow({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={ui.rowBetween}>
      <Text style={emphasis ? s.summaryStrongLabel : ui.muted}>{label}</Text>
      <Text style={emphasis ? s.summaryStrongValue : ui.strong}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  searchBox: { justifyContent: 'center' },
  searchInput: { backgroundColor: colors.surface, borderColor: colors.primary, borderRadius: 14, borderWidth: 2, color: colors.text, fontSize: 17, minHeight: 54, paddingLeft: 16, paddingRight: 44 },
  clearButton: { position: 'absolute', right: 14 },
  clearText: { color: colors.muted, fontSize: 18, fontWeight: '700' },
  resultRow: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingVertical: 12 },
  pressedRow: { backgroundColor: colors.primarySoft },
  disabledRow: { opacity: 0.5 },
  price: { color: colors.text, fontSize: 18, fontWeight: '800' },
  addIcon: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  addIconText: { color: '#ffffff', fontSize: 22, fontWeight: '800', lineHeight: 24 },
  stockBadge: { backgroundColor: colors.surfaceMuted, borderRadius: 6, color: colors.muted, fontSize: 12, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 2 },
  stockLow: { backgroundColor: colors.warningBackground, color: colors.warning },
  stockOut: { backgroundColor: colors.dangerBackground, color: colors.danger },
  inCart: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  cartRow: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingVertical: 12 },
  lineTotal: { color: colors.text, fontSize: 15, fontWeight: '800' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  footerTotal: { color: colors.text, fontSize: 26, fontWeight: '800' },
  chargeButton: { minWidth: 140 },
  checkout: { gap: 12 },
  summaryStrongLabel: { color: colors.text, fontSize: 18, fontWeight: '800' },
  summaryStrongValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  sheetWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12, maxHeight: '90%', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  sheetHandle: { alignSelf: 'center', backgroundColor: colors.borderStrong, borderRadius: 3, height: 5, width: 44 },
  wideRow: { flex: 1, flexDirection: 'row', gap: 16 },
  wideColumn: { flex: 1, gap: 12 },
  wideCheckout: { flexGrow: 0, maxHeight: 360 }
})
