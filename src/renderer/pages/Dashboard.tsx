import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Package, AlertTriangle, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { api, DashboardStats, VentasPorDia, ProductoMasVendido, VentasPorCategoria } from '../lib/api'
import { formatCurrency } from '../lib/utils'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [ventasPorDia, setVentasPorDia] = useState<VentasPorDia[]>([])
  const [productosMasVendidos, setProductosMasVendidos] = useState<ProductoMasVendido[]>([])
  const [ventasPorCategoria, setVentasPorCategoria] = useState<VentasPorCategoria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, ventasRes, productosRes, categoriaRes] = await Promise.all([
        api.reporte.getDashboard(),
        api.reporte.getVentasPorDia(7),
        api.reporte.getProductosMasVendidos(5),
        api.reporte.getVentasPorCategoria()
      ])

      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      if (ventasRes.success && ventasRes.data) setVentasPorDia(ventasRes.data)
      if (productosRes.success && productosRes.data) setProductosMasVendidos(productosRes.data)
      if (categoriaRes.success && categoriaRes.data) setVentasPorCategoria(categoriaRes.data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const ventasData = ventasPorDia.map(v => ({
    ...v,
    fecha: new Date(v.fecha).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' })
  }))

  return (
      <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tu negocio hoy</h1>
          <p className="mt-1 text-sm text-slate-500">Un resumen rápido del rendimiento y la operación.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <BarChart3 size={18} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ventas del Día"
          value={formatCurrency(stats?.ventas_dia || 0)}
          subtitle={`${stats?.ventas_dia_cantidad || 0} ventas`}
          icon={<DollarSign size={24} />}
          color="green"
        />
        <StatCard
          title="Ventas del Mes"
          value={formatCurrency(stats?.ventas_mes || 0)}
          subtitle={`${stats?.ventas_mes_cantidad || 0} ventas`}
          icon={<TrendingUp size={24} />}
          color="blue"
        />
        <StatCard
          title="Ticket Promedio"
          value={formatCurrency(stats?.ticket_promedio || 0)}
          subtitle="Por venta"
          icon={<ShoppingCart size={24} />}
          color="purple"
        />
        <StatCard
          title="Productos Bajo Stock"
          value={String(stats?.productos_bajo_stock || 0)}
          subtitle="Requieren atención"
          icon={<AlertTriangle size={24} />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Ventas de los últimos 7 días</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#3B82F6" name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Ventas por categoría</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ventasPorCategoria}
                  dataKey="total"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ categoria, percent }) => `${categoria} ${(percent * 100).toFixed(0)}%`}
                >
                  {ventasPorCategoria.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Productos más vendidos</h2>
          {productosMasVendidos.length > 0 ? (
            <div className="space-y-3">
              {productosMasVendidos.map((producto, index) => (
                <div key={producto.id_producto} className="flex items-center justify-between rounded-lg bg-slate-50 p-3.5 transition-colors hover:bg-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{producto.nombre}</div>
                      <div className="text-sm text-gray-500">{producto.cantidad_vendida} unidades</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(producto.total_vendido)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos de ventas</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Indicadores del día</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-green-600" size={24} />
                <span className="font-medium">Ganancias del Día</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(stats?.ganancias_dia || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-center gap-3">
                <Package className="text-blue-600" size={24} />
                <span className="font-medium">Productos Vendidos</span>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {stats?.productos_vendidos_dia || 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-violet-100 bg-violet-50/70 p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-purple-600" size={24} />
                <span className="font-medium">Margen de Ganancia</span>
              </div>
              <span className="text-xl font-bold text-purple-600">
                {stats?.margen_ganancia || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, color }: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: 'green' | 'blue' | 'purple' | 'red'
}) {
  const colorClasses = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100 border-l-emerald-500',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100 border-l-blue-500',
    purple: 'bg-violet-50 text-violet-700 ring-violet-100 border-l-violet-500',
    red: 'bg-rose-50 text-rose-700 ring-rose-100 border-l-rose-500'
  }

  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:p-6 ${colorClasses[color].split(' ').find(cls => cls.startsWith('border-l-'))}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-3 ring-1 ring-inset ${colorClasses[color].split(' ').filter(cls => !cls.startsWith('border-l-')).join(' ')}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
