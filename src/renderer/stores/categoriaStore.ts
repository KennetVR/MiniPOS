import { create } from 'zustand'
import { api, Categoria } from '../lib/api'

interface CategoriaState {
  categorias: Categoria[]
  loading: boolean
  error: string | null
  fetchCategorias: () => Promise<void>
  createCategoria: (data: { nombre: string; descripcion?: string }) => Promise<boolean>
  updateCategoria: (id: number, data: { nombre: string; descripcion?: string }) => Promise<boolean>
  deleteCategoria: (id: number) => Promise<boolean>
}

export const useCategoriaStore = create<CategoriaState>((set, get) => ({
  categorias: [],
  loading: false,
  error: null,

  fetchCategorias: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.categoria.getAll()
      if (response.success && response.data) {
        set({ categorias: response.data, loading: false })
      } else {
        set({ error: response.error || 'Error al cargar categorías', loading: false })
      }
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  },

  createCategoria: async (data) => {
    try {
      const response = await api.categoria.create(data)
      if (response.success) {
        await get().fetchCategorias()
        return true
      }
      set({ error: response.error || 'Error al crear categoría' })
      return false
    } catch (error) {
      set({ error: String(error) })
      return false
    }
  },

  updateCategoria: async (id, data) => {
    try {
      const response = await api.categoria.update(id, data)
      if (response.success) {
        await get().fetchCategorias()
        return true
      }
      set({ error: response.error || 'Error al actualizar categoría' })
      return false
    } catch (error) {
      set({ error: String(error) })
      return false
    }
  },

  deleteCategoria: async (id) => {
    try {
      const response = await api.categoria.delete(id)
      if (response.success) {
        await get().fetchCategorias()
        return true
      }
      set({ error: response.error || 'Error al eliminar categoría' })
      return false
    } catch (error) {
      set({ error: String(error) })
      return false
    }
  }
}))
