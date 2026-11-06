export type Role = 'administrador' | 'vendedor'

export interface UserSession {
  id_usuario: string
  username: string
  nombre: string
  rol: Role
}

export interface UserProfile extends UserSession {
  estado: boolean
  created_at: string
}

export interface Category {
  id_categoria: number
  nombre: string
  descripcion: string | null
  estado: boolean
}

export interface Product {
  id_producto: number
  codigo_barras: string | null
  nombre: string
  descripcion: string | null
  id_categoria: number
  categoria_nombre?: string
  precio_compra: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  id_proveedor: number | null
  proveedor_nombre?: string
  estado: boolean
  created_at: string
  updated_at: string
}

export interface ReceiptLine {
  id_producto: number
  nombre: string
  codigo_barras: string | null
  cantidad: number
  precio_compra: number
}

export interface SaleLine {
  id_producto: number
  nombre: string
  precio_venta: number
  cantidad: number
  descuento: number
}

export interface SaleSummary {
  id: number
  numero_boleta: string
  fecha: string
  total: number
  estado: 'completada' | 'anulada'
}

export interface DashboardSummary {
  productCount: number
  lowStockCount: number
  todaySales: number
  todayRevenue: number
  recentSales: SaleSummary[]
}

export interface AppSetting {
  clave: string
  valor: string
  descripcion: string | null
}

export interface NewProductInput {
  id_categoria: number
  codigo_barras: string
  nombre: string
  descripcion: string
  precio_compra: number
  precio_venta: number
  stock_minimo: number
  id_proveedor: number | null
  stock_inicial: number
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
