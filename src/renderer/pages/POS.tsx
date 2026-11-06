import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag, Check, Printer, X, Percent } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useProductoStore } from '../stores/productoStore'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { toast } from '../components/Toast'
import type { Producto } from '../lib/api'

export function POSPage() {
  const { user } = useAuthStore()
  const { productos, fetchProductos, getProductoByCodigo } = useProductoStore()
  const { items, addItem, updateCantidad, removeItem, formaPago, setFormaPago, getSubtotal, getDescuentoTotal, getTotal, procesarVenta, clearCart } = useCartStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Producto[]>([])
  const [procesando, setProcesando] = useState(false)
  const [ventaExitosa, setVentaExitosa] = useState<{ numero: string; idVenta: number; total: number } | null>(null)
  const [imprimiendo, setImprimiendo] = useState(false)
  const [showDescuento, setShowDescuento] = useState(false)
  const [descuentoGlobal, setDescuentoGlobal] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProductos()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const results = productos.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo_barras?.includes(searchTerm)
      ).slice(0, 10)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchTerm, productos])

  const handleAddProduct = useCallback((producto: Producto) => {
    if (producto.stock_actual <= 0) {
      toast('Producto sin stock disponible', 'warning')
      return
    }
    addItem(producto)
    setSearchTerm('')
    setSearchResults([])
    toast(`${producto.nombre} agregado`, 'success')
    searchInputRef.current?.focus()
  }, [addItem])

  const handleBuscarPorCodigo = useCallback(async (codigo: string) => {
    const producto = await getProductoByCodigo(codigo)
    if (producto) {
      handleAddProduct(producto)
    } else {
      toast('Producto no encontrado', 'error')
    }
    setSearchTerm('')
  }, [getProductoByCodigo, handleAddProduct])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const producto = productos.find(p => 
        p.codigo_barras === searchTerm || 
        p.nombre.toLowerCase() === searchTerm.toLowerCase()
      )
      if (producto) {
        handleAddProduct(producto)
      } else {
        handleBuscarPorCodigo(searchTerm)
      }
    }
  }, [searchTerm, productos, handleAddProduct, handleBuscarPorCodigo])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isAuthenticated) return
      
      if (e.key === 'F1') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'F2') {
        e.preventDefault()
        setShowDescuento(true)
      } else if (e.key === 'Escape') {
        if (ventaExitosa) {
          setVentaExitosa(null)
        } else if (showDescuento) {
          setShowDescuento(false)
        } else if (items.length > 0) {
          if (confirm('¿Cancelar la venta actual?')) {
            clearCart()
            toast('Venta cancelada', 'info')
          }
        }
      } else if (e.key === 'F5' && items.length > 0) {
        e.preventDefault()
        handleCobrar()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [items.length, ventaExitosa, showDescuento, clearCart])

  const handleCobrar = async () => {
    if (items.length === 0) {
      toast('Agrega productos al carrito', 'warning')
      return
    }
    
    setProcesando(true)
    
  const resultado = await procesarVenta(user!.id_usuario)
    
    setProcesando(false)
    
    if (resultado.success) {
      setVentaExitosa({ 
        numero: resultado.numero_boleta!, 
        idVenta: resultado.idVenta!,
        total: resultado.total!
      })
      toast('¡Venta procesada exitosamente!', 'success')
    } else {
      toast(resultado.error || 'Error al procesar venta', 'error')
    }
  }

  const handleImprimir = async () => {
    if (!ventaExitosa?.idVenta) return
    
    setImprimiendo(true)
    try {
      const receipt = await api.impresion.getBoleta(ventaExitosa.idVenta)
      if (!receipt.success || !receipt.data) {
        toast(receipt.error || 'No se pudo cargar la boleta', 'error')
        return
      }
      const printed = await api.impresion.printTicket(receipt.data)
      if (!printed.success) {
        toast(printed.error || 'Error al imprimir boleta', 'error')
        return
      }
      toast('Boleta enviada a imprimir', 'success')
    } catch (err) {
      toast('Error al imprimir boleta', 'error')
    } finally {
      setImprimiendo(false)
    }
  }

  const handleNuevaVenta = () => {
    setVentaExitosa(null)
    setDescuentoGlobal(0)
  }

  const aplicarDescuento = () => {
    if (descuentoGlobal > getSubtotal() * 0.5) {
      toast('El descuento no puede exceder el 50%', 'warning')
      return
    }
    useCartStore.getState().setDescuentoGlobal(descuentoGlobal)
    setShowDescuento(false)
    toast(`Descuento de ${formatCurrency(descuentoGlobal)} aplicado`, 'success')
  }

  if (ventaExitosa) {
    return (
      <div className="mx-auto w-full max-w-lg py-6 sm:py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-100 bg-green-50">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">¡Venta Exitosa!</h2>
          <p className="mb-2 text-sm text-slate-500">Boleta N° {ventaExitosa.numero}</p>
          <p className="mb-6 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{formatCurrency(ventaExitosa.total)}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleImprimir}
              disabled={imprimiendo}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {imprimiendo ? (
                <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> Imprimiendo...</>
              ) : (
                <><Printer size={20} /> Imprimir Boleta</>
              )}
            </button>
            <button
              onClick={handleNuevaVenta}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Nueva Venta (F5)
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:gap-6">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar producto o escanear código de barras... (F1)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-base"
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {searchResults.map(p => (
                    <button
                      key={p.id_producto}
                      onClick={() => handleAddProduct(p)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="break-words text-sm font-medium text-slate-900">{p.nombre}</div>
                        <div className="break-all text-xs text-slate-500">{p.codigo_barras || 'Sin código'}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(p.precio_venta)}</div>
                        <div className={`text-xs ${p.stock_actual <= p.stock_minimo ? 'text-red-600' : 'text-slate-500'}`}>
                          Stock: {p.stock_actual}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDescuento(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              title="Aplicar descuento (F2)"
            >
              <Percent size={20} />
            </button>
          </div>
        </div>

        <div className="min-w-0 max-h-[60vh] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm xl:max-h-[calc(100vh-16rem)]">
          {items.length === 0 ? (
            <div className="flex min-h-[18rem] flex-col items-center justify-center px-6 py-10 text-center sm:min-h-[20rem]">
              <ShoppingBag size={64} className="mb-5 rounded-2xl bg-slate-50 p-3 text-slate-400" />
              <p className="text-base font-medium text-slate-700">Escanea o busca un producto para agregar</p>
              <p className="mt-2 text-sm text-slate-500">Presiona F1 para enfocar la búsqueda</p>
            </div>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Producto</th>
                  <th className="w-40 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Cantidad</th>
                  <th className="w-28 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">P. Unit.</th>
                  <th className="w-28 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.producto.id_producto} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="max-w-xs break-words font-medium text-slate-900">{item.producto.nombre}</div>
                      <div className="mt-1 max-w-xs break-all text-xs text-slate-500">{item.producto.codigo_barras || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateCantidad(item.producto.id_producto, item.cantidad - 1)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => updateCantidad(item.producto.id_producto, parseInt(e.target.value) || 1)}
                          className="w-16 rounded-lg border border-slate-300 bg-white py-2 text-center tabular-nums text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          min={1}
                          max={item.producto.stock_actual}
                        />
                        <button
                          onClick={() => updateCantidad(item.producto.id_producto, item.cantidad + 1)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={item.cantidad >= item.producto.stock_actual}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-500">{formatCurrency(item.producto.precio_venta)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {formatCurrency(item.producto.precio_venta * item.cantidad)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeItem(item.producto.id_producto)}
                        className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-5 text-base font-semibold tracking-tight text-slate-900">Resumen</h3>
          
          <div className="mb-6 space-y-3 text-sm tabular-nums">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-700">{formatCurrency(getSubtotal())}</span>
            </div>
            {getDescuentoTotal() > 0 && (
              <div className="flex justify-between gap-3 text-red-600">
                <span>Descuentos</span>
                <span>-{formatCurrency(getDescuentoTotal())}</span>
              </div>
            )}
            <div className="flex justify-between gap-3 text-slate-500">
              <span>IGV (18%)</span>
              <span>{formatCurrency((getSubtotal() - getDescuentoTotal()) * 0.18)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-slate-200 pt-4 text-xl font-semibold tracking-tight text-slate-900">
              <span>Total</span>
              <span className="text-2xl text-blue-700">{formatCurrency(getTotal())}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCobrar}
              disabled={items.length === 0 || procesando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
            >
              {procesando ? (
                <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> Procesando...</>
              ) : (
                <><Banknote size={24} /> Cobrar (F5)</>
              )}
            </button>
            <button
              onClick={() => {
                if (confirm('¿Cancelar la venta actual?')) {
                  clearCart()
                  toast('Venta cancelada', 'info')
                }
              }}
              disabled={items.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar (Esc)
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-sm font-semibold text-slate-900">Forma de Pago</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'Efectivo', icon: Banknote },
              { key: 'Tarjeta Débito', icon: CreditCard },
              { key: 'Tarjeta Crédito', icon: CreditCard },
              { key: 'Yape/Plin', icon: Smartphone }
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFormaPago(key)}
                className={`flex min-w-0 items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  formaPago === key 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-500">
          <p><strong>Atajos:</strong></p>
          <p>F1 - Buscar producto</p>
          <p>F2 - Descuento</p>
          <p>F5 - Cobrar</p>
          <p>Esc - Cancelar</p>
        </div>
      </div>

      {showDescuento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold tracking-tight text-slate-900">Aplicar Descuento Global</h3>
              <button onClick={() => setShowDescuento(false)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Monto de descuento (S/)</label>
                <input
                  type="number"
                  value={descuentoGlobal}
                  onChange={(e) => setDescuentoGlobal(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 tabular-nums text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  min={0}
                  max={getSubtotal() * 0.5}
                />
                <p className="mt-2 text-xs text-slate-500">Máximo: {formatCurrency(getSubtotal() * 0.5)} (50%)</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDescuento(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={aplicarDescuento}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function isAuthenticated() {
  return useAuthStore.getState().isAuthenticated
}
