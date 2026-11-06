import { useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { addReceiptLine, parsePositiveQuantity, SubmissionGuard, validateReceipt } from '../lib/inventory'
import { mobileApi } from '../lib/api'
import type { Product, ReceiptLine } from '../lib/types'
import type { RootStackParamList } from '../navigation/types'
import { Button, Card, EmptyState, Field, Header, Notice, Screen, styles } from '../components/ui'

export function InventoryReceiptScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [permission, requestPermission] = useCameraPermissions()
  const [scannerVisible, setScannerVisible] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [lines, setLines] = useState<ReceiptLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const scanLocked = useRef(false)
  const guard = useRef(new SubmissionGuard())

  const lookup = async (value: string) => {
    const normalized = value.trim()
    if (!normalized) return
    setError(null)
    setMessage(null)
    const result = await mobileApi.products.byBarcode(normalized)
    if (!result.success) {
      setError(result.error)
      return
    }
    setBarcode(normalized)
    setScannerVisible(false)
    setUnknownBarcode(result.data ? null : normalized)
    setSelectedProduct(result.data)
    setQuantity('1')
  }

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanLocked.current) return
    scanLocked.current = true
    void lookup(result.data).finally(() => {
      scanLocked.current = false
    })
  }

  const addLine = () => {
    if (!selectedProduct) {
      setError('Escanea o busca un producto antes de agregarlo')
      return
    }
    const parsed = parsePositiveQuantity(quantity)
    if (!parsed) {
      setError('La cantidad debe ser un entero mayor que cero')
      return
    }
    setLines((current) => addReceiptLine(current, selectedProduct, parsed))
    setSelectedProduct(null)
    setBarcode('')
    setQuantity('1')
    setError(null)
  }

  const submit = async () => {
    const validationError = validateReceipt(lines, receiptNumber)
    if (validationError) {
      setError(validationError)
      return
    }
    if (!guard.current.tryStart()) return
    setError(null)
    const result = await mobileApi.inventory.createReceipt(receiptNumber, lines)
    guard.current.finish()
    if (result.success) {
      setMessage(`Ingreso registrado correctamente (#${result.data})`)
      setLines([])
      setReceiptNumber('')
    } else {
      setError(result.error)
    }
  }

  return (
    <Screen>
      <Header title="Ingresar stock" subtitle="Escanea una vez y confirma la cantidad recibida" />
      {error ? <Notice>{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}
      {scannerVisible ? (
        <Card style={styles.scannerCard}>
          {permission?.granted ? (
            <CameraView
              active
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={onBarcodeScanned}
              style={styles.scanner}
            />
          ) : <Button label={permission?.canAskAgain === false ? 'Permiso de cámara bloqueado' : 'Permitir cámara'} onPress={() => void requestPermission()} />}
          <Button label="Cerrar escáner" onPress={() => setScannerVisible(false)} variant="secondary" />
        </Card>
      ) : null}
      {!scannerVisible ? <Button label="Escanear código de barras" onPress={() => { setScannerVisible(true); setError(null) }} /> : null}
      <Card>
        <Text style={styles.strong}>Producto</Text>
        <Field autoCapitalize="none" label="Código de barras (también puedes escribirlo)" onChangeText={setBarcode} onSubmitEditing={() => void lookup(barcode)} placeholder="775..." value={barcode} />
        <Button label="Buscar código" onPress={() => void lookup(barcode)} variant="secondary" />
        {unknownBarcode ? <Notice tone="warning">No existe un producto con el código {unknownBarcode}. Puedes crearlo con el código precargado.</Notice> : null}
        {unknownBarcode ? <Button label="Crear producto" onPress={() => navigation.navigate('ProductForm', { barcode: unknownBarcode })} /> : null}
        {selectedProduct ? <>
          <Text style={styles.strong}>{selectedProduct.nombre}</Text>
          <Text style={styles.smallText}>Stock actual: {selectedProduct.stock_actual} · Costo sugerido: S/ {selectedProduct.precio_compra.toFixed(2)}</Text>
          <Field keyboardType="number-pad" label="Cantidad recibida" onChangeText={setQuantity} placeholder="1" value={quantity} />
          <Button label="Agregar al ingreso" onPress={addLine} />
        </> : null}
      </Card>
      <Card>
        <Text style={styles.strong}>Detalle del ingreso</Text>
        {lines.length === 0 ? <EmptyState label="Aún no hay productos agregados" /> : lines.map((line) => <View key={line.id_producto} style={[styles.rowBetween, styles.listRow]}><View style={styles.productCopy}><Text style={styles.strong}>{line.nombre}</Text><Text style={styles.smallText}>S/ {line.precio_compra.toFixed(2)} por unidad</Text></View><Text style={styles.strong}>x {line.cantidad}</Text></View>)}
        <Field label="Número de comprobante" onChangeText={setReceiptNumber} placeholder="Compra-0001" value={receiptNumber} />
        <Button disabled={lines.length === 0} label="Confirmar ingreso" onPress={() => void submit()} />
      </Card>
    </Screen>
  )
}
