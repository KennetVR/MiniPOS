import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

let db: Database.Database
let dbPath: string

function getDbPath(): string {
  if (dbPath) return dbPath
  
  const basePath = app.isPackaged 
    ? path.join(path.dirname(app.getPath('exe')), 'data')
    : path.join(process.cwd(), 'data')
  
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true })
  }
  
  dbPath = path.join(basePath, 'minipos.db')
  return dbPath
}

export function getDb(): Database.Database {
  if (!db) {
    const dbFile = getDbPath()
    console.log('DB Path:', dbFile)
    db = new Database(dbFile)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = undefined as unknown as Database.Database
  }
}

export { getDbPath }
