export interface Categoria {
  id_categoria: number
  nombre: string
  descripcion: string | null
  estado: boolean
  created_at: string
  updated_at: string
}

export interface Proveedor {
  id_proveedor: number
  nombre: string
  ruc: string | null
  telefono: string | null
  direccion: string | null
  email: string | null
  estado: boolean
  created_at: string
  updated_at: string
}

export interface Usuario {
  id_usuario: number
  username: string
  password?: string
  nombre: string
  rol: 'administrador' | 'vendedor'
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
  imagen: Buffer | null
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
  motivo_anulacion: string | null
  fecha_anulacion: string | null
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
}

export interface Ingreso {
  id_ingreso: number
  fecha: string
  concepto: string
  monto: number
  forma_pago: string | null
  referencia: string | null
  id_venta: number | null
  id_usuario: number
  created_at: string
}

export interface Egreso {
  id_egreso: number
  fecha: string
  tipo: 'compra' | 'servicio' | 'sueldo' | 'mantenimiento' | 'otro'
  concepto: string
  monto: number
  comprobante: string | null
  beneficiario: string | null
  id_proveedor: number | null
  id_usuario: number
  created_at: string
}

export interface EntradaInventario {
  id_entrada: number
  id_proveedor: number
  fecha_compra: string
  numero_comprobante: string | null
  total: number
  estado: string
  id_usuario: number
  created_at: string
}

export interface MovimientoStock {
  id_movimiento: number
  id_producto: number
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  motivo: string | null
  referencia: string | null
  id_usuario: number
  created_at: string
}

export interface Configuracion {
  clave: string
  valor: string | null
  descripcion: string | null
  updated_at: string
}

export interface Auditoria {
  id_auditoria: number
  id_usuario: number | null
  accion: string
  tabla: string
  registro_id: number | null
  datos_anteriores: string | null
  datos_nuevos: string | null
  ip_address: string | null
  created_at: string
}

export interface ProductoWithCategoria extends Producto {
  categoria_nombre?: string
}

export interface VentaWithDetails extends Venta {
  usuario_nombre?: string
  detalles?: DetalleVenta[]
}

export interface DashboardStats {
  ventas_dia: number
  ventas_mes: number
  ganancias_dia: number
  margen_ganancia: number
  productos_bajo_stock: number
  ticket_promedio: number
}
