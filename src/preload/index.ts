const { contextBridge, ipcRenderer } = require('electron')

const allowedChannels = new Set([
  'auth:login',
  'auth:verifySession',
  'auth:changePassword',
  'usuario:getAll',
  'usuario:create',
  'usuario:update',
  'usuario:toggleEstado',
  'categoria:getAll',
  'categoria:getById',
  'categoria:create',
  'categoria:update',
  'categoria:delete',
  'producto:getAll',
  'producto:getById',
  'producto:getByCodigoBarras',
  'producto:search',
  'producto:create',
  'producto:update',
  'producto:delete',
  'producto:getBajoStock',
  'venta:crear',
  'venta:getAll',
  'venta:getById',
  'venta:anular',
  'venta:getEstadisticas',
  'reporte:getDashboard',
  'reporte:getVentasPorHora',
  'reporte:getVentasPorDia',
  'reporte:getProductosMasVendidos',
  'reporte:getVentasPorCategoria',
  'reporte:getVentasPorFormaPago',
  'reporte:getEstadoResultados',
  'reporte:getFlujoCaja',
  'impresion:printTicket',
  'impresion:getBoleta',
  'impresion:getPrinters',
  'configuracion:getAll',
  'configuracion:get',
  'configuracion:update',
  'configuracion:updateMultiple',
  'egreso:getAll',
  'egreso:create',
  'ingreso:getAll',
  'sync:getPending',
  'sync:markSynced',
  'sync:markFailed',
  'sync:getStats',
  'sync:pullCatalog'
])

// Define la API que se expondrá a la ventana
const api = {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (!channel) {
      return Promise.reject(new Error('Channel is required'))
    }
    if (!allowedChannels.has(channel)) {
      return Promise.reject(new Error(`Unsupported IPC channel: ${channel}`))
    }
    return ipcRenderer.invoke(channel, ...args)
  }
}

// Expone la API en el contexto global
try {
  contextBridge.exposeInMainWorld('api', api)
  console.log('✓ API preload expuesta correctamente')
} catch (error) {
  console.error('✗ Error al exponer API preload:', error)
}

export type ApiType = typeof api
