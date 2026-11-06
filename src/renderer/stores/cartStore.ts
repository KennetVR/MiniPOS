import { create } from 'zustand'
import { api, CarritoItem, Producto, CrearVentaData } from '../lib/api'

interface VentaResult {
  id_venta: number
  numero_boleta: string
  total: number
}

interface CartState {
  items: CarritoItem[]
  formaPago: string
  descuentoGlobal: number
  lastVentaId: number | null
  lastBoleta: string | null
  addItem: (producto: Producto) => void
  removeItem: (idProducto: number) => void
  updateCantidad: (idProducto: number, cantidad: number) => void
  updateDescuento: (idProducto: number, descuento: number) => void
  setFormaPago: (forma: string) => void
  setDescuentoGlobal: (descuento: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getDescuentoTotal: () => number
  getTotal: () => number
  procesarVenta: (idUsuario: string) => Promise<{ success: boolean; numero_boleta?: string; idVenta?: number; total?: number; error?: string }>
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  formaPago: 'Efectivo',
  descuentoGlobal: 0,
  lastVentaId: null,
  lastBoleta: null,

  addItem: (producto) => {
    const items = get().items
    const existente = items.find(i => i.producto.id_producto === producto.id_producto)
    
    if (existente) {
      set({
        items: items.map(i => 
          i.producto.id_producto === producto.id_producto 
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      })
    } else {
      set({ items: [...items, { producto, cantidad: 1, descuento: 0 }] })
    }
  },

  removeItem: (idProducto) => {
    set({ items: get().items.filter(i => i.producto.id_producto !== idProducto) })
  },

  updateCantidad: (idProducto, cantidad) => {
    if (cantidad <= 0) {
      get().removeItem(idProducto)
      return
    }
    set({
      items: get().items.map(i =>
        i.producto.id_producto === idProducto ? { ...i, cantidad } : i
      )
    })
  },

  updateDescuento: (idProducto, descuento) => {
    set({
      items: get().items.map(i =>
        i.producto.id_producto === idProducto ? { ...i, descuento } : i
      )
    })
  },

  setFormaPago: (forma) => set({ formaPago: forma }),

  setDescuentoGlobal: (descuento) => set({ descuentoGlobal: descuento }),

  clearCart: () => set({ items: [], formaPago: 'Efectivo', descuentoGlobal: 0 }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      return sum + (item.producto.precio_venta * item.cantidad)
    }, 0)
  },

  getDescuentoTotal: () => {
    const descuentoItems = get().items.reduce((sum, item) => sum + item.descuento, 0)
    const descuentoGlobal = get().descuentoGlobal
    return descuentoItems + descuentoGlobal
  },

  getTotal: () => {
    const subtotal = get().getSubtotal()
    const descuentos = get().getDescuentoTotal()
    const subtotalConDescuento = subtotal - descuentos
    const igv = subtotalConDescuento * 0.18
    return subtotalConDescuento + igv
  },

  procesarVenta: async (idUsuario) => {
    const { items, formaPago, descuentoGlobal, clearCart } = get()
    
    if (items.length === 0) {
      return { success: false, error: 'No hay productos en el carrito' }
    }

    const detalles = items.map(item => ({
      id_producto: item.producto.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.producto.precio_venta,
      descuento: item.descuento
    }))

    const data: CrearVentaData = {
      id_usuario: idUsuario,
      detalles,
      forma_pago: formaPago,
      descuento: descuentoGlobal
    }

    try {
      const response = await api.venta.crear(data)
      if (response.success && response.data) {
        const result = response.data as VentaResult
        set({ lastVentaId: result.id_venta, lastBoleta: result.numero_boleta })
        clearCart()
        return { 
          success: true, 
          numero_boleta: result.numero_boleta,
          idVenta: result.id_venta,
          total: result.total
        }
      }
      return { success: false, error: response.error || 'Error al procesar venta' }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}))
