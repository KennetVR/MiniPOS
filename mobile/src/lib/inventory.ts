import type { Product, ReceiptLine } from './types'

export function parsePositiveQuantity(value: string | number): number | null {
  const parsed = typeof value === 'number' ? value : Number(value.trim())
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function findProductByBarcode(products: Product[], barcode: string): Product | null {
  const normalized = barcode.trim()
  if (!normalized) return null
  return products.find((product) => product.codigo_barras === normalized) ?? null
}

export function addReceiptLine(lines: ReceiptLine[], product: Product, quantity: number): ReceiptLine[] {
  const parsedQuantity = parsePositiveQuantity(quantity)
  if (!parsedQuantity) return lines

  const existing = lines.find((line) => line.id_producto === product.id_producto)
  if (existing) {
    return lines.map((line) => line.id_producto === product.id_producto
      ? { ...line, cantidad: line.cantidad + parsedQuantity }
      : line)
  }

  return [
    ...lines,
    {
      id_producto: product.id_producto,
      nombre: product.nombre,
      codigo_barras: product.codigo_barras,
      cantidad: parsedQuantity,
      precio_compra: product.precio_compra
    }
  ]
}

export function validateReceipt(lines: ReceiptLine[], receiptNumber: string): string | null {
  if (lines.length === 0) return 'Agrega al menos un producto al ingreso'
  if (!receiptNumber.trim()) return 'Ingresa el número de comprobante'
  if (lines.some((line) => !parsePositiveQuantity(line.cantidad))) {
    return 'Todas las cantidades deben ser enteros mayores que cero'
  }
  if (lines.some((line) => !Number.isFinite(line.precio_compra) || line.precio_compra < 0)) {
    return 'Los costos de compra no pueden ser negativos'
  }
  return null
}

export function receiptFingerprint(lines: ReceiptLine[], receiptNumber: string): string {
  return JSON.stringify({
    receiptNumber: receiptNumber.trim(),
    lines: lines
      .map(({ id_producto, cantidad, precio_compra }) => ({ id_producto, cantidad, precio_compra }))
      .sort((left, right) => left.id_producto - right.id_producto)
  })
}

export class SubmissionGuard {
  private active = false

  tryStart(): boolean {
    if (this.active) return false
    this.active = true
    return true
  }

  finish(): void {
    this.active = false
  }
}
