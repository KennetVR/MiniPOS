import { ipcMain } from 'electron'
import { getDb } from '../database'

export interface SyncQueueItem {
  id: number
  client_tx_id: string
  action: string
  payload: string
  attempts: number
  created_at: string
}

export function registerSyncHandlers(): void {
  ipcMain.handle('sync:getPending', async (_, limit = 10) => {
    try {
      const db = getDb()
      const items = db.prepare(`
        SELECT id, client_tx_id, action, payload, attempts, created_at
        FROM sync_queue
        WHERE status = 'pending'
        ORDER BY id ASC
        LIMIT ?
      `).all(limit) as SyncQueueItem[]
      return { success: true, data: items }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('sync:markSynced', async (_, clientTxId: string) => {
    try {
      const db = getDb()
      db.transaction(() => {
        db.prepare(`
          UPDATE sync_queue
          SET status = 'synced', synced_at = CURRENT_TIMESTAMP
          WHERE client_tx_id = ?
        `).run(clientTxId)

        db.prepare(`
          UPDATE venta
          SET sync_status = 'synced'
          WHERE client_tx_id = ?
        `).run(clientTxId)
      })()
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('sync:markFailed', async (_, clientTxId: string, errorMsg: string) => {
    try {
      const db = getDb()
      db.prepare(`
        UPDATE sync_queue
        SET attempts = attempts + 1, last_error = ?
        WHERE client_tx_id = ?
      `).run(String(errorMsg || 'Error desconocido'), clientTxId)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('sync:getStats', async () => {
    try {
      const db = getDb()
      const stats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM sync_queue WHERE status = 'pending') as pending,
          (SELECT COUNT(*) FROM sync_queue WHERE status = 'synced') as synced,
          (SELECT MAX(synced_at) FROM sync_queue WHERE status = 'synced') as last_synced
      `).get() as { pending: number; synced: number; last_synced: string | null }
      return { success: true, data: stats }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('sync:pullCatalog', async (_, productos: any[], categorias: any[]) => {
    try {
      const db = getDb()
      db.transaction(() => {
        if (Array.isArray(categorias) && categorias.length > 0) {
          const insertCat = db.prepare(`
            INSERT INTO categoria (id_categoria, nombre, descripcion, estado)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id_categoria) DO UPDATE SET
              nombre = excluded.nombre,
              descripcion = excluded.descripcion,
              estado = excluded.estado,
              updated_at = CURRENT_TIMESTAMP
          `)
          for (const cat of categorias) {
            insertCat.run(cat.id_categoria || cat.id, cat.nombre, cat.descripcion || null, cat.estado ? 1 : 0)
          }
        }

        if (Array.isArray(productos) && productos.length > 0) {
          const insertProd = db.prepare(`
            INSERT INTO producto (
              id_producto, codigo_barras, nombre, descripcion, id_categoria,
              precio_compra, precio_venta, stock_actual, stock_minimo, id_proveedor, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id_producto) DO UPDATE SET
              codigo_barras = excluded.codigo_barras,
              nombre = excluded.nombre,
              descripcion = excluded.descripcion,
              id_categoria = excluded.id_categoria,
              precio_compra = excluded.precio_compra,
              precio_venta = excluded.precio_venta,
              stock_actual = excluded.stock_actual,
              stock_minimo = excluded.stock_minimo,
              id_proveedor = excluded.id_proveedor,
              estado = excluded.estado,
              updated_at = CURRENT_TIMESTAMP
          `)
          for (const prod of productos) {
            insertProd.run(
              prod.id_producto || prod.id,
              prod.codigo_barras || null,
              prod.nombre,
              prod.descripcion || null,
              prod.id_categoria || 1,
              prod.precio_compra ?? 0,
              prod.precio_venta ?? 0,
              prod.stock_actual ?? prod.stock ?? 0,
              prod.stock_minimo ?? 5,
              prod.id_proveedor || null,
              prod.estado ?? (prod.activo ? 1 : 0)
            )
          }
        }
      })()
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}

