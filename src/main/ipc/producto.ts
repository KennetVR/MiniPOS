import { ipcMain } from 'electron'
import { getDb } from '../database'

interface Producto {
  id_producto?: number
  codigo_barras?: string
  nombre: string
  descripcion?: string
  id_categoria: number
  precio_compra: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  id_proveedor?: number
  estado?: number
}

interface ProductoConCategoria extends Producto {
  categoria_nombre?: string
  proveedor_nombre?: string
}

export function registerProductoHandlers(): void {
  ipcMain.handle('producto:getAll', async () => {
    try {
      const db = getDb()
      const productos = db.prepare(`
        SELECT p.*, c.nombre as categoria_nombre, pr.nombre as proveedor_nombre
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor
        WHERE p.estado = 1
        ORDER BY p.nombre
      `).all() as ProductoConCategoria[]
      return { success: true, data: productos }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('producto:getById', async (_, id: number) => {
    try {
      const db = getDb()
      const producto = db.prepare(`
        SELECT p.*, c.nombre as categoria_nombre
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = ?
      `).get(id) as ProductoConCategoria | undefined
      return { success: true, data: producto }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('producto:getByCodigoBarras', async (_, codigo: string) => {
    try {
      const db = getDb()
      const producto = db.prepare(`
        SELECT p.*, c.nombre as categoria_nombre
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        WHERE p.codigo_barras = ? AND p.estado = 1
      `).get(codigo) as ProductoConCategoria | undefined
      return { success: true, data: producto }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('producto:search', async (_, query: string) => {
    try {
      const db = getDb()
      const productos = db.prepare(`
        SELECT p.*, c.nombre as categoria_nombre
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        WHERE p.estado = 1 AND (
          p.nombre LIKE ? OR 
          p.codigo_barras LIKE ?
        )
        ORDER BY p.nombre
        LIMIT 20
      `).all(`%${query}%`, `%${query}%`) as ProductoConCategoria[]
      return { success: true, data: productos }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('producto:create', async (_, data: Producto) => {
    try {
      const db = getDb()
      
      if (data.codigo_barras) {
        const existente = db.prepare('SELECT id_producto FROM producto WHERE codigo_barras = ?').get(data.codigo_barras)
        if (existente) {
          return { success: false, error: 'El código de barras ya existe' }
        }
      }
      
      if (data.precio_venta < data.precio_compra) {
        return { success: false, error: 'El precio de venta debe ser mayor o igual al precio de compra' }
      }

      const result = db.prepare(`
        INSERT INTO producto (
          codigo_barras, nombre, descripcion, id_categoria, 
          precio_compra, precio_venta, stock_actual, stock_minimo, id_proveedor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.codigo_barras || null,
        data.nombre,
        data.descripcion || null,
        data.id_categoria,
        data.precio_compra,
        data.precio_venta,
        data.stock_actual,
        data.stock_minimo,
        data.id_proveedor || null
      )
      
      return { success: true, data: { id_producto: result.lastInsertRowid } }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('producto:update', async (_, id: number, data: Producto) => {
    try {
      const db = getDb()
      
      if (data.precio_venta < data.precio_compra) {
        return { success: false, error: 'El precio de venta debe ser mayor o igual al precio de compra' }
      }

      db.prepare(`
        UPDATE producto SET
          codigo_barras = ?, nombre = ?, descripcion = ?, id_categoria = ?,
          precio_compra = ?, precio_venta = ?, stock_minimo = ?, id_proveedor = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id_producto = ?
      `).run(
        data.codigo_barras || null,
        data.nombre,
        data.descripcion || null,
        data.id_categoria,
        data.precio_compra,
        data.precio_venta,
        data.stock_minimo,
        data.id_proveedor || null,
        id
      )
      
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('producto:delete', async (_, id: number) => {
    try {
      const db = getDb()
      db.prepare(`
        UPDATE producto SET estado = 0, updated_at = CURRENT_TIMESTAMP WHERE id_producto = ?
      `).run(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('producto:getBajoStock', async () => {
    try {
      const db = getDb()
      const productos = db.prepare(`
        SELECT p.*, c.nombre as categoria_nombre
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        WHERE p.estado = 1 AND p.stock_actual <= p.stock_minimo
        ORDER BY p.stock_actual ASC
      `).all() as ProductoConCategoria[]
      return { success: true, data: productos }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
