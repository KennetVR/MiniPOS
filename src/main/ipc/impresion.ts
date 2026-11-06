import { ipcMain, BrowserWindow } from 'electron'
type TicketData = {
  venta: any
  detalles: any[]
  config: Record<string, string>
}

export function registerImpresionHandlers(): void {
  ipcMain.handle('impresion:printTicket', async (event, data: TicketData) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) {
        return { success: false, error: 'Ventana no encontrada' }
      }

      const html = generarHtmlBoleta(data.venta, data.detalles, data.config)
      
      const printWin = new BrowserWindow({
        width: 300,
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      
      printWin.webContents.print({
        silent: false,
        printBackground: true,
        deviceName: ''
      }, (success, error) => {
        printWin.close()
        if (!success) {
          console.error('Error printing:', error)
        }
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('impresion:getPrinters', async () => {
    try {
      const { webContents } = BrowserWindow.getAllWindows()[0]
      const printers = await webContents.getPrinters()
      return { success: true, data: printers }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}

function generarHtmlBoleta(venta: any, detalles: any[], config: Record<string, string>): string {
  const nombreNegocio = config.nombre_negocio || 'MI NEGOCIO'
  const ruc = config.ruc || ''
  const direccion = config.direccion || ''
  const telefono = config.telefono || ''
  const mensaje = config.mensaje_boleta || '¡Gracias por su compra!'
  const moneda = config.moneda || 'S/'

  const fecha = new Date(venta.created_at).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  let productosHtml = ''
  for (const item of detalles) {
    productosHtml += `
      <tr>
        <td style="text-align:left">${item.cantidad}x</td>
        <td style="text-align:left;max-width:150px;overflow:hidden;text-overflow:ellipsis">${item.producto_nombre}</td>
        <td style="text-align:right">${formatearNumero(item.precio_unitario, moneda)}</td>
        <td style="text-align:right">${formatearNumero(item.subtotal, moneda)}</td>
      </tr>
    `
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 0; size: 80mm auto; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 80mm;
      margin: 0;
      padding: 5px;
      box-sizing: border-box;
    }
    .header { text-align: center; margin-bottom: 10px; }
    .header h1 { font-size: 16px; margin: 0; }
    .header p { margin: 2px 0; font-size: 10px; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .info { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 4px; vertical-align: top; }
    .totals { margin-top: 10px; }
    .totals tr td { padding: 2px 0; }
    .totals .grand-total { font-weight: bold; font-size: 14px; }
    .footer { text-align: center; margin-top: 15px; font-size: 11px; }
    .footer p { margin: 3px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${nombreNegocio}</h1>
    <p>RUC: ${ruc}</p>
    <p>${direccion}</p>
    <p>Tel: ${telefono}</p>
  </div>
  
  <div class="divider"></div>
  
  <div class="info">
    <p><strong>BOLETA N°:</strong> ${venta.numero_boleta}</p>
    <p>Fecha: ${fecha}</p>
    <p>Cajero: ${venta.usuario_nombre}</p>
  </div>
  
  <div class="divider"></div>
  
  <table>
    <thead>
      <tr>
        <th style="text-align:left">Cant</th>
        <th style="text-align:left">Producto</th>
        <th style="text-align:right">P.Unit</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${productosHtml}
    </tbody>
  </table>
  
  <div class="divider"></div>
  
  <table class="totals">
    <tr>
      <td>Subtotal:</td>
      <td style="text-align:right">${formatearNumero(venta.subtotal, moneda)}</td>
    </tr>
    ${venta.descuento > 0 ? `
    <tr>
      <td>Descuento:</td>
      <td style="text-align:right">-${formatearNumero(venta.descuento, moneda)}</td>
    </tr>
    ` : ''}
    <tr>
      <td>IGV (18%):</td>
      <td style="text-align:right">${formatearNumero(venta.igv, moneda)}</td>
    </tr>
    <tr class="grand-total">
      <td>TOTAL:</td>
      <td style="text-align:right">${formatearNumero(venta.total, moneda)}</td>
    </tr>
  </table>
  
  <div class="divider"></div>
  
  <p style="text-align:center"><strong>Forma de pago:</strong> ${venta.forma_pago}</p>
  
  <div class="footer">
    <div class="divider"></div>
    <p>${mensaje}</p>
    <p>━━━━━━━━━━━━━━━━━━━━━━━━</p>
  </div>
</body>
</html>
  `
}

function formatearNumero(valor: number, moneda: string): string {
  return `${moneda} ${valor.toFixed(2)}`
}
