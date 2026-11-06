import { useState, useEffect } from 'react'
import { Save, Building, FileText, Percent, DollarSign } from 'lucide-react'
import { api, Configuracion } from '../lib/api'

export function ConfiguracionPage() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    const response = await api.configuracion.getAll()
    if (response.success && response.data) {
      const configMap: Record<string, string> = {}
      response.data.forEach((c: Configuracion) => {
        configMap[c.clave] = c.valor || ''
      })
      setConfig(configMap)
    }
    setLoading(false)
  }

  const handleChange = (clave: string, valor: string) => {
    setConfig({ ...config, [clave]: valor })
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const configs = Object.entries(config).map(([clave, valor]) => ({ clave, valor }))
    await api.configuracion.updateMultiple(configs)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {saved && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg">
          ¡Configuración guardada correctamente!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold">Datos del Negocio</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio</label>
              <input
                type="text"
                value={config.nombre_negocio || ''}
                onChange={(e) => handleChange('nombre_negocio', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
              <input
                type="text"
                value={config.ruc || ''}
                onChange={(e) => handleChange('ruc', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={11}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={config.direccion || ''}
                onChange={(e) => handleChange('direccion', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={config.telefono || ''}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold">Configuración de Boleta</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de Agradecimiento</label>
              <input
                type="text"
                value={config.mensaje_boleta || ''}
                onChange={(e) => handleChange('mensaje_boleta', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Símbolo de Moneda</label>
              <input
                type="text"
                value={config.moneda || ''}
                onChange={(e) => handleChange('moneda', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Moneda</label>
              <input
                type="text"
                value={config.nombre_moneda || ''}
                onChange={(e) => handleChange('nombre_moneda', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold">Impuestos y Descuentos</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IGV (%)</label>
              <input
                type="number"
                value={config.igv_porcentaje || '18'}
                onChange={(e) => handleChange('igv_porcentaje', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
              <input
                type="number"
                value={config.iva_porcentaje || '0'}
                onChange={(e) => handleChange('iva_porcentaje', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descuento Máximo (%)</label>
              <input
                type="number"
                value={config.max_descuento || '50'}
                onChange={(e) => handleChange('max_descuento', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                max={100}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold">Inventario</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo por Defecto</label>
              <input
                type="number"
                value={config.stock_minimo_default || '5'}
                onChange={(e) => handleChange('stock_minimo_default', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decimales en Precios</label>
              <input
                type="number"
                value={config.decimales || '2'}
                onChange={(e) => handleChange('decimales', e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                max={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
