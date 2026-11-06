import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerConfiguracionHandlers(): void {
  ipcMain.handle('configuracion:getAll', async () => {
    try {
      const db = getDb()
      const configs = db.prepare('SELECT * FROM configuracion ORDER BY clave').all()
      return { success: true, data: configs }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('configuracion:get', async (_, clave: string) => {
    try {
      const db = getDb()
      const config = db.prepare('SELECT * FROM configuracion WHERE clave = ?').get(clave)
      return { success: true, data: config }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('configuracion:update', async (_, data: { clave: string; valor: string }) => {
    try {
      const db = getDb()
      db.prepare(`
        UPDATE configuracion SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE clave = ?
      `).run(data.valor, data.clave)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('configuracion:updateMultiple', async (_, configs: { clave: string; valor: string }[]) => {
    try {
      const db = getDb()
      const update = db.prepare(`
        UPDATE configuracion SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE clave = ?
      `)
      
      const updateAll = db.transaction((items: { clave: string; valor: string }[]) => {
        for (const item of items) {
          update.run(item.valor, item.clave)
        }
      })
      
      updateAll(configs)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('egreso:getAll', async (_, filtros?: { fechaInicio?: string; fechaFin?: string; tipo?: string }) => {
    try {
      const db = getDb()
      let query = `
        SELECT e.*, u.nombre as usuario_nombre, p.nombre as proveedor_nombre
        FROM egreso e
        LEFT JOIN usuario u ON e.id_usuario = u.id_usuario
        LEFT JOIN proveedor p ON e.id_proveedor = p.id_proveedor
        WHERE 1=1
      `
      const params: unknown[] = []

      if (filtros?.fechaInicio) {
        query += ' AND e.fecha >= ?'
        params.push(filtros.fechaInicio)
      }
      if (filtros?.fechaFin) {
        query += ' AND e.fecha <= ?'
        params.push(filtros.fechaFin)
      }
      if (filtros?.tipo) {
        query += ' AND e.tipo = ?'
        params.push(filtros.tipo)
      }

      query += ' ORDER BY e.fecha DESC'

      const egresos = db.prepare(query).all(...params)
      return { success: true, data: egresos }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('egreso:create', async (_, data: { fecha: string; tipo: string; concepto: string; monto: number; comprobante?: string; beneficiario?: string; id_usuario: number }) => {
    try {
      const db = getDb()
      const result = db.prepare(`
        INSERT INTO egreso (fecha, tipo, concepto, monto, comprobante, beneficiario, id_usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(data.fecha, data.tipo, data.concepto, data.monto, data.comprobante || null, data.beneficiario || null, data.id_usuario)

      return { success: true, data: { id_egreso: result.lastInsertRowid } }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('ingreso:getAll', async (_, filtros?: { fechaInicio?: string; fechaFin?: string }) => {
    try {
      const db = getDb()
      let query = `
        SELECT i.*, u.nombre as usuario_nombre
        FROM ingreso i
        LEFT JOIN usuario u ON i.id_usuario = u.id_usuario
        WHERE 1=1
      `
      const params: unknown[] = []

      if (filtros?.fechaInicio) {
        query += ' AND i.fecha >= ?'
        params.push(filtros.fechaInicio)
      }
      if (filtros?.fechaFin) {
        query += ' AND i.fecha <= ?'
        params.push(filtros.fechaFin)
      }

      query += ' ORDER BY i.fecha DESC'

      const ingresos = db.prepare(query).all(...params)
      return { success: true, data: ingresos }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
