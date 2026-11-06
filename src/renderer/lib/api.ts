import type { ApiType } from '../../preload/index'
import { supabaseClient } from './supabase-client'
import { createSupabaseApi } from './supabase-api'

declare global {
  interface Window {
    api: ApiType
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function invoke<T>(channel: string, ...args: unknown[]): Promise<ApiResponse<T>> {
  if (!window.api) {
    console.error('✗ window.api no está disponible')
    console.error('window:', window)
    throw new Error('API no disponible. El preload script no se cargó correctamente.')
  }

  if (!window.api.invoke) {
    console.error('✗ window.api.invoke no existe')
    throw new Error('API.invoke no disponible')
  }

  try {
    const result = await window.api.invoke(channel, ...args)
    return result as ApiResponse<T>
  } catch (error) {
    console.error(`Error en IPC call [${channel}]:`, error)
    throw error
  }
}

const supabaseApi = createSupabaseApi(supabaseClient)

export const api = {
  auth: supabaseApi.auth,
  usuario: supabaseApi.usuario,
  categoria: supabaseApi.categoria,
  producto: supabaseApi.producto,
  venta: supabaseApi.venta,
  reporte: supabaseApi.reporte,
  impresion: {
    printTicket: (data: BoletaData) => invoke<void>('impresion:printTicket', data),
    getBoleta: supabaseApi.impresion.getBoleta,
    getPrinters: () => invoke<Printer[]>('impresion:getPrinters')
  },
  configuracion: {
    ...supabaseApi.configuracion
  },
  egreso: supabaseApi.egreso,
  ingreso: supabaseApi.ingreso
}

export interface UsuarioSession {
  id_usuario: string
  username: string
  nombre: string
  rol: 'administrador' | 'vendedor'
}

export interface Usuario {
  id_usuario: string
  username: string
  nombre: string
  rol: 'administrador' | 'vendedor'
  estado: number
  created_at: string
}

export interface Categoria {
  id_categoria: number
  nombre: string
  descripcion: string | null
  estado: number
  created_at: string
  updated_at: string
}

export interface Producto {
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
  estado: number
  created_at: string
  updated_at: string
}

export interface Venta {
  id_venta: number
  numero_boleta: string
  id_usuario: string
  subtotal: number
  descuento: number
  igv: number
  total: number
  forma_pago: string
  estado: 'completada' | 'anulada'
  motivo_anulacion: string | null
  fecha_anulacion: string | null
  created_at: string
  usuario_nombre?: string
}

export interface DetalleVenta {
  id_detalle_venta: number
  id_venta: number
  id_producto: number
  cantidad: number
  precio_unitario: number
  descuento: number
  subtotal: number
  producto_nombre?: string
  codigo_barras?: string
}

export interface VentaConDetalles extends Venta {
  detalles: DetalleVenta[]
}

export interface CrearVentaData {
  id_usuario: string
  detalles: {
    id_producto: number
    cantidad: number
    precio_unitario: number
    descuento?: number
  }[]
  forma_pago: string
  descuento?: number
}

export interface EstadisticasVentas {
  cantidad_ventas: number
  total_ventas: number
  productos_vendidos: number
  ticket_promedio: number
}

export interface CarritoItem {
  producto: Producto
  cantidad: number
  descuento: number
}

export interface DashboardStats {
  ventas_dia: number
  ventas_dia_cantidad: number
  ventas_mes: number
  ventas_mes_cantidad: number
  ganancias_dia: number
  productos_vendidos_dia: number
  productos_bajo_stock: number
  ticket_promedio: number
  margen_ganancia: number
}

export interface VentasPorHora {
  hora: string
  cantidad: number
  total: number
}

export interface VentasPorDia {
  fecha: string
  cantidad: number
  total: number
}

export interface ProductoMasVendido {
  id_producto: number
  nombre: string
  codigo_barras: string | null
  cantidad_vendida: number
  total_vendido: number
}

export interface VentasPorCategoria {
  categoria: string
  cantidad: number
  total: number
}

export interface VentasPorFormaPago {
  forma_pago: string
  cantidad: number
  total: number
}

export interface EstadoResultados {
  total_ingresos: number
  egresos_por_tipo: { tipo: string; total: number }[]
  total_egresos: number
  ganancia_neta: number
}

export interface FlujoCajaItem {
  id: number
  fecha: string
  concepto: string
  monto: number
  tipo: 'ingreso' | 'egreso'
}

export interface BoletaData {
  venta: Venta
  detalles: DetalleVenta[]
  config: Record<string, string>
}

export interface Printer {
  name: string
  displayName: string
  description: string
  status: string
  isDefault: boolean
}

export interface Configuracion {
  clave: string
  valor: string | null
  descripcion: string | null
  updated_at: string
}

export interface Egreso {
  id_egreso: number
  fecha: string
  tipo: string
  concepto: string
  monto: number
  comprobante: string | null
  beneficiario: string | null
  id_proveedor: number | null
  id_usuario: string
  usuario_nombre?: string
  proveedor_nombre?: string
  created_at: string
}

export interface Ingreso {
  id_ingreso: number
  fecha: string
  concepto: string
  monto: number
  forma_pago: string | null
  referencia: string | null
  id_venta: number | null
  id_usuario: string
  usuario_nombre?: string
  created_at: string
}
