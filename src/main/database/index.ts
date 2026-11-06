import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'
import { runMigrations } from './migrations'
import { runSeeders } from './seeders'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const basePath = app.isPackaged 
      ? path.join(path.dirname(app.getPath('exe')), 'data')
      : path.join(process.cwd(), 'data')
    
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true })
    }
    
    const dbPath = path.join(basePath, 'minipos.db')
    console.log('DB Path:', dbPath)
    
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDatabase(): void {
  const database = getDb()
  runMigrations(database)
  runSeeders(database)
  console.log('Base de datos inicializada')
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = undefined as unknown as Database.Database
  }
}
