import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeText, parseMoney, searchProducts, stockLevel } from '../src/lib/search'
import type { Product } from '../src/lib/types'

function product(id: number, nombre: string, codigo_barras: string | null = null, stock_actual = 10, stock_minimo = 2): Product {
  return {
    id_producto: id,
    codigo_barras,
    nombre,
    descripcion: null,
    id_categoria: 1,
    precio_compra: 1,
    precio_venta: 2,
    stock_actual,
    stock_minimo,
    id_proveedor: null,
    estado: true,
    created_at: '',
    updated_at: ''
  }
}

const catalog = [
  product(1, 'Coca Cola 500ml', '7750001'),
  product(2, 'Inca Kola 500ml', '7750002'),
  product(3, 'Agua Cielo', '7750003'),
  product(4, 'Galleta Soda', '7750004'),
  product(5, 'Café Altomayo', '7750005')
]

test('empty or one-letter queries return no suggestions', () => {
  assert.deepEqual(searchProducts(catalog, ''), [])
  assert.deepEqual(searchProducts(catalog, 'c'), [])
})

test('matches every token regardless of order', () => {
  const result = searchProducts(catalog, 'kola 500')
  assert.deepEqual(result.map((p) => p.id_producto), [2])
})

test('ignores accents and case', () => {
  assert.equal(normalizeText('CAFÉ'), 'cafe')
  assert.deepEqual(searchProducts(catalog, 'cafe').map((p) => p.id_producto), [5])
})

test('names starting with the query rank first', () => {
  const result = searchProducts(catalog, 'co')
  assert.equal(result[0]?.id_producto, 1)
})

test('exact barcode matches even when short', () => {
  const short = [product(9, 'Chicle', '7')]
  assert.deepEqual(searchProducts(short, '7').map((p) => p.id_producto), [9])
})

test('stock level classification', () => {
  assert.equal(stockLevel({ stock_actual: 0, stock_minimo: 2 }), 'out')
  assert.equal(stockLevel({ stock_actual: 2, stock_minimo: 2 }), 'low')
  assert.equal(stockLevel({ stock_actual: 5, stock_minimo: 2 }), 'ok')
})

test('money parsing accepts comma and empty values', () => {
  assert.equal(parseMoney('2,50'), 2.5)
  assert.equal(parseMoney(''), 0)
  assert.ok(Number.isNaN(parseMoney('abc')))
})

