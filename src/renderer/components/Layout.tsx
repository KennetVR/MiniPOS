import { useState } from 'react'
import { User, Menu, Store, LayoutDashboard, ShoppingCart, Package, Users, Tags, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { ProductoForm } from './ProductoForm'
import { ConfirmDialog } from './ConfirmDialog'
import { ListaProductos } from '../pages/Productos'
import { POSPage } from '../pages/POS'
import { DashboardPage } from '../pages/Dashboard'
import { UsuariosPage } from '../pages/Usuarios'
import { ConfiguracionPage } from '../pages/Configuracion'

type Page = 'dashboard' | 'productos' | 'pos' | 'usuarios' | 'categorias' | 'configuracion'

interface LayoutProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export function Layout({ currentPage, onNavigate }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<number | null>(null)

  const handleNewProduct = () => {
    setEditingProduct(null)
    setShowProductForm(true)
  }

  const handleEditProduct = (id: number) => {
    setEditingProduct(id)
    setShowProductForm(true)
  }

  const handleSaveProduct = () => {
    setShowProductForm(false)
    setEditingProduct(null)
  }

  const pageTitle: Record<Page, string> = {
    dashboard: 'Resumen general',
    productos: 'Productos',
    pos: 'Punto de venta',
    usuarios: 'Usuarios',
    categorias: 'Categorías',
    configuracion: 'Configuración'
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'productos':
        return <ListaProductos onNewProduct={handleNewProduct} onEditProduct={handleEditProduct} />
      case 'pos':
        return <POSPage />
      case 'usuarios':
        return <UsuariosPage />
      case 'categorias':
        return <CategoriasPage />
      case 'configuracion':
        return <ConfiguracionPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className={`relative flex h-screen shrink-0 flex-col overflow-hidden bg-slate-900 text-white transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-950/30">
              <Store size={19} />
            </div>
            {!sidebarCollapsed && <h1 className="truncate text-lg font-bold tracking-tight">MiniPOS</h1>}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
            title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
            className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <div className="border-b border-white/10 px-4 py-5 text-center">
          {!sidebarCollapsed ? (
            <>
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-blue-200">
                {user?.nombre?.slice(0, 1).toUpperCase() || <User size={18} />}
              </div>
              <div className="truncate text-sm font-medium">{user?.nombre}</div>
              <span className="mt-1 inline-block rounded-full bg-white/10 px-2.5 py-1 text-[11px] capitalize text-slate-300">{user?.rol}</span>
            </>
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-blue-200">
              {user?.nombre?.slice(0, 1).toUpperCase() || <User size={18} />}
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${
              currentPage === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-950/20' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard size={19} className="shrink-0" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button
            onClick={() => onNavigate('pos')}
            className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${
              currentPage === 'pos' ? 'bg-blue-600 text-white shadow-md shadow-blue-950/20' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShoppingCart size={19} className="shrink-0" />
            {!sidebarCollapsed && <span>Punto de Venta</span>}
          </button>
          <button
            onClick={() => onNavigate('productos')}
            className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${
              currentPage === 'productos' ? 'bg-blue-600 text-white shadow-md shadow-blue-950/20' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Package size={19} className="shrink-0" />
            {!sidebarCollapsed && <span>Productos</span>}
          </button>
          {user?.rol === 'administrador' && (
            <>
              <button
                onClick={() => onNavigate('usuarios')}
                className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${
                  currentPage === 'usuarios' ? 'bg-blue-600 text-white shadow-md shadow-blue-950/20' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Users size={19} className="shrink-0" />
                {!sidebarCollapsed && <span>Usuarios</span>}
              </button>
              <button
                onClick={() => onNavigate('categorias')}
                className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${
                  currentPage === 'categorias' ? 'bg-blue-600 text-white shadow-md shadow-blue-950/20' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Tags size={19} className="shrink-0" />
                {!sidebarCollapsed && <span>Categorías</span>}
              </button>
              <button
                onClick={() => onNavigate('configuracion')}
                className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${
                  currentPage === 'configuracion' ? 'bg-blue-600 text-white shadow-md shadow-blue-950/20' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Settings size={19} className="shrink-0" />
                {!sidebarCollapsed && <span>Configuración</span>}
              </button>
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-white/10 p-3">
          <button 
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
          >
            <LogOut size={19} className="shrink-0" />
            {!sidebarCollapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto bg-slate-50">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">MiniPOS</p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{pageTitle[currentPage]}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium capitalize text-slate-600">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </header>
        <div className="mx-auto w-full max-w-screen-2xl p-5 md:p-8">
          {renderPage()}
        </div>
      </main>

      {showProductForm && (
        <ProductoForm
          producto={editingProduct}
          onClose={() => { setShowProductForm(false); setEditingProduct(null) }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  )
}

import { useState as useStateAlt, useEffect as useEffectAlt } from 'react'
import { Tag, Plus, Edit2, Trash2, X } from 'lucide-react'
import { api, Categoria } from '../lib/api'

function CategoriasPage() {
  const [categorias, setCategorias] = useStateAlt<Categoria[]>([])
  const [loading, setLoading] = useStateAlt(true)
  const [showForm, setShowForm] = useStateAlt(false)
  const [editingCategoria, setEditingCategoria] = useStateAlt<Categoria | null>(null)
  const [deleteTarget, setDeleteTarget] = useStateAlt<{ id: number; nombre: string } | null>(null)

  useEffectAlt(() => {
    loadCategorias()
  }, [])

  const loadCategorias = async () => {
    setLoading(true)
    const response = await api.categoria.getAll()
    if (response.success && response.data) {
      setCategorias(response.data)
    }
    setLoading(false)
  }

  const handleDelete = (id: number) => {
    const categoria = categorias.find(c => c.id_categoria === id)
    setDeleteTarget({ id, nombre: categoria?.nombre || 'esta categoría' })
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await api.categoria.delete(deleteTarget.id)
      loadCategorias()
      setDeleteTarget(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
        <button
          onClick={() => { setEditingCategoria(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus size={20} />
          Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map(categoria => (
          <div key={categoria.id_categoria} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="text-blue-600" size={20} />
              </div>
              <div>
                <div className="font-medium">{categoria.nombre}</div>
                {categoria.descripcion && (
                  <div className="text-sm text-gray-500">{categoria.descripcion}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingCategoria(categoria); setShowForm(true) }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDelete(categoria.id_categoria)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <CategoriaForm
          categoria={editingCategoria}
          onClose={() => { setShowForm(false); setEditingCategoria(null) }}
          onSave={() => { setShowForm(false); setEditingCategoria(null); loadCategorias() }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Categoría"
        message={`¿Está seguro de eliminar la categoría "${deleteTarget?.nombre}"? Los productos asociados quedarán sin categoría.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function CategoriaForm({ categoria, onClose, onSave }: { categoria: Categoria | null; onClose: () => void; onSave: () => void }) {
  const [nombre, setNombre] = useStateAlt(categoria?.nombre || '')
  const [descripcion, setDescripcion] = useStateAlt(categoria?.descripcion || '')
  const [saving, setSaving] = useStateAlt(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (categoria) {
      await api.categoria.update(categoria.id_categoria, { nombre, descripcion: descripcion || undefined })
    } else {
      await api.categoria.create({ nombre, descripcion: descripcion || undefined })
    }

    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
