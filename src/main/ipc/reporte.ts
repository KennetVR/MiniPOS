import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerReporteHandlers(): void {
  ipcMain.handle('reporte:getDashboard', async () => {
    try {
      const db = getDb()
      const hoy = new Date().toISOString().split('T')[0]
      const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const ventasDia = db.prepare(`
        SELECT COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
        FROM venta WHERE estado = 'completada' AND DATE(created_at) = ?
      `).get(hoy) as { cantidad: number; total: number }

      const ventasMes = db.prepare(`
        SELECT COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
        FROM venta WHERE estado = 'completada' AND DATE(created_at) >= ?
      `).get(primerDiaMes) as { cantidad: number; total: number }

      const gananciasDia = db.prepare(`
        SELECT COALESCE(SUM((d.precio_unitario - p.precio_compra) * d.cantidad), 0) as ganancia
        FROM detalle_venta d
        JOIN venta v ON d.id_venta = v.id_venta
        JOIN producto p ON d.id_producto = p.id_producto
        WHERE v.estado = 'completada' AND DATE(v.created_at) = ?
      `).get(hoy) as { ganancia: number }

      const productosVendidosDia = db.prepare(`
        SELECT COALESCE(SUM(d.cantidad), 0) as total
        FROM detalle_venta d
        JOIN venta v ON d.id_venta = v.id_venta
        WHERE v.estado = 'completada' AND DATE(v.created_at) = ?
      `).get(hoy) as { total: number }

      const bajoStock = db.prepare(`
        SELECT COUNT(*) as count FROM producto 
        WHERE estado = 1 AND stock_actual <= stock_minimo
      `).get() as { count: number }

      const ticketPromedio = ventasDia.cantidad > 0 
        ? Number((ventasDia.total / ventasDia.cantidad).toFixed(2)) 
        : 0

      const margenGanancia = ventasDia.total > 0 
        ? Number(((gananciasDia.ganancia / ventasDia.total) * 100).toFixed(1))
        : 0

      return {
        success: true,
        data: {
          ventas_dia: ventasDia.total,
          ventas_dia_cantidad: ventasDia.cantidad,
          ventas_mes: ventasMes.total,
          ventas_mes_cantidad: ventasMes.cantidad,
          ganancias_dia: gananciasDia.ganancia,
          productos_vendidos_dia: productosVendidosDia.total,
          productos_bajo_stock: bajoStock.count,
          ticket_promedio: ticketPromedio,
          margen_ganancia: margenGanancia
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('reporte:getVentasPorHora', async () => {
    try {
      const db = getDb()
      const hoy = new Date().toISOString().split('T')[0]
      
      const ventas = db.prepare(`
        SELECT strftime('%H', created_at) as hora, 
               COUNT(*) as cantidad,
               SUM(total) as total
        FROM venta 
        WHERE estado = 'completada' AND DATE(created_at) = ?
        GROUP BY strftime('%H', created_at)
        ORDER BY hora
      `).all(hoy)

      return { success: true, data: ventas }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('reporte:getVentasPorDia', async (_, dias: number = 7) => {
    try {
      const db = getDb()
      
      const ventas = db.prepare(`
        SELECT DATE(created_at) as fecha,
               COUNT(*) as cantidad,
               SUM(total) as total
        FROM venta 
        WHERE estado = 'completada' AND created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
        ORDER BY fecha
      `).all(dias)

      return { success: true, data: ventas }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('reporte:getProductosMasVendidos', async (_, limite: number = 10) => {
    try {
      const db = getDb()
      const hoy = new Date().toISOString().split('T')[0]
      
      const productos = db.prepare(`
        SELECT p.id_producto, p.nombre, p.codigo_barras,
               SUM(d.cantidad) as cantidad_vendida,
               SUM(d.subtotal) as total_vendido
        FROM detalle_venta d
        JOIN venta v ON d.id_venta = v.id_venta
        JOIN producto p ON d.id_producto = p.id_producto
        WHERE v.estado = 'completada'
        GROUP BY p.id_producto
        ORDER BY cantidad_vendida DESC
        LIMIT ?
      `).all(limite)

      return { success: true, data: productos }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('reporte:getVentasPorCategoria', async () => {
    try {
      const db = getDb()
      
      const categorias = db.prepare(`
        SELECT c.nombre as categoria,
               SUM(d.cantidad) as cantidad,
               SUM(d.subtotal) as total
        FROM detalle_venta d
        JOIN venta v ON d.id_venta = v.id_venta
        JOIN producto p ON d.id_producto = p.id_producto
        JOIN categoria c ON p.id_categoria = c.id_categoria
        WHERE v.estado = 'completada'
        GROUP BY c.id_categoria
        ORDER BY total DESC
      `).all()

      return { success: true, data: categorias }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('reporte:getVentasPorFormaPago', async () => {
    try {
      const db = getDb()
      const hoy = new Date().toISOString().split('T')[0]
      
      const formas = db.prepare(`
        SELECT forma_pago,
               COUNT(*) as cantidad,
               SUM(total) as total
        FROM venta 
        WHERE estado = 'completada' AND DATE(created_at) = ?
        GROUP BY forma_pago
        ORDER BY total DESC
      `).all(hoy)

      return { success: true, data: formas }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('reporte:getEstadoResultados', async (_, fechaInicio: string, fechaFin: string) => {
    try {
      const db = getDb()
      
      const ingresos = db.prepare(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM ingreso
        WHERE fecha BETWEEN ? AND ?
      `).get(fechaInicio, fechaFin) as { total: number }

      const egresos = db.prepare(`
        SELECT tipo, COALESCE(SUM(monto), 0) as total
        FROM egreso
        WHERE fecha BETWEEN ? AND ?
        GROUP BY tipo
      `).all(fechaInicio, fechaFin) as { tipo: string; total: number }[]

      const totalEgresos = egresos.reduce((sum, e) => sum + e.total, 0)

      return {
        success: true,
        data: {
          total_ingresos: ingresos.total,
          egresos_por_tipo: egresos,
          total_egresos: totalEgresos,
          ganancia_neta: ingresos.total - totalEgresos
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('reporte:getFlujoCaja', async (_, fechaInicio: string, fechaFin: string) => {
    try {
      const db = getDb()
      
      const ingresos = db.prepare(`
        SELECT id_ingreso as id, fecha, concepto, monto as monto, 'ingreso' as tipo
        FROM ingreso
        WHERE fecha BETWEEN ? AND ?
        UNION ALL
        SELECT id_egreso as id, fecha, concepto, monto, 'egreso' as tipo
        FROM egreso
        WHERE fecha BETWEEN ? AND ?
        ORDER BY fecha DESC
      `).all(fechaInicio, fechaFin, fechaInicio, fechaFin)

      return { success: true, data: ingresos }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
