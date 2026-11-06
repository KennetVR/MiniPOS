export function getDbPath() {
  const path = typeof window.require !== 'undefined' ? require('path') : null
  return path
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface Categoria {
  id_categoria: number
  nombre: string
  descripcion: string | null
  estado: boolean
  created_at: string
  updated_at: string
}

export interface Producto {
  id_producto: number
  codigo_barras: string | null
  nombre: string
  descripcion: string | null
  id_categoria: number
  precio_compra: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  id_proveedor: number | null
  estado: boolean
  created_at: string
  updated_at: string
}

export interface Venta {
  id_venta: number
  numero_boleta: string
  id_usuario: number
  subtotal: number
  descuento: number
  igv: number
  total: number
  forma_pago: string
  estado: 'completada' | 'anulada'
  created_at: string
}

export interface DetalleVenta {
  id_detalle_venta: number
  id_venta: number
  id_producto: number
  cantidad: number
  precio_unitario: number
  descuento: number
  subtotal: number
  nombre_producto?: string
}

export interface Usuario {
  id_usuario: number
  username: string
  nombre: string
  rol: 'administrador' | 'vendedor'
  estado: boolean
}

export interface Configuracion {
  clave: string
  valor: string | null
}
