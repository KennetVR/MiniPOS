import assert from 'node:assert/strict'
import test from 'node:test'

import { addReceiptLine, findProductByBarcode, parsePositiveQuantity, receiptFingerprint, SubmissionGuard, validateReceipt } from '../src/lib/inventory'
import type { Product, ReceiptLine } from '../src/lib/types'

const product: Product = {
  id_producto: 10,
  codigo_barras: '775000000001',
  nombre: 'Agua mineral',
  descripcion: null,
  id_categoria: 1,
  precio_compra: 1.2,
  precio_venta: 2,
  stock_actual: 3,
  stock_minimo: 2,
  id_proveedor: null,
  estado: true,
  created_at: '',
  updated_at: ''
}

test('accepts only positive integer receipt quantities', () => {
  assert.equal(parsePositiveQuantity('4'), 4)
  assert.equal(parsePositiveQuantity(' 2 '), 2)
  assert.equal(parsePositiveQuantity('0'), null)
  assert.equal(parsePositiveQuantity('1.5'), null)
  assert.equal(parsePositiveQuantity('abc'), null)
})

test('finds a known barcode and returns null for an unknown one', () => {
  assert.equal(findProductByBarcode([product], '775000000001')?.id_producto, 10)
  assert.equal(findProductByBarcode([product], '999'), null)
})

test('merges repeated scans into one receipt line', () => {
  const first = addReceiptLine([], product, 2)
  const second = addReceiptLine(first, product, 3)
  assert.deepEqual(second.map((line) => line.cantidad), [5])
})

test('rejects incomplete receipts and accepts a valid receipt', () => {
  const lines: ReceiptLine[] = [{
    id_producto: 10,
    nombre: product.nombre,
    codigo_barras: product.codigo_barras,
    cantidad: 2,
    precio_compra: 1.2
  }]
  assert.equal(validateReceipt([], 'A-1'), 'Agrega al menos un producto al ingreso')
  assert.equal(validateReceipt(lines, ''), 'Ingresa el número de comprobante')
  assert.equal(validateReceipt(lines, 'A-1'), null)
  assert.notEqual(receiptFingerprint(lines, 'A-1'), receiptFingerprint(lines, 'A-2'))
})

test('prevents duplicate receipt submissions while a request is active', () => {
  const guard = new SubmissionGuard()
  assert.equal(guard.tryStart(), true)
  assert.equal(guard.tryStart(), false)
  guard.finish()
  assert.equal(guard.tryStart(), true)
})
