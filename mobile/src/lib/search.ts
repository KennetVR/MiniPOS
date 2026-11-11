import type { Product } from './types'

export const MIN_QUERY_LENGTH = 2

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

export function findExactBarcode(products: Product[], query: string): Product | null {
  const code = query.trim()
  if (!code) return null
  return products.find((product) => product.codigo_barras === code) ?? null
}

function rank(product: Product, normalizedQuery: string, firstToken: string): number {
  const name = normalizeText(product.nombre)
  if (product.codigo_barras && product.codigo_barras === normalizedQuery) return 0
  if (name.startsWith(normalizedQuery)) return 1
  if (name.split(/\s+/).some((word) => word.startsWith(firstToken))) return 2
  return 3
}

/**
 * Returns products matching every token of the query (accent and case insensitive).
 * Returns nothing until the query reaches MIN_QUERY_LENGTH, unless it is an exact barcode.
 */
export function searchProducts(products: Product[], query: string, limit = 20): Product[] {
  const normalizedQuery = normalizeText(query)
  const exact = findExactBarcode(products, query)
  if (normalizedQuery.length < MIN_QUERY_LENGTH && !exact) return []

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const firstToken = tokens[0] ?? ''

  return products
    .filter((product) => {
      const haystack = normalizeText(`${product.nombre} ${product.codigo_barras ?? ''}`)
      return tokens.every((token) => haystack.includes(token))
    })
    .sort((a, b) => rank(a, normalizedQuery, firstToken) - rank(b, normalizedQuery, firstToken) || a.nombre.localeCompare(b.nombre))
    .slice(0, limit)
}

export type StockLevel = 'out' | 'low' | 'ok'

export function stockLevel(product: Pick<Product, 'stock_actual' | 'stock_minimo'>): StockLevel {
  if (product.stock_actual <= 0) return 'out'
  if (product.stock_actual <= product.stock_minimo) return 'low'
  return 'ok'
}

export function parseMoney(value: string): number {
  const normalized = value.replace(',', '.').trim()
  if (!normalized) return 0
  return Number(normalized)
}

