import { ipcMain } from 'electron'
import { getDb } from '../database'

interface Categoria {
  id_categoria?: number
  nombre: string
  descripcion?: string
  estado?: number
}

export function registerCategoriaHandlers(): void {
  ipcMain.handle('categoria:getAll', async () => {
    try {
      const db = getDb()
      const categorias = db.prepare(`
        SELECT id_categoria, nombre, descripcion, estado, created_at, updated_at 
        FROM categoria 
        WHERE estado = 1 
        ORDER BY nombre
      `).all()
      return { success: true, data: categorias }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('categoria:getById', async (_, id: number) => {
    try {
      const db = getDb()
      const categoria = db.prepare('SELECT * FROM categoria WHERE id_categoria = ?').get(id)
      return { success: true, data: categoria }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('categoria:create', async (_, data: Categoria) => {
    try {
      const db = getDb()
      const result = db.prepare(`
        INSERT INTO categoria (nombre, descripcion) 
        VALUES (?, ?)
      `).run(data.nombre, data.descripcion || null)
      
      return { success: true, data: { id_categoria: result.lastInsertRowid } }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('categoria:update', async (_, id: number, data: Categoria) => {
    try {
      const db = getDb()
      db.prepare(`
        UPDATE categoria 
        SET nombre = ?, descripcion = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id_categoria = ?
      `).run(data.nombre, data.descripcion || null, id)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('categoria:delete', async (_, id: number) => {
    try {
      const db = getDb()
      db.prepare(`
        UPDATE categoria SET estado = 0, updated_at = CURRENT_TIMESTAMP WHERE id_categoria = ?
      `).run(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
