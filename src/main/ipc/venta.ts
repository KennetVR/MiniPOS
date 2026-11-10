import { ipcMain } from 'electron'
import crypto from 'crypto'
import { getDb } from '../database'

interface VentaDetalle {
  id_producto: number
  cantidad: number
  precio_unitario: number
  descuento?: number
}

interface CrearVentaData {
  id_usuario: string | number
  client_tx_id?: string
  detalles: VentaDetalle[]
  forma_pago: string
  descuento?: number
}

export function registerVentaHandlers(): void {
  ipcMain.handle('venta:crear', async (_, data: unknown) => {
    try {
      const db = getDb()

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Datos de venta inválidos')
      }
      const ventaData = data as Partial<CrearVentaData>
      const hasValidUser = typeof ventaData.id_usuario === 'string'
        ? ventaData.id_usuario.trim().length > 0
        : Number.isSafeInteger(ventaData.id_usuario) && ventaData.id_usuario! > 0

      if (!hasValidUser ||
          typeof ventaData.forma_pago !== 'string' || !ventaData.forma_pago.trim() ||
          !Array.isArray(ventaData.detalles) || ventaData.detalles.length === 0 ||
          (ventaData.descuento !== undefined &&
            (typeof ventaData.descuento !== 'number' || !Number.isFinite(ventaData.descuento) || ventaData.descuento < 0))) {
        throw new Error('Datos de venta inválidos')
      }

      const clientTxId = (typeof ventaData.client_tx_id === 'string' && ventaData.client_tx_id.trim())
        || crypto.randomUUID()
      const idUsuarioStr = String(ventaData.id_usuario)
      
      return db.transaction(() => {
        // Idempotencia: si ya existe venta con este client_tx_id, retornar la existente
        const existing = db.prepare(`
          SELECT id_venta, numero_boleta, total FROM venta WHERE client_tx_id = ?
        `).get(clientTxId) as { id_venta: number; numero_boleta: string; total: number } | undefined

        if (existing) {
          return { success: true, data: { id_venta: existing.id_venta, numero_boleta: existing.numero_boleta, total: existing.total, client_tx_id: clientTxId } }
        }

        const detalles = ventaData.detalles!.map((rawDetalle) => {
          if (!rawDetalle || typeof rawDetalle !== 'object' || Array.isArray(rawDetalle)) {
            throw new Error('Detalle de venta inválido')
          }
          const detalle = rawDetalle as VentaDetalle
          if (!Number.isSafeInteger(detalle.id_producto) || detalle.id_producto <= 0 ||
              !Number.isSafeInteger(detalle.cantidad) || detalle.cantidad <= 0 ||
              (detalle.descuento !== undefined &&
                (typeof detalle.descuento !== 'number' || !Number.isFinite(detalle.descuento) || detalle.descuento < 0))) {
            throw new Error('Detalle de venta inválido')
          }

          let precioUnitario = detalle.precio_unitario
          const producto = db.prepare(`
            SELECT precio_venta, stock_actual FROM producto
            WHERE id_producto = ? AND estado = 1
          `).get(detalle.id_producto) as { precio_venta: number; stock_actual: number } | undefined

          if (producto && Number.isFinite(producto.precio_venta)) {
            precioUnitario = producto.precio_venta
          }

          if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
            throw new Error(`Precio inválido para el producto ${detalle.id_producto}`)
          }

          const descuentoItem = (detalle.descuento ?? 0) * detalle.cantidad
          const brutoItem = precioUnitario * detalle.cantidad
          const subtotalItem = brutoItem - descuentoItem

          if (!Number.isFinite(brutoItem) || !Number.isFinite(subtotalItem) || subtotalItem < 0 || descuentoItem > brutoItem) {
            throw new Error(`Cantidad o descuento inválido para el producto ${detalle.id_producto}`)
          }

          return { id_producto: detalle.id_producto, cantidad: detalle.cantidad, precio_unitario: precioUnitario, descuento: detalle.descuento ?? 0, subtotal: subtotalItem }
        })

        const subtotal = detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0)
        if (!Number.isFinite(subtotal)) throw new Error('Datos de venta inválidos')
        
        const descuento = ventaData.descuento ?? 0
        if (descuento > subtotal * 0.5) throw new Error('El descuento no puede exceder el 50% del subtotal')
        const subtotalConDescuento = subtotal - descuento
        const igv = subtotalConDescuento * 0.18
        const total = subtotalConDescuento + igv
        if (!Number.isFinite(igv) || !Number.isFinite(total)) throw new Error('Datos de venta inválidos')

        const year = new Date().getFullYear()
        const lastBoleta = db.prepare(`
          SELECT numero_boleta FROM venta 
          WHERE numero_boleta LIKE ? 
          ORDER BY id_venta DESC LIMIT 1
        `).get(`B001-%`) as { numero_boleta: string } | undefined
        
        let correlativo = 1
        if (lastBoleta) {
          const parts = lastBoleta.numero_boleta.split('-')
          if (parts[1]) {
            const num = parseInt(parts[1], 10)
            if (!Number.isNaN(num)) correlativo = num + 1
          }
        }
        const numeroBoleta = `B001-${String(correlativo).padStart(6, '0')}`

        const resultVenta = db.prepare(`
          INSERT INTO venta (
            numero_boleta, id_usuario, subtotal, descuento, igv, total, forma_pago, client_tx_id, sync_status, id_usuario_auth
          ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `).run(numeroBoleta, subtotal, descuento, igv, total, ventaData.forma_pago, clientTxId, idUsuarioStr)
        
        const idVenta = Number(resultVenta.lastInsertRowid)

        for (const detalle of detalles) {
          db.prepare(`
            INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, descuento, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            idVenta,
            detalle.id_producto,
            detalle.cantidad,
            detalle.precio_unitario,
            detalle.descuento || 0,
            detalle.subtotal
          )

          // Descontar stock local si el producto está registrado en SQLite
          db.prepare(`
            UPDATE producto
            SET stock_actual = max(0, stock_actual - ?), updated_at = CURRENT_TIMESTAMP
            WHERE id_producto = ?
          `).run(detalle.cantidad, detalle.id_producto)
        }

        // Encolar en Outbox para sincronización asíncrona hacia Supabase
        db.prepare(`
          INSERT OR IGNORE INTO sync_queue (client_tx_id, action, payload, status)
          VALUES (?, 'create_sale', ?, 'pending')
        `).run(clientTxId, JSON.stringify({
          client_tx_id: clientTxId,
          id_usuario: idUsuarioStr,
          detalles: detalles.map((d) => ({ id_producto: d.id_producto, cantidad: d.cantidad, descuento: d.descuento })),
          forma_pago: ventaData.forma_pago,
          descuento: descuento
        }))

        db.prepare(`
          INSERT INTO ingreso (fecha, concepto, monto, forma_pago, id_venta, id_usuario)
          VALUES (date('now'), ?, ?, ?, ?, 1)
        `).run(`Venta ${numeroBoleta}`, total, ventaData.forma_pago, idVenta)

        return { success: true, data: { id_venta: idVenta, numero_boleta: numeroBoleta, total, client_tx_id: clientTxId } }
      })()
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('venta:getAll', async (_, filtros?: { fecha?: string; estado?: string }) => {
    try {
      const db = getDb()
      let query = `
        SELECT v.*, u.nombre as usuario_nombre
        FROM venta v
        LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
        WHERE 1=1
      `
      const params: unknown[] = []

      if (filtros?.fecha) {
        query += ` AND DATE(v.created_at) = ?`
        params.push(filtros.fecha)
      }
      if (filtros?.estado) {
        query += ` AND v.estado = ?`
        params.push(filtros.estado)
      }

      query += ` ORDER BY v.created_at DESC`

      const ventas = db.prepare(query).all(...params)
      return { success: true, data: ventas }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('venta:getById', async (_, id: number) => {
    try {
      const db = getDb()
      const venta = db.prepare(`
        SELECT v.*, u.nombre as usuario_nombre
        FROM venta v
        LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
        WHERE v.id_venta = ?
      `).get(id)

      if (!venta) {
        return { success: false, error: 'Venta no encontrada' }
      }

      const detalles = db.prepare(`
        SELECT dv.*, p.nombre as producto_nombre, p.codigo_barras
        FROM detalle_venta dv
        LEFT JOIN producto p ON dv.id_producto = p.id_producto
        WHERE dv.id_venta = ?
      `).all(id)

      return { success: true, data: { ...venta as object, detalles } }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('venta:anular', async (_, id: number, id_usuario: number, motivo: string) => {
    try {
      const db = getDb()
      
      return db.transaction(() => {
        const venta = db.prepare('SELECT * FROM venta WHERE id_venta = ? AND estado = ?').get(id, 'completada')
        if (!venta) {
          return { success: false, error: 'Venta no encontrada o ya anulada' }
        }

        const detalles = db.prepare('SELECT * FROM detalle_venta WHERE id_venta = ?').all(id) as { id_producto: number; cantidad: number }[]
        
        for (const detalle of detalles) {
          db.prepare(`
            UPDATE producto SET stock_actual = stock_actual + ?, updated_at = CURRENT_TIMESTAMP
            WHERE id_producto = ?
          `).run(detalle.cantidad, detalle.id_producto)
        }

        db.prepare(`
          UPDATE venta SET estado = 'anulada', motivo_anulacion = ?, fecha_anulacion = CURRENT_TIMESTAMP
          WHERE id_venta = ?
        `).run(motivo, id)

        return { success: true }
      })()
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('venta:getEstadisticas', async (_, periodo: 'dia' | 'mes') => {
    try {
      const db = getDb()
      const fechaFilter = periodo === 'dia' 
        ? "DATE(created_at) = DATE('now')"
        : "strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"

      const totalVentas = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
        FROM venta WHERE estado = 'completada' AND ${fechaFilter}
      `).get() as { count: number; total: number }

      const productosVendidos = db.prepare(`
        SELECT COALESCE(SUM(dv.cantidad), 0) as total
        FROM detalle_venta dv
        JOIN venta v ON dv.id_venta = v.id_venta
        WHERE v.estado = 'completada' AND ${fechaFilter}
      `).get() as { total: number }

      const ticketPromedio = totalVentas.count > 0 ? totalVentas.total / totalVentas.count : 0

      return {
        success: true,
        data: {
          cantidad_ventas: totalVentas.count,
          total_ventas: totalVentas.total,
          productos_vendidos: productosVendidos.total,
          ticket_promedio: ticketPromedio
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('config:get', async (_, clave: string) => {
    try {
      const db = getDb()
      const config = db.prepare('SELECT valor FROM configuracion WHERE clave = ?').get(clave) as { valor: string } | undefined
      return { success: true, data: config?.valor || null }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
