import { useState, useEffect } from 'react'
import { UserPlus, Edit2, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { api, Usuario } from '../lib/api'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null)

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    setLoading(true)
    const response = await api.usuario.getAll()
    if (response.success && response.data) {
      setUsuarios(response.data)
    }
    setLoading(false)
  }

  const handleToggleEstado = async (id: string) => {
    await api.usuario.toggleEstado(id)
    loadUsuarios()
  }

  const handleDelete = async (id: string) => {
    const usuario = usuarios.find(u => u.id_usuario === id)
    setDeleteTarget({ id, nombre: usuario?.nombre || 'este usuario' })
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      await api.usuario.delete(deleteTarget.id)
      loadUsuarios()
      setDeleteTarget(null)
    }
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario)
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  const handleSave = () => {
    setShowForm(false)
    setEditingUser(null)
    loadUsuarios()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Usuario</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rol</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Estado</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usuarios.map(usuario => (
              <tr key={usuario.id_usuario} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">{usuario.username}</td>
                <td className="px-4 py-3">{usuario.nombre}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    usuario.rol === 'administrador' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {usuario.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleEstado(usuario.id_usuario)}
                    className={`p-1 rounded ${usuario.estado ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {usuario.estado ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(usuario.id_usuario)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UsuarioForm
          usuario={editingUser}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Usuario"
        message={`¿Está seguro de eliminar al usuario "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function UsuarioForm({ usuario, onClose, onSave }: { usuario: Usuario | null; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    username: usuario?.username || '',
    password: '',
    nombre: usuario?.nombre || '',
    rol: (usuario?.rol || 'vendedor') as 'administrador' | 'vendedor'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (usuario) {
        const data: { nombre: string; rol: string; password?: string } = {
          nombre: formData.nombre,
          rol: formData.rol
        }
        if (formData.password) {
          data.password = formData.password
        }
        const response = await api.usuario.update(usuario.id_usuario, data)
        if (!response.success) {
          setError(response.error || 'No se pudo actualizar el usuario')
          setSaving(false)
          return
        }
      } else {
        if (!formData.password) {
          setError('La contraseña es obligatoria')
          setSaving(false)
          return
        }
        const response = await api.usuario.create({
          username: formData.username,
          password: formData.password,
          nombre: formData.nombre,
          rol: formData.rol
        })
        if (!response.success) {
          setError(response.error || 'No se pudo crear el usuario')
          setSaving(false)
          return
        }
      }
      onSave()
    } catch (err) {
      setError(String(err))
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!usuario}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {usuario ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={!usuario}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'administrador' | 'vendedor' })}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="vendedor">Vendedor</option>
              <option value="administrador">Administrador</option>
            </select>
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
