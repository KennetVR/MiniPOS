import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import bcrypt from 'bcryptjs'
import { getDb } from '../database'

interface Usuario {
  id_usuario: number
  username: string
  password: string
  nombre: string
  rol: string
  estado: number
}

type Session = { userId: number; role: string }

const sessions = new Map<number, Session>()

function hasAdminSession(event: IpcMainInvokeEvent): boolean {
  return sessions.get(event.sender.id)?.role === 'administrador'
}

function hasUserSession(event: IpcMainInvokeEvent, userId: number): boolean {
  const session = sessions.get(event.sender.id)
  return session?.userId === userId || session?.role === 'administrador'
}

function unauthorized() {
  return { success: false, error: 'No autorizado' }
}

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:login', async (event, username: string, password: string) => {
    try {
      const db = getDb()
      const user = db.prepare(`
        SELECT id_usuario, username, password, nombre, rol, estado 
        FROM usuario 
        WHERE username = ? AND estado = 1
      `).get(username) as Usuario | undefined

      if (!user) {
        return { success: false, error: 'Usuario no encontrado' }
      }

      const isValid = bcrypt.compareSync(password, user.password)
      if (!isValid) {
        return { success: false, error: 'Contraseña incorrecta' }
      }

      sessions.set(event.sender.id, { userId: user.id_usuario, role: user.rol })

      return {
        success: true,
        data: {
          id_usuario: user.id_usuario,
          username: user.username,
          nombre: user.nombre,
          rol: user.rol
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('auth:verifySession', async (event, userId: number) => {
    try {
      if (!hasUserSession(event, userId)) {
        return { success: true, data: null }
      }
      const db = getDb()
      const user = db.prepare(`
        SELECT id_usuario, username, nombre, rol 
        FROM usuario 
        WHERE id_usuario = ? AND estado = 1
      `).get(userId)
      
      return { success: true, data: user || null }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('auth:changePassword', async (event, userId: number, oldPassword: string, newPassword: string) => {
    try {
      if (!hasUserSession(event, userId)) {
        return unauthorized()
      }
      const db = getDb()
      const user = db.prepare('SELECT password FROM usuario WHERE id_usuario = ?').get(userId) as Usuario | undefined

      if (!user) {
        return { success: false, error: 'Usuario no encontrado' }
      }

      const isValid = bcrypt.compareSync(oldPassword, user.password)
      if (!isValid) {
        return { success: false, error: 'Contraseña actual incorrecta' }
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10)
      db.prepare('UPDATE usuario SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id_usuario = ?')
        .run(hashedPassword, userId)

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('usuario:getAll', async (event) => {
    try {
      if (!hasAdminSession(event)) return unauthorized()
      const db = getDb()
      const usuarios = db.prepare(`
        SELECT id_usuario, username, nombre, rol, estado, created_at
        FROM usuario
        ORDER BY nombre
      `).all()
      return { success: true, data: usuarios }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('usuario:create', async (event, data: { username: string; password: string; nombre: string; rol: string }) => {
    try {
      if (!hasAdminSession(event)) return unauthorized()
      const db = getDb()
      const hashedPassword = bcrypt.hashSync(data.password, 10)
      
      const result = db.prepare(`
        INSERT INTO usuario (username, password, nombre, rol)
        VALUES (?, ?, ?, ?)
      `).run(data.username, hashedPassword, data.nombre, data.rol)

      return { success: true, data: { id_usuario: result.lastInsertRowid } }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('usuario:update', async (event, id: number, data: { nombre: string; rol: string; password?: string }) => {
    try {
      if (!hasAdminSession(event)) return unauthorized()
      const db = getDb()
      
      if (data.password) {
        const hashedPassword = bcrypt.hashSync(data.password, 10)
        db.prepare(`
          UPDATE usuario SET nombre = ?, rol = ?, password = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id_usuario = ?
        `).run(data.nombre, data.rol, hashedPassword, id)
      } else {
        db.prepare(`
          UPDATE usuario SET nombre = ?, rol = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id_usuario = ?
        `).run(data.nombre, data.rol, id)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('usuario:toggleEstado', async (event, id: number) => {
    try {
      if (!hasAdminSession(event)) return unauthorized()
      const db = getDb()
      db.prepare(`
        UPDATE usuario SET estado = CASE WHEN estado = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP
        WHERE id_usuario = ?
      `).run(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
