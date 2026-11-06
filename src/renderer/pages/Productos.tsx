import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { useProductoStore } from '../stores/productoStore'
import { formatCurrency } from '../lib/utils'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface ListaProductosProps {
  onNewProduct: () => void
  onEditProduct: (id: number) => void
}

export function ListaProductos({ onNewProduct, onEditProduct }: ListaProductosProps) {
  const { productosFiltrados, loading, fetchProductos, searchProductos, deleteProducto } = useProductoStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nombre: string } | null>(null)

  useEffect(() => {
    fetchProductos()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    searchProductos(value)
  }

  const handleDelete = (id: number) => {
    const producto = productosFiltrados.find(p => p.id_producto === id)
    setDeleteTarget({ id, nombre: producto?.nombre || 'este producto' })
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteProducto(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Lista de Productos</h1>
        <button
          onClick={onNewProduct}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Código</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Producto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Categoría</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">P. Compra</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">P. Venta</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Stock</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {productosFiltrados.map((producto) => (
              <tr key={producto.id_producto} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono">{producto.codigo_barras || '-'}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{producto.nombre}</div>
                  {producto.descripcion && <div className="text-xs text-gray-500">{producto.descripcion}</div>}
                </td>
                <td className="px-4 py-3 text-sm">{producto.categoria_nombre}</td>
                <td className="px-4 py-3 text-sm text-right">{formatCurrency(producto.precio_compra)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{formatCurrency(producto.precio_venta)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-flex items-center gap-1 ${producto.stock_actual <= producto.stock_minimo ? 'text-red-600' : 'text-gray-600'}`}>
                    {producto.stock_actual <= producto.stock_minimo && <AlertTriangle size={14} />}
                    {producto.stock_actual}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => onEditProduct(producto.id_producto)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(producto.id_producto)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron productos
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Producto"
        message={`¿Está seguro de eliminar el producto "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
