import { create } from 'zustand'
import { api, Producto } from '../lib/api'

interface ProductoState {
  productos: Producto[]
  productosFiltrados: Producto[]
  loading: boolean
  error: string | null
  fetchProductos: () => Promise<void>
  searchProductos: (query: string) => Promise<void>
  getProductoByCodigo: (codigo: string) => Promise<Producto | null>
  createProducto: (data: Partial<Producto>) => Promise<boolean>
  updateProducto: (id: number, data: Partial<Producto>) => Promise<boolean>
  deleteProducto: (id: number) => Promise<boolean>
}

export const useProductoStore = create<ProductoState>((set, get) => ({
  productos: [],
  productosFiltrados: [],
  loading: false,
  error: null,

  fetchProductos: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.producto.getAll()
      if (response.success && response.data) {
        set({ productos: response.data, productosFiltrados: response.data, loading: false })
      } else {
        set({ error: response.error || 'Error al cargar productos', loading: false })
      }
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  },

  searchProductos: async (query: string) => {
    if (!query.trim()) {
      set({ productosFiltrados: get().productos })
      return
    }
    
    try {
      const response = await api.producto.search(query)
      if (response.success && response.data) {
        set({ productosFiltrados: response.data })
      }
    } catch (error) {
      console.error('Error en búsqueda:', error)
    }
  },

  getProductoByCodigo: async (codigo: string) => {
    try {
      const response = await api.producto.getByCodigoBarras(codigo)
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch (error) {
      console.error('Error al buscar por código:', error)
      return null
    }
  },

  createProducto: async (data) => {
    try {
      const response = await api.producto.create(data)
      if (response.success) {
        await get().fetchProductos()
        return true
      }
      set({ error: response.error || 'Error al crear producto' })
      return false
    } catch (error) {
      set({ error: String(error) })
      return false
    }
  },

  updateProducto: async (id, data) => {
    try {
      const response = await api.producto.update(id, data)
      if (response.success) {
        await get().fetchProductos()
        return true
      }
      set({ error: response.error || 'Error al actualizar producto' })
      return false
    } catch (error) {
      set({ error: String(error) })
      return false
    }
  },

  deleteProducto: async (id) => {
    try {
      const response = await api.producto.delete(id)
      if (response.success) {
        await get().fetchProductos()
        return true
      }
      set({ error: response.error || 'Error al eliminar producto' })
      return false
    } catch (error) {
      set({ error: String(error) })
      return false
    }
  }
}))
