import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCategoriaStore } from '../stores/categoriaStore'
import { useProductoStore } from '../stores/productoStore'
import type { Categoria, Producto } from '../lib/api'

interface ProductoFormProps {
  producto?: number | null
  onClose: () => void
  onSave: () => void
}

export function ProductoForm({ producto, onClose, onSave }: ProductoFormProps) {
  const { categorias, fetchCategorias } = useCategoriaStore()
  const { createProducto, updateProducto, productos } = useProductoStore()

  const existingProduct = producto ? productos.find(p => p.id_producto === producto) : null

  const [formData, setFormData] = useState({
    codigo_barras: '',
    nombre: '',
    descripcion: '',
    id_categoria: 0,
    precio_compra: '',
    precio_venta: '',
    stock_actual: '',
    stock_minimo: '5'
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategorias()
  }, [])

  useEffect(() => {
    if (existingProduct) {
      setFormData({
        codigo_barras: existingProduct.codigo_barras || '',
        nombre: existingProduct.nombre,
        descripcion: existingProduct.descripcion || '',
        id_categoria: existingProduct.id_categoria,
        precio_compra: String(existingProduct.precio_compra),
        precio_venta: String(existingProduct.precio_venta),
        stock_actual: String(existingProduct.stock_actual),
        stock_minimo: String(existingProduct.stock_minimo)
      })
    }
  }, [existingProduct])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const data: Partial<Producto> = {
      codigo_barras: formData.codigo_barras || undefined,
      nombre: formData.nombre,
      descripcion: formData.descripcion || undefined,
      id_categoria: Number(formData.id_categoria),
      precio_compra: Number(formData.precio_compra),
      precio_venta: Number(formData.precio_venta),
      stock_minimo: Number(formData.stock_minimo) || 5
    }

    if (!producto) {
      data.stock_actual = Number(formData.stock_actual) || 0
    }

    let success: boolean
    if (producto) {
      success = await updateProducto(producto, data)
    } else {
      success = await createProducto(data)
    }

    setSaving(false)
    if (success) {
      onSave()
    } else {
      setError('Error al guardar el producto')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
              <input
                type="text"
                value={formData.codigo_barras}
                onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 7891234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select
                value={formData.id_categoria}
                onChange={(e) => setFormData({ ...formData, id_categoria: Number(e.target.value) })}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Seleccionar...</option>
                {categorias.map((cat: Categoria) => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Compra *</label>
              <input
                type="number"
                step="0.01"
                value={formData.precio_compra}
                onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta *</label>
              <input
                type="number"
                step="0.01"
                value={formData.precio_venta}
                onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {producto ? 'Stock Actual (solo lectura)' : 'Stock Inicial'}
              </label>
              <input
                type="number"
                value={formData.stock_actual}
                onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                disabled={Boolean(producto)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input
                type="number"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
